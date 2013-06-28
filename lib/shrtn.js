/* jshint -W108 */
[
  'shorten',
  'stats',
  'expand',
  'resolve'
].forEach(function (lib) {
  module.exports[lib] = require('./' + lib);
});
