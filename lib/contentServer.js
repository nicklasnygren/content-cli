var request = require('request');

module.exports = function (host) {
  function querySelector (selector, callback) {
    queryServer(
      'querySelector?selector=' + selector,
      function (err, response, body) {
        callback(JSON.parse(body));
      }
    );
  };

  function queryServer (endpoint, callback) {
    return request(host + '/' + endpoint, callback);
  };

  return {
    querySelector: querySelector
  };
};

