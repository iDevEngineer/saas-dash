'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  Users,
  CreditCard,
  BarChart3,
  Shield,
  LogOut,
  DollarSign,
  Mail,
  Webhook,
  FileText,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';
import { filterByPermission } from '@/lib/permissions';
import type { NavigationItem } from '@/types/permissions';

interface DashboardNavProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'view_dashboard' },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    permission: 'manage_projects',
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    permission: 'view_analytics',
  },
  { name: 'Team', href: '/dashboard/team', icon: Users, permission: 'manage_team' },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard, permission: 'view_billing' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'manage_settings' },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Admin Panel', href: '/admin', icon: Shield, permission: 'access_admin_panel' },
  {
    name: 'Pricing Management',
    href: '/dashboard/admin/pricing',
    icon: DollarSign,
    permission: 'manage_pricing',
  },
  {
    name: 'Email Management',
    href: '/dashboard/admin/email',
    icon: Mail,
    permission: 'manage_email',
  },
  {
    name: 'API Keys',
    href: '/dashboard/admin/api-keys',
    icon: Key,
    permission: 'manage_api_keys',
  },
  {
    name: 'Webhooks',
    href: '/dashboard/admin/webhooks',
    icon: Webhook,
    permission: 'manage_webhooks',
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/admin/audit',
    icon: FileText,
    permission: 'view_audit_logs',
  },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  // Cast user to UserWithRole for permission checking
  const userWithRole = user as any; // We'll fix this type cast

  // Filter navigation items based on user permissions
  const filteredNavigation = filterByPermission(userWithRole, navigation);
  const filteredAdminNavigation = filterByPermission(userWithRole, adminNavigation);

  return (
    <nav className="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">SaaS Dash</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-4">
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Admin Section */}
              {filteredAdminNavigation.length > 0 && (
                <>
                  <div className="pt-4">
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="pt-2">
                      <p className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                        Administration
                      </p>
                    </div>
                  </div>
                  {filteredAdminNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400">
                  <span className="text-sm font-medium text-white">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                window.location.href = '/';
              }}
              className="ml-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
