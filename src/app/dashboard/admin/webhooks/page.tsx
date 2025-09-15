'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Settings, AlertTriangle, CheckCircle } from 'lucide-react';
import { CreateWebhookDialog } from '@/components/admin/create-webhook-dialog';
import { WebhookDetailsDialog } from '@/components/admin/webhook-details-dialog';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  eventTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookStats {
  totalDeliveries: number;
  successRate: number;
  deliveryStats: Record<string, number>;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEndpoint | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchWebhooks();
      fetchStats();
    }
  }, [organizationId]);

  const fetchUserOrganization = async () => {
    try {
      const response = await fetch('/api/me/organization');
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organizationId);
      } else {
        console.error('Failed to fetch user organization');
      }
    } catch (error) {
      console.error('Failed to fetch user organization:', error);
    }
  };

  const fetchWebhooks = async () => {
    if (!organizationId) return;

    try {
      const response = await fetch('/api/webhooks', {
        headers: {
          'x-organization-id': organizationId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.endpoints);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!organizationId) return;

    try {
      const response = await fetch('/api/audit/stats', {
        headers: {
          'x-organization-id': organizationId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhook stats:', error);
    }
  };

  const handleWebhookCreated = () => {
    setShowCreateDialog(false);
    fetchWebhooks();
    fetchStats();
  };

  const handleWebhookClick = (webhook: WebhookEndpoint) => {
    setSelectedWebhook(webhook);
    setShowDetailsDialog(true);
  };

  const handleWebhookUpdated = () => {
    setShowDetailsDialog(false);
    fetchWebhooks();
    fetchStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Webhooks</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Manage webhook endpoints and monitor delivery status
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{webhooks.length}</div>
              <p className="text-xs text-muted-foreground">
                {webhooks.filter(w => w.isActive).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.deliveryStats.success || 0} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveryStats.failed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.deliveryStats.retrying || 0} retrying
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Webhook Endpoints</h2>

        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first webhook endpoint to start receiving event notifications
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card
                key={webhook.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleWebhookClick(webhook)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{webhook.name}</CardTitle>
                    <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-sm">
                    {webhook.url}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {webhook.eventTypes.map((eventType) => (
                      <Badge key={eventType} variant="outline">
                        {eventType}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Created {new Date(webhook.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateWebhookDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onWebhookCreated={handleWebhookCreated}
      />

      {selectedWebhook && (
        <WebhookDetailsDialog
          webhook={selectedWebhook}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onWebhookUpdated={handleWebhookUpdated}
        />
      )}
    </div>
  );
}