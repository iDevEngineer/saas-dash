import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { PricingManagement } from '@/components/admin/pricing-management';

export default async function AdminPricingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/signin');
  }

  // Add proper admin role checking here
  // For now, we'll assume authenticated users can access admin features
  // In production, implement proper role-based access control

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-muted-foreground">Manage your pricing plans and features</p>
      </div>

      <PricingManagement />
    </div>
  );
}
