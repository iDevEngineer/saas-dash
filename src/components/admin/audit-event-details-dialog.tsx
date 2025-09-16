'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Zap, Shield, Activity, Clock, Hash, Database } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditEvent {
  id: string;
  organizationId: string;
  eventType: string;
  eventCategory: string;
  severity: string;
  description: string;
  userId?: string;
  userName?: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  timestamp: string;
  source: string;
}

interface AuditEventDetailsDialogProps {
  event: AuditEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditEventDetailsDialog({
  event,
  open,
  onOpenChange,
}: AuditEventDetailsDialogProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Zap className="h-4 w-4" />;
      case 'api':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('create')) return 'bg-green-100 text-green-800 border-green-200';
    if (eventType.includes('update')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (eventType.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
    if (eventType.includes('login') || eventType.includes('auth'))
      return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderJsonData = (data: any, title: string) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{title}</Label>
        <div className="bg-muted rounded-md p-3">
          <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSourceIcon(event.source)}
            Event Details
          </DialogTitle>
          <DialogDescription>Detailed information about this audit event</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Event Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Event Type</Label>
                  <div className="mt-1">
                    <Badge className={cn('text-sm', getEventTypeColor(event.eventType))}>
                      {event.eventType}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Resource</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Database className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{event.resourceType}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.resourceId}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Source</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getSourceIcon(event.source)}
                    <Badge variant="outline">{event.source}</Badge>
                    {event.userName && (
                      <span className="text-muted-foreground text-sm">{event.userName}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Timestamp</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">{format(new Date(event.timestamp), 'PPpp')}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Severity</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Shield className="text-muted-foreground h-4 w-4" />
                    <Badge variant="secondary">{event.severity}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Event ID</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Hash className="text-muted-foreground h-4 w-4" />
                    <span className="font-mono text-sm">{event.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Event Category & Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Event Details</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground text-xs">Category</Label>
                  <div className="bg-muted mt-1 rounded p-2 text-sm">{event.eventCategory}</div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Organization ID</Label>
                  <div className="bg-muted mt-1 rounded p-2 font-mono text-sm">
                    {event.organizationId}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <div className="bg-muted mt-1 rounded p-2 text-sm">{event.description}</div>
              </div>
            </div>

            <Separator />

            {/* Metadata */}
            {renderJsonData(event.metadata, 'Metadata')}

            {/* Raw Event */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Raw Event</Label>
              <div className="bg-muted rounded-md p-3">
                <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
