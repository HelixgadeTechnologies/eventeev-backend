const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header (supports x-auth-token and Authorization: Bearer <token>)
  let token = req.header('x-auth-token');
  if (!token && req.header('authorization')) {
    const authHeader = req.header('authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

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
    } else if (decoded.id) {
      req.attendee = { id: decoded.id, email: decoded.email, name: decoded.name };
    } else {
      return res.status(401).json({ message: 'Token is not valid for this resource' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
