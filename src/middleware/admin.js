/**
 * Admin Middleware
 * Checks if the authenticated user has an 'admin' role.
 * This should be used after the standard 'auth' middleware.
 */
module.exports = function(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permissions required' });
  }
};
