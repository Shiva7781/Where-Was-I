require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const visitsRouter = require('./routes/visits');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    // Chrome extension IDs differ per browser profile/machine; allow all chrome-extension
    // origins unconditionally — the Bearer API key is the actual auth gate.
    if (!origin || origin.startsWith('chrome-extension://')) return callback(null, true);
    if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

io.on('connection', (socket) => {
  console.log(`[socket.io] connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket.io] disconnected: ${socket.id}`));
});

app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '16kb' }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests.' },
  })
);

// tighter limit on the ingest endpoint
app.use(
  '/api/visits',
  rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false })
);

app.use('/api/visits', visitsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error('[express]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();

const shutdown = () => {
  server.close(() => {
    require('mongoose').connection.close(false, () => process.exit(0));
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
