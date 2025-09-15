# Navigation and Permission System

This document describes the enhanced navigation system with role-based permissions implemented in
SaaS Dash.

## Overview

The navigation system has been upgraded to support:

- **Permission-based navigation** - Only show menu items users can access
- **Role-based access control** - Three user roles with different capabilities
- **Route protection** - Server-side permission checks on admin pages
- **Dynamic menu rendering** - Navigation items filtered by user permissions

## User Roles and Permissions

### Role Hierarchy

1. **user** - Basic dashboard access
2. **admin** - Extended access including pricing and email management
3. **super_admin** - Full system access

### Permission Matrix

| Feature            | User | Admin | Super Admin |
| ------------------ | ---- | ----- | ----------- |
| Dashboard          | ✅   | ✅    | ✅          |
| Projects           | ✅   | ✅    | ✅          |
| Analytics          | ✅   | ✅    | ✅          |
| Team               | ✅   | ✅    | ✅          |
| Billing            | ✅   | ✅    | ✅          |
| Settings           | ✅   | ✅    | ✅          |
| Admin Panel        | ❌   | ✅    | ✅          |
| Pricing Management | ❌   | ✅    | ✅          |
| Email Management   | ❌   | ✅    | ✅          |
| User Management    | ❌   | ❌    | ✅          |
| System Settings    | ❌   | ❌    | ✅          |

## Navigation Structure

### Main Navigation (All Users)

- Dashboard (`/dashboard`)
- Projects (`/dashboard/projects`)
- Analytics (`/dashboard/analytics`)
- Team (`/dashboard/team`)
- Billing (`/dashboard/billing`)
- Settings (`/dashboard/settings`)

### Admin Navigation (Admin+ Only)

- **Administration** (section header)
- Admin Panel (`/admin`)
- Pricing Management (`/dashboard/admin/pricing`)
- Email Management (`/dashboard/admin/email`) ← **NEW**

## Implementation Details

### Core Files

- `src/types/permissions.ts` - Permission type definitions
- `src/lib/permissions.ts` - Permission helper functions
- `src/components/dashboard/nav.tsx` - Enhanced navigation component
- `src/components/auth/permission-guard.tsx` - Route protection

### Permission Checking Functions

```typescript
// Check specific permission
hasPermission(user, 'manage_email'); // boolean

// Check role level
hasRole(user, 'admin'); // boolean

// Check if admin
isAdmin(user); // boolean

// Filter navigation items
filterByPermission(user, navigationItems); // filtered array
```

### Route Protection

Admin pages are protected using the `PermissionGuard` component:

```typescript
// src/app/dashboard/admin/email/layout.tsx
<PermissionGuard permission="manage_email">
  {children}
</PermissionGuard>
```

### Access Denied Handling

Users without proper permissions are redirected to:

- `/dashboard/access-denied` - Friendly access denied page
- Provides links back to accessible areas

## Testing the System

### Test Users (from seed data)

- **admin@example.com** - Super Admin (password: password123)
- **john@example.com** - Admin (password: password123)
- **jane@example.com** - User (password: password123)

### Test Scenarios

1. **User Role Test**
   - Login as `jane@example.com`
   - Should see: Main navigation only
   - Should NOT see: Administration section

2. **Admin Role Test**
   - Login as `john@example.com`
   - Should see: Main navigation + Administration section
   - Should see: Pricing Management, Email Management
   - Can access: `/dashboard/admin/email`

3. **Super Admin Test**
   - Login as `admin@example.com`
   - Should see: All navigation items
   - Can access: All admin pages

## Security Features

- **Client-side filtering** - Navigation items filtered by permissions
- **Server-side protection** - Route guards prevent unauthorized access
- **Type safety** - Full TypeScript support for permissions
- **Graceful fallbacks** - Access denied pages instead of errors

## Future Extensions

The system is designed to easily support:

- New admin features (User Management, System Settings)
- Granular permissions (per-organization, per-feature)
- Dynamic role assignment
- Permission-based UI components

## Troubleshooting

### Navigation not showing admin items

- Check user role in database
- Verify permission mappings in `src/lib/permissions.ts`
- Check browser console for errors

### Access denied on admin pages

- Verify `PermissionGuard` is properly configured
- Check user session data
- Ensure role is correctly set in auth system

### Development Testing

```bash
# Type check
pnpm type-check

# Start development server
pnpm dev

# Access admin interface (requires admin role)
http://localhost:3000/dashboard/admin/email
```
