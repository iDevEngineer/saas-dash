'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  Settings,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  eventTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDetailsDialogProps {
  webhook: WebhookEndpoint;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebhookUpdated: () => void;
}

export function WebhookDetailsDialog({
  webhook,
  open,
  onOpenChange,
  onWebhookUpdated,
}: WebhookDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(webhook.isActive);

  const handleToggleActive = async (newActive: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'current-org-id',
        },
        body: JSON.stringify({
          isActive: newActive,
        }),
      });

      if (response.ok) {
        setIsActive(newActive);
        toast.success(`Webhook ${newActive ? 'enabled' : 'disabled'} successfully`);
        onWebhookUpdated();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update webhook');
      }
    } catch (error) {
      toast.error('Failed to update webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': 'current-org-id',
        },
      });

      if (response.ok) {
        toast.success('Webhook deleted successfully');
        onWebhookUpdated();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete webhook');
      }
    } catch (error) {
      toast.error('Failed to delete webhook');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    setLoading(true);
    try {
      // This would trigger a test event to the webhook
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: 'POST',
        headers: {
          'x-organization-id': 'current-org-id',
        },
      });

      if (response.ok) {
        toast.success('Test webhook sent successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send test webhook');
      }
    } catch (error) {
      toast.error('Failed to send test webhook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {webhook.name}
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Manage webhook endpoint configuration and monitor delivery status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Endpoint URL</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {webhook.url}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(webhook.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Event Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {webhook.eventTypes.map((eventType) => (
                  <Badge key={eventType} variant="outline">
                    {eventType}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={handleToggleActive}
                disabled={loading}
              />
              <Label htmlFor="active">
                {isActive ? 'Webhook is active' : 'Webhook is disabled'}
              </Label>
            </div>
          </div>

          {/* Delivery Stats */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Recent Delivery Status</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm font-medium">Successful</div>
                  <div className="text-xs text-muted-foreground">156</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-sm font-medium">Failed</div>
                  <div className="text-xs text-muted-foreground">3</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <RefreshCw className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-sm font-medium">Retrying</div>
                  <div className="text-xs text-muted-foreground">1</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm font-medium">Pending</div>
                  <div className="text-xs text-muted-foreground">0</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <div>{new Date(webhook.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Updated</Label>
              <div>{new Date(webhook.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={testWebhook}
              disabled={loading || !isActive}
            >
              <Settings className="mr-2 h-4 w-4" />
              Send Test
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this webhook? This action cannot be undone and
                    you will stop receiving events at this endpoint.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Webhook
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}