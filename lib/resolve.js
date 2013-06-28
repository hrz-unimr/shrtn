var resolve = function (req, res, next) {
  var db = req.app.get('db');
  db.getURLForHash(req.params.hash[0], function (err, result) {
    if (err) {
      return res.send(500);
    } else if (result === null) {
      return res.send(404);
    } else {
      // send HTTP (permanent) redirect:
      res.set('Location', result);
      res.send(301);

      // record hit:
      db.recordHitForHash(req.params.hash[0], function () {});
      return;
    }
  });
};
module.exports = resolve;
