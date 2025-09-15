// User roles as defined in the database schema
export type UserRole = 'user' | 'admin' | 'super_admin';

// Specific permissions for different features
export type Permission =
  | 'view_dashboard'
  | 'manage_projects'
  | 'view_analytics'
  | 'manage_team'
  | 'view_billing'
  | 'manage_settings'
  | 'access_admin_panel'
  | 'manage_pricing'
  | 'manage_email'
  | 'manage_webhooks'
  | 'view_audit_logs'
  | 'manage_users'
  | 'manage_system_settings';

// Navigation item type with permission requirements
export interface NavigationItem {
  name: string;
  href: string;
  icon: any; // Lucide React icon component
  permission?: Permission;
  roles?: UserRole[];
  description?: string;
}

// User object with role information
export interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

// Permission check result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}
