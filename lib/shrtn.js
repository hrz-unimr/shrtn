/* jshint -W108 */
[
  'shorten',
  'stats',
  'expand'
].forEach(function (lib) {
  module.exports[lib] = require('./' + lib);
});