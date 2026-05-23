/**
 * Checks if a user has sufficient permission for an event.
 * @param {Object} event The Mongoose Event document
 * @param {string} userId The requesting User's ID
 * @param {string} userRole The requesting User's system role ('user' | 'admin')
 * @param {string} requiredAccess The level of access ('owner' | 'manager' | 'monitor')
 * @returns {boolean} True if authorized, false otherwise
 */
const checkEventAccess = (event, userId, userRole, requiredAccess) => {
  // 1. Platform Admin has full access
  if (userRole === 'admin') return true;

  // 2. Event Owner has full access
  if (event.owner && event.owner.toString() === userId) return true;

  // 3. For owner-only actions, stop here (since they aren't owner)
  if (requiredAccess === 'owner') return false;

  // 4. Find the collaborator record
  if (!event.collaborators) return false;
  
  const collaborator = event.collaborators.find(
    (c) => c.user && c.user.toString() === userId
  );

  if (!collaborator) return false;

  // 5. Evaluate role-based access
  if (requiredAccess === 'monitor') {
    // Both 'manager' and 'monitor' have monitoring (read-only) rights
    return ['manager', 'monitor'].includes(collaborator.role);
  }

  if (requiredAccess === 'manager') {
    // Only 'manager' has management (editing) rights
    return collaborator.role === 'manager';
  }

  return false;
};

module.exports = {
  checkEventAccess
};
