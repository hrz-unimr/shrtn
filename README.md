# shrtn.js

A simple and fast URL shortening service

## Requirements

- [node.js](http://nodejs.org/)
- [PostgreSQL](http://www.postgresql.org/)
  (in any version supported by [pg](https://npmjs.org/package/pg))
- [libqrencode](http://fukuchi.org/works/qrencode/) and
  [libpng](http://www.libpng.org/pub/png/libpng.html) (for optional QR Code
  output support)

## Installation

### Application setup

    $ git clone https://github.com/hrz-unimr/shrtn
    $ cd shrtn
    $ npm install

### Database setup

1. Create PostgreSQL database and corresponding role with login permission and
   password.
2. Import `doc/schema.sql`.
3. Grant `SELECT`, `INSERT`, and `UPDATE` on table `shrtn`. (Yes, `DELETE` is
   *not* required).

### Configuration

Copy/Move `config.sample.js` to `config.js` and adapt to your configuration
needs. You almost certainly want to change at least some of the `db` and `hash`
properties.

`http.*`/`db.*`: These should be pretty self-explanatory – set HTTP server
listen configuration, whether to send [CORS](http://www.w3.org/TR/cors/) HTTP
headers and PostgreSQL database connection parameters

`hash.urlPrefix`: Sets the prefix which will be prepended to generated/requested
hashes in order to get a full (short) URL

#### Hash generation options

`hash.length`: Sets the character length for generated hashes

– Use either: –

`hash.caseSensitive`: Sets whether or not mixed-case hashes are generated

`hash.decimals`: Sets whether or not generated hashes may contain decimals

– or: –

`hash.range`: Sets a custom range of valid characters for hashes (main use for
this option is to explicitly prevent usage of visually similar characters like
„l“ and „1“). See comment in sample config for a valid example.

`hash.blacklist`: Sets a blacklist for request and generated hashes, no hash on
this list will be useable

#### Request hash options

`hash.allowRequest`: Sets whether or not request hashes are allowed at all

`hash.requestPattern`: Sets a (regular expression) pattern for allowed request
hashes

#### (Long) URL limitations

`urlLimit.hostnameWhitelist`/`urlLimit.hostnameBlacklist`: Sets lists of strings
or regular expression patterns for long URL hostnames. If given a whitelist,
only URLs with hostnames on this list will be shortened, if given a blacklist,
no URL with a hostname on this list will be shortened. These options allow for
establishing a „trusted URL“ shortening service.

`urlLimit.allowedProtocols`: Sets a list of valid URL protocols

#### QR Code options

`qrcode.enabled`: Sets whether or not QR Code output is supported at all

`qrcode.errorCorrectionLevel`: Sets QR Code error correction level (valid values
range from `'H'` (highest) to `'L'` (lowest). See corresponding comment in
sample config.

`qrcode.defaultDotSize`: Sets default „dot“ (= bit) size of QR Code output,
overridable per request (see below)

`qrcode.minDotSize`/`qrcode.maxDotSize`: Sets lower and upper limits for valid
dot size values as given per request parameter (see below)

`qrcode.marginDots`: Sets „white“ (= background color) margin size (in dots) of
QR Code output

### API documentation

#### GET /shorten/<url>

Accepts `<url>` (in encoded form as in `encodeURIComponent()`); returns JSON
result of the following form:

    {
      "hash": "4O8GP",
      "url": "http://localhost:8080/4O8GP",
      "longUrl": "http://a-very-long-domain.name/with/an/even/longer/path",
      "newHash": true
    }

... where `longUrl` is the (normalized) original URL, `hash` is the randomly
generated hash, `url` is the complete short URL and `newHash` is a flag
indicating whether or not this is URL was shortened for the first time (i. e.
the hash was generated for this request or was already present in the database).

This accepts a few extra query string parameters:

`format=txt`: generates a plaintext response containing only the short
URL

`format=qrcode`: generates a PNG response containing a QR Code of the short URL,
an additional parameter allows for modifying the size of the output: `size=<px>`
creates a code with a „dot“ size of px × px pixels.

`hash=<hash>`: tries to register custom `<hash>` as the hash part of a short URL

`callback=<callbackFunction>`: returns JSONP response wrapped in a callback
function named `<callbackFunction>`

#### GET|HEAD /<hash>

Performs the hash expansion (by returning HTTP permanent redirect to the
original URL's location)

#### GET /stats/<hash>

Returns some very basic usage metrics on the corresponding short URL in JSON of
the following form:

    {
      "clicks": 42,
      "ctime": 1368360696347,
      "atime": 1368361746072
    }

... where `clicks` is the number of short URL expansion requests, `ctime` is the
original creation time for this short URL, and `atime` marks the time of the
last expansion request.

This accepts the following additional query string parameters:

`format=txt`: Returns a plaintext response containing only the value of `clicks`

`callback=<callbackFunction>`: returns JSONP response wrapped in a callback
function named `<callbackFunction>`

### Considerations for production deployment

The application itself imposes *no limit* on shorten request rate per client nor
does it provide any means of *access control* (e. g. for stats display). This is
by design, as we firmly believe that these should be taken care of by a reverse
proxy in front of your application. So, in other words: **shrtn.js has not been
designed to run „web-facing“ itself, but behind a „real“ webserver.**

### Development

#### Dependencies

- [Mocha](http://visionmedia.github.io/mocha/) and
[SuperAgent](https://npmjs.org/package/superagent) (for tests)
- [JSHint](http://www.jshint.com/) (for coding style enforcement,
  see `.jshintrc`)

#### Issue reports/Bug fixes/Enhancements

Very welcome!

### Legal

QR Code is a registered trademark of
[DENSO WAVE INCORPORATED](http://www.denso-wave.com/en/).

### License

MIT (see LICENSE)
