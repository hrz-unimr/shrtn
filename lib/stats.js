var stats = function (req, res, next) {
  var db = req.app.get('db');
  db.getStatsForHash(req.params.hash[0], function (err, result) {
    if (err) {
      return res.send(500);
    } else if (result === null) {
      return res.send(404);
    } else {
      if (req.query.format === 'txt') {
        res.type('txt');
        return res.send(200, '' + result.clicks);
      } else {
        return res.jsonp(200, result);
      }
    }
  });
};
module.exports = stats;
