import { PermissionGuard } from '@/components/auth/permission-guard';

export default function PricingAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionGuard permission="manage_pricing" fallbackUrl="/dashboard/access-denied">
      {children}
    </PermissionGuard>
  );
}
