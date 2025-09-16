import { PermissionGuard } from '@/components/auth/permission-guard';

export default function ApiKeysAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission="manage_api_keys" fallbackUrl="/dashboard/access-denied">
      {children}
    </PermissionGuard>
  );
}
