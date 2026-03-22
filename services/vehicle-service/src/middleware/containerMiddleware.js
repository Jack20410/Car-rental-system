const container = require('../config/container');

const scopePerRequest = (req, res, next) => {
  req.container = container;
  next();
};

module.exports = { scopePerRequest };
