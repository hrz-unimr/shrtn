exports.cors = function corsReply(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With');
  res.set('Access-Control-Allow-Methods', 'GET');
  res.set('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
};
