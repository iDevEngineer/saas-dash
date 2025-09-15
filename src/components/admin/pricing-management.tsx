'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  stripePriceId?: string;
  stripeProductId?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  features: string[];
}

export function PricingManagement() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 0,
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    features: [],
  });
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/pricing/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch pricing plans');
      }
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        ...formData,
        features,
      };

      const url = editingPlan ? `/api/pricing/plans/${editingPlan.id}` : '/api/pricing/plans';

      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plan');
      }

      toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
      setDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save plan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price / 100, // Convert from cents
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      trialPeriodDays: plan.trialPeriodDays,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      features: plan.features,
    });
    setFeaturesText(plan.features.join('\n'));
    setDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      toast.success('Plan deactivated successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 0,
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      features: [],
    });
    setFeaturesText('');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pricing Plans</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Update the pricing plan details'
                  : 'Create a new pricing plan for your service'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="interval">Billing Interval</Label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, interval: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trialPeriodDays">Trial Days</Label>
                  <Input
                    id="trialPeriodDays"
                    type="number"
                    value={formData.trialPeriodDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        trialPeriodDays: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  rows={5}
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isPopular: checked }))
                    }
                  />
                  <Label htmlFor="isPopular">Mark as Popular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>Manage your pricing plans and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Popular</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-muted-foreground text-sm">{plan.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{plan.priceDisplay}</TableCell>
                  <TableCell>{plan.interval}</TableCell>
                  <TableCell>
                    {plan.trialPeriodDays > 0 ? `${plan.trialPeriodDays} days` : 'None'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.isPopular && <Badge variant="outline">Popular</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
