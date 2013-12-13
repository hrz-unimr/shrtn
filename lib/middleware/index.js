exports.cors = function (config) {
  return function (req, res, next) {
    res.set('Access-Control-Allow-Origin', config.allowOrigin);
    res.set('Access-Control-Allow-Headers', config.allowHeaders);
    res.set('Access-Control-Allow-Methods', config.allowMethods);
    res.set('Access-Control-Max-Age', config.maxAge);
    if (req.method === 'OPTIONS') {
      return res.send(200);
    } else {
      return next();
    }
  };
};
