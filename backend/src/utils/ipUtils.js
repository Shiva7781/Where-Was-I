// RFC 1918 + loopback + link-local + CGNAT (100.64/10)
const PRIVATE_V4 = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];

const PRIVATE_V6 = [
  /^::1$/,
  /^f[cd][0-9a-f]{2}:/i, // fc00::/7 ULA
  /^fe80:/i,
  /^::$/,
];

const isPrivateIP = (ip) => {
  if (!ip) return true;
  const ranges = ip.includes(':') ? PRIVATE_V6 : PRIVATE_V4;
  return ranges.some((r) => r.test(ip));
};

const isLocalhost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  hostname.endsWith('.localhost') ||
  hostname.endsWith('.local');

const extractHostname = (url) => {
  try {
    const { protocol, hostname } = new URL(url);
    if (!['http:', 'https:'].includes(protocol)) return null;
    return hostname.toLowerCase();
  } catch {
    return null;
  }
};

// Strip query string and fragment — we don't need to store those
const sanitizeURL = (url) => {
  try {
    const { protocol, host, pathname } = new URL(url);
    return `${protocol}//${host}${pathname}`;
  } catch {
    return url;
  }
};

module.exports = { isPrivateIP, isLocalhost, extractHostname, sanitizeURL };
