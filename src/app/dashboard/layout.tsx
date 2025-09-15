import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/nav';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/signin');
  }

  // Add role from session or default to 'user'
  const userWithRole = {
    ...session.user,
    role: ((session.user as Record<string, unknown>).role as string) || 'user',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <DashboardNav user={userWithRole} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={userWithRole} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
