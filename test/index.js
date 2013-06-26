/* global suite: false, test: false */
var assert = require('assert');
var request = require('supertest');

var app = require('../');
var appConfig = app.get('config');

suite('OPTIONS /', function () {
  test('return CORS headers', function (done) {
    request(app)
      .options('/')
      .expect('Access-Control-Allow-Origin', '*')
      .expect('Access-Control-Allow-Headers', 'X-Requested-With')
      .expect('Access-Control-Allow-Methods', 'GET')
      .expect('Access-Control-Max-Age', '86400')
      .expect(200, done);
  });
});

suite('GET /shorten', function () {
  test('checks for valid URL format', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2F')
      .expect(400, done);
  });

  test('checks for valid protocol', function (done) {
    request(app)
      .get('/shorten/ftp%3A%2F%2Fwww.test.de%2Ffoo%2Fbar%2Fbaz')
      .expect(403, done);
  });

  test('refuses to shorten too short URLs', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Ffoo.bar')
      .expect(403, done);
  });

  test('refuses request hashes when forbidden', function (done) {
    var requestHash = 'test';
    appConfig.hash.allowRequest = false;
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%2Fand%2Fa%2Frequest%2Fhash?hash=' + requestHash)
      .expect(403)
      .end(function (err, res) {
        appConfig.hash.allowRequest = true;
        if (err) {
          return done(err);
        } else {
          return done();
        }
      });
  });

  test('refuses bad request hashes', function (done) {
    var requestHash = 'this%20is%20a%20malformed%20hash';
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%2Fand%2Fa%2Frequest%2Fhash?hash=' + requestHash)
      .expect(400, done);
  });

  test('refuses forbidden request hashes', function (done) {
    var requestHash = 'shorten';
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%2Fand%2Fa%2Frequest%2Fhash?hash=' + requestHash)
      .expect(400, done);
  });

  test('refuses URL with hostname on blacklist', function (done) {
    appConfig.urlLimit.hostnameBlacklist = ['a-bad-host.name'];
    request(app)
      .get('/shorten/http%3A%2F%2Fa-bad-host.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath')
      .expect(403)
      .end(function (err, res) {
        appConfig.urlLimit.hostnameBlacklist = [];
        if (err) {
          return done(err);
        } else {
          return done();
        }
      });
  });

  test('refuses URL with hostname not on whitelist', function (done) {
    appConfig.urlLimit.hostnameWhitelist = ['a-known-good-host.name'];
    request(app)
      .get('/shorten/http%3A%2F%2Fanother-bad-host.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath')
      .expect(403)
      .end(function (err, res) {
        appConfig.urlLimit.hostnameWhitelist = [];
        if (err) {
          return done(err);
        } else {
          return done();
        }
      });
  });

  test('performs shortening', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          assert(appConfig.hash._regex.test(res.body.hash));
          assert.strictEqual(res.body.longUrl,
            'http://a-very-long-domain.name/with/an/even/longer/path');
          assert.strictEqual(res.body.url, appConfig.hash.urlPrefix +
            res.body.hash);
          return done();
        }
      });
  });

  test('performs normalization during shortening', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          var hashCanonicalUrl = res.body.hash;
          request(app)
            .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%3A80' +
                '%2Fwith%2Fan%2Feven%2Flonger%2Fpath%23')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function (err, res) {
              if (err) {
                return done(err);
              } else {
                assert.strictEqual(hashCanonicalUrl, res.body.hash);
                request(app)
                  .get('/shorten/http%3A%2F%2Fa-very-long-domain.name' +
                      '%2Fwith%2Fan%2Feven%2Flonger%2Fpath%3F')
                  .expect(200)
                  .expect('Content-Type', /json/)
                  .end(function (err, res) {
                    if (err) {
                      return done(err);
                    } else {
                      assert.strictEqual(hashCanonicalUrl, res.body.hash);
                      return done();
                    }
                  });
              }
            });
        }
      });
  });

  test('accepts request hashes when allowed', function (done) {
    var requestHash = 'test';
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%2Fand%2Fa%2Frequest%2Fhash?hash=' + requestHash)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          assert.strictEqual(requestHash, res.body.hash);
          return done();
        }
      });
  });

  test('returns text/plain (on demand)', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath?format=txt')
      .expect('Content-Type', /text\/plain/)
      .expect(new RegExp('^' + appConfig.hash.urlPrefix))
      .expect(200, done);
  });

  test('returns qrcode (on demand)', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath?format=qrcode')
      .expect('Content-Type', /image\/png/)
      .expect('Content-Length', /[0-9]{3,4}/)
      .expect(200, done);
  });
});

suite('GET|HEAD /[hash]', function () {
  var hash;

  test('GET returns 404 for unknown hash', function (done) {
    request(app)
      .get('/unkno')
      .expect(404, done);
  });

  test('GET returns permanent redirect for known hash', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%3F')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          hash = res.body.hash;
          request(app)
            .get('/' + hash)
            .expect('Location', 'http://a-very-long-domain.name/with/an/even' +
                '/longer/path')
            .expect(301, done);
        }
      });
  });

  test('HEAD returns 404 for unknown hash', function (done) {
    request(app)
      .head('/unkno')
      .expect(404, done);
  });

  test('HEAD returns permanent redirect for known hash', function (done) {
    request(app)
      .head('/' + hash)
      .expect('Location', 'http://a-very-long-domain.name/with/an/even' +
          '/longer/path')
      .expect(301, done);
  });
});

suite('GET /stats', function () {
  var hash;

  test('returns 404 for unknown hash', function (done) {
    request(app)
      .get('/stats/unkno')
      .expect(404, done);
  });

  test('returns stats for known hash', function (done) {
    request(app)
      .get('/shorten/http%3A%2F%2Fa-very-long-domain.name%2Fwith%2Fan%2Feven' +
        '%2Flonger%2Fpath%3F')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          hash = res.body.hash;
          request(app)
            .get('/stats/' + hash)
            .expect('Content-Type', /json/)
            .expect(200, done);
        }
      });
  });

  test('returns clicks in text/plain (on demand)', function (done) {
    request(app)
      .get('/stats/' + hash + '?format=txt')
      .expect('Content-Type', /text\/plain/)
      .expect(/\d+/)
      .expect(200, done);
  });

  test('returns actually incremented clicks', function (done) {
    this.slow(4075);
    this.timeout(5000);
    request(app)
      .get('/stats/' + hash + '?format=txt')
      .expect('Content-Type', /text\/plain/)
      .expect(200)
      .end(function (err, res) {
        if (err) {
          return done(err);
        } else {
          var clicks = parseInt(res.text, 10);
          setTimeout(function () {
            request(app)
              .get('/' + hash)
              .expect(301)
              .end(function (err, res) {
                request(app)
                  .get('/stats/' + hash + '?format=txt')
                  .expect(200)
                  .expect('' + (clicks + 1), done);
              });
          }, 4000);
        }
      });
  });
});
