const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.user) {
      req.user = decoded.user;
    } else if (decoded.attendee) {
      req.attendee = decoded.attendee;
    } else {
      return res.status(401).json({ message: 'Token is not valid for this resource' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
