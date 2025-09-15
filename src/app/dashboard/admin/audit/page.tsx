'use client';

import { useState, useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AuditEventDetailsDialog } from '@/components/admin/audit-event-details-dialog';

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
}

interface AuditStats {
  eventTypes: Record<string, number>;
  actorTypes: Record<string, number>;
  totalEvents: number;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

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

  useEffect(() => {
    fetchAuditEvents();
    fetchAuditStats();
  }, [page, selectedEventType, selectedActorType, selectedAggregateType, startDate, endDate]);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (selectedEventType && selectedEventType !== 'all') params.append('eventTypes', selectedEventType);
      if (selectedActorType && selectedActorType !== 'all') params.append('actorType', selectedActorType);
      if (selectedAggregateType && selectedAggregateType !== 'all') params.append('aggregateTypes', selectedAggregateType);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/audit/events?${params}`, {
        headers: {
          'x-organization-id': 'current-org-id',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (page === 0) {
          setEvents(data.events);
        } else {
          setEvents(prev => [...prev, ...data.events]);
        }
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch audit events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/audit/stats?${params}`, {
        headers: {
          'x-organization-id': 'current-org-id',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.audit);
      }
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
    setEvents([]);
  };

  const handleEventClick = (event: AuditEvent) => {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
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
    // This would generate and download a CSV/JSON export
    console.log('Export audit log functionality would go here');
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
    if (eventType.includes('login') || eventType.includes('auth')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredEvents = events.filter(event =>
    searchTerm === '' ||
    event.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.aggregateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.aggregateType.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(stats.eventTypes).length} event types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Actions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.actorTypes.user || 0}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.actorTypes.user || 0) / stats.totalEvents * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Events</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.actorTypes.system || 0}</div>
              <p className="text-xs text-muted-foreground">
                Automated processes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Events</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.actorTypes.api_key || 0}</div>
              <p className="text-xs text-muted-foreground">
                API integrations
              </p>
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
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
                {stats && Object.keys(stats.eventTypes).map(type => (
                  <SelectItem key={type} value={type}>
                    {type} ({stats.eventTypes[type]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedActorType} onValueChange={setSelectedActorType}>
              <SelectTrigger>
                <SelectValue placeholder="Actor Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actors</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
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
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
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
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
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
          <CardDescription>
            {filteredEvents.length} events found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && events.length === 0 ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="h-4 w-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                  <div className="h-4 w-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getActorTypeIcon(event.actorType)}
                      <Badge variant="outline" className="text-xs">
                        {event.actorType}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={cn('text-xs', getEventTypeColor(event.eventType))}>
                          {event.eventType}
                        </Badge>
                        <span className="text-sm font-medium">
                          {event.aggregateType}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {event.aggregateId}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.ipAddress && `from ${event.ipAddress} • `}
                        {format(new Date(event.occurredAt), 'PPp')}
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
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
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