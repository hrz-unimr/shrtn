var pg = require('pg');

module.exports = function init (dbParams) {
  var myExports = {};

  dbParams.table = 'shrtn';


  var getURLForHash = function (hash, callback) {
    pg.connect(dbParams, function (err, client, done) {
      if (err !== null) {
        return callback(err);
      }
      client.query({
          'name': 'get url for hash',
          'text': 'SELECT url FROM ' + dbParams.table + ' WHERE hash=$1',
          'values': [hash]
        }, function (err, result) {
          done();
          if (err !== null) {
            return callback(err);
          } else if (result.rows.length !== 1) {
            return callback(undefined, null);
          } else {
            return callback(undefined, result.rows[0].url);
          }
        }
      );
    });
  };
  myExports.getURLForHash = getURLForHash;


  var getHashForURL = function (url, callback) {
    pg.connect(dbParams, function (err, client, done) {
      if (err !== null) {
        return callback(err);
      }
      client.query({
          'name': 'get hash for url',
          'text': 'SELECT hash FROM ' + dbParams.table +
                  ' WHERE url=$1 LIMIT 1',
          'values': [url]
        }, function (err, result) {
          done();
          if (err !== null) {
            return callback(err);
          } else if (result.rows.length !== 1) {
            return callback(undefined, null);
          } else {
            return callback(undefined, result.rows[0].hash);
          }
        }
      );
    });
  };
  myExports.getHashForURL = getHashForURL;


  var recordHitForHash = function (hash, callback) {
    pg.connect(dbParams, function (err, client, done) {
      if (err !== null) {
        return callback(err);
      }
      client.query({
        'name': 'record hit for hash',
        'text': 'UPDATE ' + dbParams.table +
                ' SET clicks = clicks + 1, atime = $1 WHERE hash=$2',
        'values': [Number(new Date()), hash]
      }, function () {
        done();
        return callback();
      });
    });
  };
  myExports.recordHitForHash = recordHitForHash;


  var getStatsForHash = function (hash, callback) {
    pg.connect(dbParams, function (err, client, done) {
      if (err !== null) {
        return callback(err);
      }
      client.query({
          'name': 'get stats for hash',
          'text': 'SELECT clicks, ctime, atime FROM ' +
                   dbParams.table + ' WHERE hash=$1',
          'values': [hash]
        }, function (err, result) {
          done();
          if (err !== null) {
            return callback(err);
          }
          else if (result.rows.length !== 1) {
            return callback(undefined, null);
          }
          else {
            return callback(undefined, result.rows[0]);
          }
        }
      );
    });
  };
  myExports.getStatsForHash = getStatsForHash;


  /*
   * NOTE: This function is expected to perform the necessary database
   * operations atomically!
   */
  var setHashForURL = function (hash, url, callback) {
    pg.connect(dbParams, function (err, client, done) {
      if (err !== null) {
        return callback(err);
      }
      client.query({
          'name': 'set hash for url',
          'text': 'INSERT INTO ' + dbParams.table +
                  ' (hash, url, clicks, ctime, atime) VALUES ' +
                  '($1, $2, 0, $3, 0)',
          'values': [hash, url, Number(new Date())]
        }, function (err, result) {
          done();
          if (err !== null) {
            return callback(undefined, false);
          }
          else {
            return callback(undefined, result);
          }
        }
      );
    });
  };
  myExports.setHashForURL = setHashForURL;

  return myExports;
};
