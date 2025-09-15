import type { UserRole, Permission, UserWithRole, PermissionResult } from '@/types/permissions';

// Role hierarchy - higher roles inherit permissions from lower roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

// Permission mappings - which roles have which permissions
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'view_dashboard',
    'manage_projects',
    'view_analytics',
    'manage_team',
    'view_billing',
    'manage_settings',
  ],
  admin: [
    'view_dashboard',
    'manage_projects',
    'view_analytics',
    'manage_team',
    'view_billing',
    'manage_settings',
    'access_admin_panel',
    'manage_pricing',
    'manage_email',
  ],
  super_admin: [
    'view_dashboard',
    'manage_projects',
    'view_analytics',
    'manage_team',
    'view_billing',
    'manage_settings',
    'access_admin_panel',
    'manage_pricing',
    'manage_email',
    'manage_users',
    'manage_system_settings',
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserWithRole, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserWithRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: UserWithRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has a specific role or higher
 */
export function hasRole(user: UserWithRole, role: UserRole): boolean {
  const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredRoleLevel = ROLE_HIERARCHY[role] || 0;
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserWithRole, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if a user is an admin (admin or super_admin)
 */
export function isAdmin(user: UserWithRole): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(user: UserWithRole): boolean {
  return user.role === 'super_admin';
}

/**
 * Get detailed permission check result with reason
 */
export function checkPermission(user: UserWithRole, permission: Permission): PermissionResult {
  const allowed = hasPermission(user, permission);

  if (allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `User role '${user.role}' does not have permission '${permission}'`,
  };
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(user: UserWithRole): Permission[] {
  return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Check if a user can access the admin panel
 */
export function canAccessAdminPanel(user: UserWithRole): boolean {
  return hasPermission(user, 'access_admin_panel');
}

/**
 * Check if a user can manage pricing
 */
export function canManagePricing(user: UserWithRole): boolean {
  return hasPermission(user, 'manage_pricing');
}

/**
 * Check if a user can manage email settings
 */
export function canManageEmail(user: UserWithRole): boolean {
  return hasPermission(user, 'manage_email');
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(user: UserWithRole): boolean {
  return hasPermission(user, 'manage_users');
}

/**
 * Check if a user can manage system settings
 */
export function canManageSystemSettings(user: UserWithRole): boolean {
  return hasPermission(user, 'manage_system_settings');
}

/**
 * Filter array items based on permission check
 */
export function filterByPermission<T extends { permission?: Permission; roles?: UserRole[] }>(
  user: UserWithRole,
  items: T[]
): T[] {
  return items.filter((item) => {
    // If item has specific permission requirement, check it
    if (item.permission) {
      return hasPermission(user, item.permission);
    }

    // If item has role requirements, check them
    if (item.roles && item.roles.length > 0) {
      return hasAnyRole(user, item.roles);
    }

    // If no permission or role requirements, allow access
    return true;
  });
}
