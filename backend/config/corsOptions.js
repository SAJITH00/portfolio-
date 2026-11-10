const normalizeConfiguredOrigin = (value) => {
  const parsed = new URL(value);
  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('FRONTEND_URL entries must be origins without paths, queries, or fragments.');
  }
  return parsed.origin;
};

const createCorsOptions = ({ frontendUrl = '', environment, port }) => {
  const configuredOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeConfiguredOrigin);
  const developmentOrigins = environment === 'production'
    ? []
    : [port, '5500', '3000'].flatMap((originPort) => [
      `http://localhost:${originPort}`,
      `http://127.0.0.1:${originPort}`,
    ]);
  const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error(`CORS origin policy blocked request from ${origin}`);
      error.code = 'CORS_ORIGIN_BLOCKED';
      callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
};

module.exports = createCorsOptions;
