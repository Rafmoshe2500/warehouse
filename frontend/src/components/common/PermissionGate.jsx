import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';

/**
 * PermissionGate
 * 
 * A wrapper component that only renders its children if the current user
 * has the required permission.
 * 
 * Usage:
 * <PermissionGate permission="item:delete" fallback={<span className="disabled">No Access</span>}>
 *   <DeleteButton />
 * </PermissionGate>
 */
const PermissionGate = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();

  if (!permission) {
    return children;
  }

  // Check for exact permission
  const allowed = hasPermission(permission);
  
  // Handle read-only logic implicitly if needed (optional enhancement)
  // If we ask for 'read' but have 'write', it should pass, but usually handled by hasPermission logic
  // or simple hierarchy in AuthContext

  if (!allowed) {
    return fallback;
  }

  return children;
};

PermissionGate.propTypes = {
  permission: PropTypes.string.isRequired,
  children: PropTypes.node,
  fallback: PropTypes.node
};

export default PermissionGate;
