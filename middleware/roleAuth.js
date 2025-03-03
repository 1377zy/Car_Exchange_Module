/**
 * Role-based authorization middleware
 * Checks if user has the required role(s) to access a resource
 * @param {Array|string} roles - Role or array of roles allowed to access the resource
 */
module.exports = function(roles) {
  // Convert string to array if single role is provided
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return function(req, res, next) {
    // Check if user exists (auth middleware should run first)
    if (!req.user) {
      return res.status(401).json({ msg: 'Authorization denied' });
    }
    
    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied: insufficient permissions' });
    }
    
    next();
  };
};
