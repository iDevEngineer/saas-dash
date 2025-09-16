'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  Trash2,
  Edit,
  RefreshCw,
  Shield,
  Clock,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  permissions: string[];
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

interface CreateApiKeyForm {
  name: string;
  description: string;
  permissions: string[];
  expiresInDays?: number;
}

const availablePermissions = [
  { value: 'read:projects', label: 'Read Projects' },
  { value: 'write:projects', label: 'Write Projects' },
  { value: 'read:analytics', label: 'Read Analytics' },
  { value: 'read:users', label: 'Read Users' },
  { value: 'write:users', label: 'Write Users' },
  { value: 'admin:all', label: 'Admin Access' },
];

export default function ApiKeysAdminPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string>('');
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});
  const [createForm, setCreateForm] = useState<CreateApiKeyForm>({
    name: '',
    description: '',
    permissions: [],
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      // This would be an actual API call
      // const response = await fetch('/api/admin/api-keys');
      // const data = await response.json();

      // Mock data for demo
      const mockData: ApiKey[] = [
        {
          id: '1',
          name: 'Production API',
          description: 'Main production API key for frontend app',
          keyPrefix: 'sk_live_abc123',
          permissions: ['read:projects', 'write:projects', 'read:analytics'],
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          usageCount: 1250,
        },
        {
          id: '2',
          name: 'Development API',
          description: 'Development environment API key',
          keyPrefix: 'sk_test_def456',
          permissions: ['read:projects', 'read:analytics'],
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          usageCount: 45,
        },
      ];

      setApiKeys(mockData);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!createForm.name.trim()) {
      toast.error('API key name is required');
      return;
    }

    setCreating(true);
    try {
      // This would be an actual API call
      // const response = await fetch('/api/admin/api-keys', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(createForm),
      // });

      // Mock response
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setNewKeyValue(newKey);

      const newApiKey: ApiKey = {
        id: String(Date.now()),
        name: createForm.name,
        description: createForm.description,
        keyPrefix: newKey.substring(0, 12) + '...',
        permissions: createForm.permissions,
        isActive: true,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      setApiKeys([newApiKey, ...apiKeys]);
      toast.success('API key created successfully!');

      setCreateForm({ name: '', description: '', permissions: [] });
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      // This would be an actual API call
      // await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' });

      setApiKeys(apiKeys.filter((key) => key.id !== id));
      toast.success('API key deleted successfully');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const toggleApiKey = async (id: string) => {
    try {
      // This would be an actual API call
      // await fetch(`/api/admin/api-keys/${id}/toggle`, { method: 'PATCH' });

      setApiKeys(apiKeys.map((key) => (key.id === id ? { ...key, isActive: !key.isActive } : key)));
      toast.success('API key status updated');
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      toast.error('Failed to update API key status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyValues((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-muted-foreground">
            Create and manage API keys for programmatic access to your application.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key with specific permissions and optional expiration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Production API Key"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this API key"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map((permission) => (
                    <label key={permission.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={createForm.permissions.includes(permission.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCreateForm((prev) => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.value],
                            }));
                          } else {
                            setCreateForm((prev) => ({
                              ...prev,
                              permissions: prev.permissions.filter((p) => p !== permission.value),
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expires In (optional)</Label>
                <Select
                  value={createForm.expiresInDays?.toString() || ''}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      expiresInDays: value ? parseInt(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={createApiKey}
                disabled={
                  creating || !createForm.name.trim() || createForm.permissions.length === 0
                }
                className="w-full"
              >
                {creating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Create API Key
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Key Display */}
      {newKeyValue && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Your new API key has been created:</p>
              <div className="flex items-center space-x-2">
                <code className="bg-muted flex-1 rounded p-2 font-mono text-sm">{newKeyValue}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKeyValue)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <Button size="sm" onClick={() => setNewKeyValue('')}>
                I've saved it securely
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-medium">No API Keys</h3>
              <p className="text-muted-foreground text-center">
                Create your first API key to start using programmatic access.
              </p>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                        {apiKey.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                      {apiKey.expiresAt && (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    {apiKey.description && (
                      <p className="text-muted-foreground text-sm">{apiKey.description}</p>
                    )}
                    <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                      <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                      {apiKey.lastUsed && (
                        <span>Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>
                      )}
                      <span className="flex items-center">
                        <Activity className="mr-1 h-3 w-3" />
                        {apiKey.usageCount} requests
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleApiKey(apiKey.id)}>
                        {apiKey.isActive ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteApiKey(apiKey.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <code className="bg-muted flex-1 rounded p-2 font-mono text-sm">
                        {showKeyValues[apiKey.id]
                          ? `${apiKey.keyPrefix}${'*'.repeat(32)}`
                          : `${apiKey.keyPrefix}${'*'.repeat(16)}`}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {showKeyValues[apiKey.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(apiKey.keyPrefix)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Guidelines</CardTitle>
          <CardDescription>
            Important information about using your API keys securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Security Best Practices</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• Never expose API keys in client-side code or public repositories</li>
              <li>• Use environment variables to store API keys in your applications</li>
              <li>• Regularly rotate your API keys, especially for production use</li>
              <li>• Use the minimum required permissions for each API key</li>
              <li>• Monitor API key usage and disable unused keys</li>
            </ul>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">API Endpoints</h4>
            <div className="text-muted-foreground space-y-1 text-sm">
              <div>
                • Base URL:{' '}
                <code className="bg-muted rounded px-1">https://api.yourdomain.com</code>
              </div>
              <div>
                • Authentication: Include API key in{' '}
                <code className="bg-muted rounded px-1">Authorization: Bearer YOUR_API_KEY</code>{' '}
                header
              </div>
              <div>• Rate limits: 1000 requests per hour for standard keys</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
