/*
 * Sample configuration file for shrtn.js
 *
 * Copy/Rename to `config.js` and adapt for local configuration
 * See README for documentation of parameters
 */
module.exports = {
  http: {
    address: '127.0.0.1',
    port: 8080,
    enableCORS: true,
    CORS: {
      allowOrigin: '*',
      allowHeaders: 'X-Requested-With',
      allowMethods: 'GET',
      maxAge: 86400,
    },
    enableJSONP: false,
  },
  db: {
    host: 'localhost',
    port: 5432,
    user: 'shrtn',
    password: 'shrtn',
    database: 'shrtn'
  },
  hash: {
    urlPrefix: 'http://localhost:8080/',
    length: 5,
    caseSensitive: true,
    decimals: true,
    // or: range: 'abcABC123',
    allowRequest: true,
    requestPattern: /^[a-zA-Z0-9]{3,10}$/,
    blacklist: []
  },
  urlLimit: {
    hostnameWhitelist: [],
    hostnameBlacklist: [],
    allowedProtocols: ['http:', 'https:']
  },
  qrcode: {
    enabled: true,
    errorCorrectionLevel: 3, // = qrc.EC_H (H [highest] - Q - M - L [lowest])
    defaultDotSize: 10, // 'bit' square size in px
    minDotSize: 1,
    maxDotSize: 40,
    marginDots: 0
  }
};
