var config = require('../config');

/*
 * Setup tasks
 */
if (config.hash.range !== undefined) {
  config.hash._range = config.hash.range;
} else {
  config.hash._range = 'abcdefghijklmnopqrstuvwxyz';
  if (config.hash.caseSensitive) {
    config.hash._range += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  if (config.hash.decimals) {
    config.hash._range += '0123456789';
  }
}
config.hash._regex = new RegExp(config.hash.allowRequest ?
  config.hash.requestPattern : '[' + config.hash._range + ']{' +
  config.hash.length + '}');

// add our own API methods to hash blacklist in order to avoid URL collisions:
config.hash.blacklist.push('shorten', 'stats');

module.exports = config;
