// Wraps async route handlers so thrown errors are sent to Express error middleware.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
