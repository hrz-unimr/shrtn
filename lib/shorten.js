var URL = require('url');
var crypto = require('crypto');

var qrc = require('qrc');

/*
*   check if string matches against any pattern or string in list
*/
var inList = function (str, list) {
  if (list.length === 0) {
    return false;
  }
  return list.some(function(pattern) {
    if (typeof pattern === 'string') { // pattern is a normal string
      return (str === pattern);
    } else {
      return pattern.test(str); // pattern is a regex
    }
  });
};


/*
 * send response in appropriate format (json, txt, qrcode)
 */
var sendResponse = function (req, res, hash, longUrl, newHash) {
  var config = req.app.get('config');
  if (req.query.format === 'txt') {
    res.type('txt');
    return res.send(200, config.hash.urlPrefix + hash);
  } else if (req.query.format === 'qrcode') {
    if (config.qrcode.enabled !== true) {
      return res.send(403);
    } else {
      var qrcodeSize = config.qrcode.defaultDotSize;
      if (req.query.size !== undefined &&
          parseInt(req.query.size, 10) >= config.qrcode.minDotSize &&
          parseInt(req.query.size, 10) <= config.qrcode.maxDotSize) {
        qrcodeSize = parseInt(req.query.size, 10);
      }
      try {
        var qrCode = qrc.encodePng(
          config.hash.urlPrefix + hash,
          {
            ecLevel: config.qrcode.errorCorrectionLevel,
            dotSize: qrcodeSize,
            margin: config.qrcode.marginDots
          }
        );
        if (qrCode.version !== undefined) {
          res.type('png');
          res.send(200, qrCode.data);
        }
      } catch (e) {
        res.send(500);
      }
    }
  } else {
    return res.jsonp({
      'hash': hash,
      'url': config.hash.urlPrefix + hash,
      'longUrl': longUrl,
      'newHash': newHash
    });
  }
};


var shorten = function (req, res, next) {
  var config = req.app.get('config');
  var db = req.app.get('db');
  var url;

  // perform request validation:
  // 1) request hash (allowed and valid):
  if (config.hash.allowRequest !== true && req.query.hash !== undefined) {
    return res.send(403);
  } else if (config.hash.allowRequest === true &&
      req.query.hash !== undefined &&
      (config.hash._regex.test(req.query.hash) === false ||
      inList(req.query.hash, config.hash.blacklist))) {
    return res.send(400);
  }

  // 2) now parse and validate URL:
  try {
    url = URL.parse(req.params.url[0], true);
  } catch (err) {
    return res.send(400);
  }
  if (url === undefined || url.hostname === null || url.hostname === '') {
    return res.send(400);
  }
  // valid protocol?
  if (config.urlLimit.allowedProtocols.indexOf(url.protocol) === -1) {
    return res.send(403);
  }
  // valid hostname (in whitelist and/or not in blacklist)?
  if (config.urlLimit.hostnameWhitelist.length !== 0 &&
      !inList(url.hostname, config.urlLimit.hostnameWhitelist)) {
    return res.send(403);
  }
  if (inList(url.hostname, config.urlLimit.hostnameBlacklist)) {
    return res.send(403);
  }

  // if we got here, our URL is valid
  // 3) so normalize it:
  url.host = url.host.toLowerCase();
  if (url.pathname === undefined || url.pathname === '') {
    url.pathname = '/';
  }
  if (url.hash === '#') {
    url.hash = '';
  }
  if (url.search === '?') {
    url.search = '';
  }
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    delete url.port;
    url.host = url.host.substring(0, url.host.lastIndexOf(':'));
  }
  var urlNormalized = URL.format(url);

  // 4) check if we can actually *shorten* the URL:
  if ((req.query.hash !== undefined &&
      urlNormalized.length <=
      (config.hash.urlPrefix.length + req.query.hash.length)) ||
      urlNormalized.length <= (config.hash.urlPrefix.length +
      config.hash.length)) {
    return res.send(403);
  }

  // 5) check if we already know the URL:
  db.getHashForURL(urlNormalized, function (err, result) {
    if (err) {
      return res.send(500);
    } else if (result !== null) {
      return sendResponse(req, res, result, urlNormalized, false);
    }
    else { // we don't know it yet, so
      // 6) register new URL:
      var hash;
      if (req.query.hash !== undefined) {
        hash = req.query.hash;
      } else { // generate hash:
        var rndBytes;
        hash = '';
        do {
          rndBytes = crypto.randomBytes(config.hash.length);
          for (var i = 0; i < config.hash.length; i++) {
            hash += config.hash._range[rndBytes[i] % config.hash._range.length];
          }
        } while (inList(hash, config.hash.blacklist));
      }
      db.setHashForURL(hash, urlNormalized, function (err, result) {
        if (err) {
          return res.send(500);
        } else {
          if (result === false) {
            return res.send(403);
          } else {
            return sendResponse(req, res, hash, urlNormalized, true);
          }
        }
      });
    }
  });
};
module.exports = shorten;
