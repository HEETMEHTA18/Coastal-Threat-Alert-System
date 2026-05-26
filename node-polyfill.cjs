const crypto = require('crypto');
if (!crypto.hash) {
  crypto.hash = function(algorithm, data, outputFormat = 'hex') {
    return crypto.createHash(algorithm).update(data).digest(outputFormat);
  };
}
