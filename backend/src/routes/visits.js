const express = require('express');
const Joi = require('joi');
const Visit = require('../models/Visit');
const { resolveAndGeolocate } = require('../services/geoService');
const { authenticate } = require('../middleware/auth');
const { extractHostname, sanitizeURL } = require('../utils/ipUtils');

const router = express.Router();

const visitSchema = Joi.object({
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required(),
  timestamp: Joi.date().iso().optional(),
});

router.post('/', authenticate, async (req, res) => {
  const { error, value } = visitSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const hostname = extractHostname(value.url);
  if (!hostname) return res.status(400).json({ success: false, error: 'Invalid or non-HTTP URL' });

  const visit = new Visit({
    url: sanitizeURL(value.url),
    domain: hostname,
    timestamp: value.timestamp ? new Date(value.timestamp) : new Date(),
    geoStatus: 'failed',
  });

  try {
    await visit.save();

    // Respond immediately; resolve geo in background so the extension isn't blocked
    resolveAndGeolocate(hostname)
      .then(async (geo) => {
        Object.assign(visit, geo);
        await visit.save();
        const io = req.app.get('io');
        if (io) io.emit('new-visit', visit.toObject());
      })
      .catch((err) => console.error('[visits] geo error:', err.message));

    res.status(201).json({ success: true, id: visit._id });
  } catch (err) {
    console.error('[visits] save error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save visit' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { date, page = 1, limit = 200, domain, geoStatus } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date, expected YYYY-MM-DD' });
      }
      filter.timestamp = { $gte: start, $lte: new Date(`${date}T23:59:59.999Z`) };
    }

    if (domain) filter.domain = { $regex: domain, $options: 'i' };
    if (geoStatus) filter.geoStatus = geoStatus;

    const take = Math.min(500, parseInt(limit));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const [visits, total] = await Promise.all([
      Visit.find(filter).sort({ timestamp: 1 }).skip(skip).limit(take).lean(),
      Visit.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: parseInt(page), limit: take, data: visits });
  } catch (err) {
    console.error('[visits] GET error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch visits' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query.date);

    const [countryStats, totalVisits, uniqueDomains, hourlyRaw] = await Promise.all([
      Visit.aggregate([
        { $match: { ...dateFilter, geoStatus: 'resolved', countryCode: { $ne: null } } },
        { $group: { _id: '$countryCode', country: { $first: '$country' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      Visit.countDocuments(dateFilter),
      Visit.distinct('domain', dateFilter).then((d) => d.length),
      Visit.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const hourlyBreakdown = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourlyRaw.find((x) => x._id === h)?.count ?? 0,
    }));

    res.json({
      success: true,
      data: {
        totalVisits,
        uniqueDomains,
        topCountries: countryStats.map((c) => ({ code: c._id, name: c.country || c._id, count: c.count })),
        hourlyBreakdown,
      },
    });
  } catch (err) {
    console.error('[visits] stats error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to compute stats' });
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query.date);

    const data = await Visit.aggregate([
      { $match: { ...dateFilter, geoStatus: 'resolved', countryCode: { $ne: null } } },
      { $group: { _id: '$countryCode', country: { $first: '$country' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: data.map((d) => ({ code: d._id, name: d.country || d._id, count: d.count })),
    });
  } catch (err) {
    console.error('[visits] heatmap error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to compute heatmap' });
  }
});

router.delete('/', authenticate, async (req, res) => {
  try {
    const result = await Visit.deleteMany({});
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete visits' });
  }
});

function buildDateFilter(date) {
  if (!date) return {};
  const start = new Date(`${date}T00:00:00.000Z`);
  if (isNaN(start.getTime())) return {};
  return { timestamp: { $gte: start, $lte: new Date(`${date}T23:59:59.999Z`) } };
}

module.exports = router;
