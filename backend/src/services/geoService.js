const dns = require('dns').promises;
const geoip = require('geoip-lite');
const { isPrivateIP, isLocalhost } = require('../utils/ipUtils');

// dns.resolve4 gives authoritative A records; dns.lookup falls back to the OS
// resolver which handles CNAME chains and returns AAAA when there's no A record.
const resolveIP = async (hostname) => {
  try {
    const addresses = await dns.resolve4(hostname);
    if (addresses?.length) return addresses[0];
  } catch (_) {}

  const result = await dns.lookup(hostname, { all: false });
  return result.address;
};

const resolveAndGeolocate = async (hostname) => {
  const empty = { lat: null, lng: null, country: null, countryCode: null, city: null, region: null, timezone: null };

  if (isLocalhost(hostname)) {
    return { ...empty, ip: '127.0.0.1', isPrivate: true, geoStatus: 'private' };
  }

  let ip;
  try {
    ip = await resolveIP(hostname);
  } catch (err) {
    console.warn(`[geo] DNS failed for ${hostname}: ${err.message}`);
    return { ...empty, ip: null, isPrivate: false, geoStatus: 'failed' };
  }

  if (isPrivateIP(ip)) {
    return { ...empty, ip, isPrivate: true, geoStatus: 'private' };
  }

  const geo = geoip.lookup(ip);

  if (!geo?.ll?.length) {
    console.warn(`[geo] no data for ${ip} (${hostname})`);
    return { ...empty, ip, countryCode: geo?.country ?? null, timezone: geo?.timezone ?? null, isPrivate: false, geoStatus: 'failed' };
  }

  return {
    ip,
    lat: geo.ll[0],
    lng: geo.ll[1],
    country: COUNTRY_NAMES[geo.country] || geo.country,
    countryCode: geo.country,
    city: geo.city || null,
    region: geo.region || null,
    timezone: geo.timezone || null,
    isPrivate: false,
    geoStatus: 'resolved',
  };
};

const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  JP: 'Japan', CN: 'China', IN: 'India', CA: 'Canada', AU: 'Australia',
  BR: 'Brazil', RU: 'Russia', KR: 'South Korea', NL: 'Netherlands',
  SG: 'Singapore', SE: 'Sweden', NO: 'Norway', CH: 'Switzerland',
  IE: 'Ireland', IT: 'Italy', ES: 'Spain', PL: 'Poland', FI: 'Finland',
  DK: 'Denmark', AT: 'Austria', BE: 'Belgium', CZ: 'Czech Republic',
  HU: 'Hungary', RO: 'Romania', ZA: 'South Africa', MX: 'Mexico',
  AR: 'Argentina', CL: 'Chile', CO: 'Colombia', TR: 'Turkey',
  TH: 'Thailand', VN: 'Vietnam', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', PK: 'Pakistan', BD: 'Bangladesh', NG: 'Nigeria',
  EG: 'Egypt', UA: 'Ukraine', IL: 'Israel', SA: 'Saudi Arabia',
  AE: 'United Arab Emirates', NZ: 'New Zealand', PT: 'Portugal',
  GR: 'Greece', HK: 'Hong Kong', TW: 'Taiwan',
};

module.exports = { resolveAndGeolocate };
