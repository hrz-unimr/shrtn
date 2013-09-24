var app = require('express')();
require('express-params').extend(app);

var config = require('./lib/conf');
app.set('config', config);

var db = require('./lib/db/pg')(config.db);
app.set('db', db);

if (config.http.enableCORS === true) {
  var middleware = require('./lib/middleware');
  app.use(middleware.cors);
}

app.param('url', /^[a-zA-Z0-9\-_.~!*'();:@&%|=+$,/?#\[\]]+/);
app.param('hash', config.hash._regex);

var shrtn = require('./lib/shrtn');

/*
 * Route definitions
 */
app.get('/shorten/:url', shrtn.shorten);
app.get('/expand/:hash', shrtn.expand);
app.get('/stats/:hash', shrtn.stats);
app.get('/:hash', shrtn.resolve);


/*
 * Main: listen or export
 */
if (require.main === module) {
  app.listen(config.http.port, config.http.address);
} else {
  module.exports = app;
}
