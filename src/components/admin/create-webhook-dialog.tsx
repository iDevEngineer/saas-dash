'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  url: z.string().url('Must be a valid URL'),
  eventTypes: z.array(z.string()).min(1, 'At least one event type is required'),
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(1).max(10),
    backoffFactor: z.number().min(1).max(10),
  }).optional(),
});

type CreateWebhookForm = z.infer<typeof createWebhookSchema>;

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebhookCreated: () => void;
}

const availableEventTypes = [
  'user.created',
  'user.updated',
  'user.deleted',
  'organization.created',
  'organization.updated',
  'project.created',
  'project.updated',
  'project.deleted',
  'subscription.created',
  'subscription.updated',
  'subscription.cancelled',
  'payment.succeeded',
  'payment.failed',
  '*', // All events
];

export function CreateWebhookDialog({
  open,
  onOpenChange,
  onWebhookCreated,
}: CreateWebhookDialogProps) {
  const [loading, setLoading] = useState(false);
  const [secretToken, setSecretToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const form = useForm<CreateWebhookForm>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      name: '',
      url: '',
      eventTypes: [],
      headers: {},
      retryPolicy: {
        maxAttempts: 3,
        backoffFactor: 2,
      },
    },
  });

  const watchedEventTypes = form.watch('eventTypes');

  const handleSubmit = async (data: CreateWebhookForm) => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': 'current-org-id', // This would come from context
        },
        body: JSON.stringify({
          ...data,
          headers: customHeaders,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSecretToken(result.secretToken);
        toast.success('Webhook created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create webhook');
      }
    } catch (error) {
      toast.error('Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const addEventType = (eventType: string) => {
    const currentTypes = form.getValues('eventTypes');
    if (!currentTypes.includes(eventType)) {
      form.setValue('eventTypes', [...currentTypes, eventType]);
    }
  };

  const removeEventType = (eventType: string) => {
    const currentTypes = form.getValues('eventTypes');
    form.setValue('eventTypes', currentTypes.filter(type => type !== eventType));
  };

  const addCustomEventType = () => {
    if (newEventType && !watchedEventTypes.includes(newEventType)) {
      addEventType(newEventType);
      setNewEventType('');
    }
  };

  const addCustomHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setCustomHeaders(prev => ({
        ...prev,
        [newHeaderKey]: newHeaderValue,
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeCustomHeader = (key: string) => {
    setCustomHeaders(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const copySecretToken = async () => {
    if (secretToken) {
      await navigator.clipboard.writeText(secretToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Secret token copied to clipboard');
    }
  };

  const handleClose = () => {
    if (secretToken) {
      onWebhookCreated();
      setSecretToken(null);
    }
    onOpenChange(false);
    form.reset();
    setCustomHeaders({});
  };

  if (secretToken) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Webhook Created Successfully!</DialogTitle>
            <DialogDescription>
              Your webhook has been created. Please save the secret token below - it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Secret Token</label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={secretToken}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copySecretToken}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use this token to verify webhook signatures
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a new webhook endpoint to receive event notifications
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Webhook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com/webhooks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Event Types */}
            <div className="space-y-3">
              <FormLabel>Event Types</FormLabel>

              <div className="flex flex-wrap gap-2">
                {availableEventTypes.map((eventType) => (
                  <Badge
                    key={eventType}
                    variant={watchedEventTypes.includes(eventType) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (watchedEventTypes.includes(eventType)) {
                        removeEventType(eventType);
                      } else {
                        addEventType(eventType);
                      }
                    }}
                  >
                    {eventType}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="custom.event.type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEventType())}
                />
                <Button type="button" variant="outline" onClick={addCustomEventType}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {watchedEventTypes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Selected events:</p>
                  <div className="flex flex-wrap gap-2">
                    {watchedEventTypes.map((eventType) => (
                      <Badge key={eventType} variant="default" className="group">
                        {eventType}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                          onClick={() => removeEventType(eventType)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Headers */}
            <div className="space-y-3">
              <FormLabel>Custom Headers (Optional)</FormLabel>

              <div className="flex gap-2">
                <Input
                  placeholder="Header name"
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                />
                <Input
                  placeholder="Header value"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={addCustomHeader}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {Object.keys(customHeaders).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(customHeaders).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 border rounded">
                      <code className="text-sm">{key}: {value}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomHeader(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retry Policy */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="retryPolicy.maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Retry Attempts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of delivery attempts (1-10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="retryPolicy.backoffFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backoff Factor</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Exponential backoff multiplier (1-10)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}