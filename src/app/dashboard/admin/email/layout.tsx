import { PermissionGuard } from '@/components/auth/permission-guard';

export default function EmailAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission="manage_email" fallbackUrl="/dashboard/access-denied">
      {children}
    </PermissionGuard>
  );
}
