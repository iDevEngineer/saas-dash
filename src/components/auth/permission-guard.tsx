import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { hasPermission } from '@/lib/permissions';
import type { Permission, UserWithRole } from '@/types/permissions';

interface PermissionGuardProps {
  permission: Permission;
  fallbackUrl?: string;
  children: React.ReactNode;
}

export async function PermissionGuard({
  permission,
  fallbackUrl = '/dashboard/access-denied',
  children,
}: PermissionGuardProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/signin');
  }

  const user: UserWithRole = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: ((session.user as any).role as string) || 'user',
  } as UserWithRole;

  if (!hasPermission(user, permission)) {
    redirect(fallbackUrl);
  }

  return <>{children}</>;
}

// Alternative component for client-side permission checking
interface ClientPermissionGuardProps {
  user: UserWithRole;
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ClientPermissionGuard({
  user,
  permission,
  fallback = null,
  children,
}: ClientPermissionGuardProps) {
  if (!hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook for checking permissions in client components
import { useSession } from '@/lib/auth-client';

export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();

  if (!session?.user) {
    return false;
  }

  const user: UserWithRole = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: ((session.user as any).role as string) || 'user',
  } as UserWithRole;

  return hasPermission(user, permission);
}
