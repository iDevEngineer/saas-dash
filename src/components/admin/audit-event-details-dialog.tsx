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
import {
  User,
  Zap,
  Shield,
  Activity,
  Globe,
  Clock,
  Hash,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditEvent {
  id: number;
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  actorId?: string;
  actorType: string;
  occurredAt: string;
  eventData: Record<string, any>;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  causationId?: string;
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
  const getActorTypeIcon = (actorType: string) => {
    switch (actorType) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Zap className="h-4 w-4" />;
      case 'api_key':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('create')) return 'bg-green-100 text-green-800 border-green-200';
    if (eventType.includes('update')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (eventType.includes('delete')) return 'bg-red-100 text-red-800 border-red-200';
    if (eventType.includes('login') || eventType.includes('auth')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderJsonData = (data: any, title: string) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{title}</Label>
        <div className="bg-muted p-3 rounded-md">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActorTypeIcon(event.actorType)}
            Event Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this audit event
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Event Overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Event Type</Label>
                  <div className="mt-1">
                    <Badge className={cn('text-sm', getEventTypeColor(event.eventType))}>
                      {event.eventType}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Resource</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{event.aggregateType}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.aggregateId}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Actor</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActorTypeIcon(event.actorType)}
                    <Badge variant="outline">{event.actorType}</Badge>
                    {event.actorId && (
                      <span className="text-sm text-muted-foreground">
                        {event.actorId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Timestamp</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(event.occurredAt), 'PPpp')}
                    </span>
                  </div>
                </div>

                {event.ipAddress && (
                  <div>
                    <Label className="text-xs text-muted-foreground">IP Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{event.ipAddress}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Event ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{event.eventId}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Correlation & Causation */}
            {(event.correlationId || event.causationId || event.sessionId) && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Tracing Information</h3>

                  <div className="grid gap-4 md:grid-cols-3">
                    {event.sessionId && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Session ID</Label>
                        <div className="text-sm font-mono mt-1 p-2 bg-muted rounded">
                          {event.sessionId}
                        </div>
                      </div>
                    )}

                    {event.correlationId && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Correlation ID</Label>
                        <div className="text-sm font-mono mt-1 p-2 bg-muted rounded">
                          {event.correlationId}
                        </div>
                      </div>
                    )}

                    {event.causationId && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Causation ID</Label>
                        <div className="text-sm font-mono mt-1 p-2 bg-muted rounded">
                          {event.causationId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* User Agent */}
            {event.userAgent && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User Agent</Label>
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded font-mono">
                    {event.userAgent}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Event Data */}
            {renderJsonData(event.eventData, 'Event Data')}

            {/* Metadata */}
            {renderJsonData(event.metadata, 'Metadata')}

            {/* Raw Event */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Raw Event</Label>
              <div className="bg-muted p-3 rounded-md">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
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