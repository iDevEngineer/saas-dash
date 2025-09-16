'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Shield,
  User,
  Calendar as CalendarIcon,
  Filter,
  Download,
  Eye,
  Search,
  Activity,
  Users,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AuditEventDetailsDialog } from '@/components/admin/audit-event-details-dialog';

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

interface AuditStats {
  totals: {
    events: number;
    uniqueUsers: number;
    eventTypes: number;
    highSeverityEvents: number;
    failedActions: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  bySeverity: Array<{
    severity: string;
    count: number;
    percentage: number;
  }>;
  topEventTypes: Array<{
    eventType: string;
    count: number;
  }>;
}

export default function AuditPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedActorType, setSelectedActorType] = useState<string>('all');
  const [selectedAggregateType, setSelectedAggregateType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  // Fetch user's organization on mount
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/me/organization');
        if (response.ok) {
          const data = await response.json();
          setOrganizationId(data.organizationId);
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error);
      }
    };

    fetchOrganization();
  }, [session]);

  useEffect(() => {
    if (organizationId) {
      fetchAuditEvents();
      fetchAuditStats();
    }
  }, [
    organizationId,
    page,
    selectedEventType,
    selectedActorType,
    selectedAggregateType,
    startDate,
    endDate,
  ]);

  const fetchAuditEvents = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (selectedEventType && selectedEventType !== 'all')
        params.append('eventType', selectedEventType);
      if (selectedActorType && selectedActorType !== 'all')
        params.append('source', selectedActorType);
      if (selectedAggregateType && selectedAggregateType !== 'all')
        params.append('resourceType', selectedAggregateType);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/audit/events?${params}`);

      if (response.ok) {
        const data = await response.json();
        if (page === 0) {
          setEvents(data.events || []);
        } else {
          setEvents((prev) => [...prev, ...(data.events || [])]);
        }
        setHasMore(data.pagination?.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch audit events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    if (!organizationId) return;

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/audit/stats?${params}`);

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const handleEventClick = (event: AuditEvent) => {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const clearFilters = () => {
    setSelectedEventType('');
    setSelectedActorType('');
    setSelectedAggregateType('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm('');
    setPage(0);
    setEvents([]);
  };

  const exportAuditLog = async () => {
    if (!organizationId) return;

    try {
      const params = new URLSearchParams({
        format: 'csv',
      });

      if (selectedEventType && selectedEventType !== 'all')
        params.append('eventType', selectedEventType);
      if (selectedActorType && selectedActorType !== 'all')
        params.append('source', selectedActorType);
      if (selectedAggregateType && selectedAggregateType !== 'all')
        params.append('resourceType', selectedAggregateType);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/audit/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `audit-events-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export audit log');
      }
    } catch (error) {
      console.error('Failed to export audit log:', error);
    }
  };

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
    if (eventType.includes('create')) return 'bg-green-100 text-green-800';
    if (eventType.includes('update')) return 'bg-blue-100 text-blue-800';
    if (eventType.includes('delete')) return 'bg-red-100 text-red-800';
    if (eventType.includes('login') || eventType.includes('auth'))
      return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredEvents = events.filter(
    (event) =>
      searchTerm === '' ||
      event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state if session or organization is not loaded
  if (!session?.user || !organizationId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center space-x-4">
              <div className="bg-muted h-4 w-4 rounded"></div>
              <div className="bg-muted h-4 flex-1 rounded"></div>
              <div className="bg-muted h-4 w-20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track and monitor all activity across your organization
          </p>
        </div>
        <Button onClick={exportAuditLog} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.events}</div>
              <p className="text-muted-foreground text-xs">{stats.totals.eventTypes} event types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.uniqueUsers}</div>
              <p className="text-muted-foreground text-xs">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <Shield className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.highSeverityEvents}</div>
              <p className="text-muted-foreground text-xs">Critical events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <Zap className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals.failedActions}</div>
              <p className="text-muted-foreground text-xs">Error events</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={selectedEventType} onValueChange={setSelectedEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {stats &&
                  stats.topEventTypes.map((type) => (
                    <SelectItem key={type.eventType} value={type.eventType}>
                      {type.eventType} ({type.count})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={selectedActorType} onValueChange={setSelectedActorType}>
              <SelectTrigger>
                <SelectValue placeholder="Source Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedAggregateType} onValueChange={setSelectedAggregateType}>
              <SelectTrigger>
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="webhook_endpoint">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>{filteredEvents.length} events found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && events.length === 0 ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center space-x-4">
                  <div className="bg-muted h-4 w-4 rounded"></div>
                  <div className="bg-muted h-4 flex-1 rounded"></div>
                  <div className="bg-muted h-4 w-20 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No events found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or date range</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getActorTypeIcon(event.source)}
                      <Badge variant="outline" className="text-xs">
                        {event.source}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={cn('text-xs', getEventTypeColor(event.eventType))}>
                          {event.eventType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {event.severity}
                        </Badge>
                        <span className="text-sm font-medium">{event.resourceType}</span>
                        <span className="text-muted-foreground text-sm">{event.resourceId}</span>
                      </div>
                      <div className="text-foreground mt-1 text-sm">{event.description}</div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {event.userName && `${event.userName} • `}
                        {format(new Date(event.timestamp), 'PPp')}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <AuditEventDetailsDialog
          event={selectedEvent}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}
    </div>
  );
}
