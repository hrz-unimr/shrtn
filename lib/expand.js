var expand = function (req, res, next) {
  var db = req.app.get('db');
  db.getURLForHash(req.params.hash[0], function (err, result) {
    if (err) {
      return res.send(500);
    } else if (result === null) {
      return res.send(404);
    } else {
      if (req.query.format === 'txt') {
        res.type('txt');
        return res.send(200, result);
      } else {
        var respond = (req.app.get('config').http.enableJSONP === true ?
            res.jsonp : res.json);
        return respond.call(res, {
          'hash': req.params.hash[0],
          'longUrl': result,
        });
      }
    }
  });
};
module.exports = expand;
