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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Send, Eye, Activity, Settings, RefreshCw } from 'lucide-react';

interface EmailHealth {
  isHealthy: boolean;
  providers: Record<string, boolean>;
  availableProviders: string[];
  timestamp: string;
  status: string;
}

interface SendEmailForm {
  to: string;
  subject: string;
  template?: string;
  templateData?: Record<string, unknown>;
  html?: string;
  text?: string;
  priority: 'low' | 'normal' | 'high';
}

interface EmailSettings {
  fromEmail: string;
  provider: string;
  isActive: boolean;
}

const templates = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'email-verification', label: 'Email Verification' },
  { value: 'password-reset', label: 'Password Reset' },
  { value: 'password-reset-success', label: 'Password Reset Success' },
  { value: 'magic-link', label: 'Magic Link' },
];

const templateDataExamples = {
  welcome: { firstName: 'John', email: 'user@example.com' },
  'email-verification': {
    firstName: 'John',
    verificationUrl: 'https://example.com/verify?token=sample',
    expiresIn: '24 hours',
  },
  'password-reset': {
    firstName: 'John',
    resetUrl: 'https://example.com/reset?token=sample',
    expiresIn: '1 hour',
  },
  'password-reset-success': { firstName: 'John', email: 'user@example.com' },
  'magic-link': {
    firstName: 'John',
    loginUrl: 'https://example.com/magic?token=sample',
    expiresIn: '15 minutes',
  },
};

export default function EmailAdminPage() {
  const [health, setHealth] = useState<EmailHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [emailForm, setEmailForm] = useState<SendEmailForm>({
    to: '',
    subject: '',
    priority: 'normal',
  });
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<EmailSettings>({
    fromEmail: '',
    provider: 'resend',
    isActive: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchEmailHealth();
    fetchEmailSettings();
  }, []);

  const fetchEmailHealth = async () => {
    try {
      const response = await fetch('/api/email/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch email health:', error);
      toast.error('Failed to fetch email service status');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await fetch('/api/email/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        setSettingsForm(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch email settings:', error);
      toast.error('Failed to fetch email settings');
    }
  };

  const saveEmailSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch('/api/email/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
        toast.success('Email settings saved successfully!');
        // Refresh health after settings change
        fetchEmailHealth();
      } else {
        toast.error(`Failed to save settings: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save email settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingEmail(true);
    try {
      const payload: Record<string, unknown> = {
        to: emailForm.to,
        subject: emailForm.subject,
        priority: emailForm.priority,
      };

      if (emailForm.template) {
        payload.template = emailForm.template;
        payload.templateData = emailForm.templateData;
      } else {
        payload.html = emailForm.html;
        payload.text = emailForm.text;
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Email sent successfully! Message ID: ${result.messageId}`);
        // Reset form
        setEmailForm({
          to: '',
          subject: '',
          priority: 'normal',
        });
      } else {
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const previewTemplate = async (template: string) => {
    try {
      const response = await fetch(`/api/email/preview/${template}?format=json`);
      const data = await response.json();
      setPreviewHtml(data.html);
    } catch (error) {
      console.error('Failed to preview template:', error);
      toast.error('Failed to preview template');
    }
  };

  const handleTemplateChange = (template: string) => {
    setEmailForm((prev) => ({
      ...prev,
      template,
      templateData: templateDataExamples[template as keyof typeof templateDataExamples],
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
      <div>
        <h1 className="text-3xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Manage email service configuration, send test emails, and preview templates.
        </p>
      </div>

      {/* Email Service Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Email Service Status</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchEmailHealth}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <Badge variant={health?.isHealthy ? 'default' : 'destructive'}>
              {health?.status || 'Unknown'}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Last checked:{' '}
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Never'}
            </span>
          </div>

          {health?.providers && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">Providers</h4>
              <div className="space-y-2">
                {Object.entries(health.providers).map(([provider, isHealthy]) => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="text-sm">{provider}</span>
                    {isHealthy ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Test Email</TabsTrigger>
          <TabsTrigger value="templates">Template Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send test emails using templates or custom HTML content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To Email</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="user@example.com"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={emailForm.priority}
                    onValueChange={(value: 'low' | 'normal' | 'high') =>
                      setEmailForm((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Email Content</Label>
                <Tabs defaultValue="template">
                  <TabsList>
                    <TabsTrigger value="template">Use Template</TabsTrigger>
                    <TabsTrigger value="custom">Custom HTML</TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Template</Label>
                      <Select onValueChange={handleTemplateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.value} value={template.value}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {emailForm.template && (
                      <div className="space-y-2">
                        <Label>Template Data (JSON)</Label>
                        <Textarea
                          placeholder="Template data as JSON"
                          value={JSON.stringify(emailForm.templateData, null, 2)}
                          onChange={(e) => {
                            try {
                              setEmailForm((prev) => ({
                                ...prev,
                                templateData: JSON.parse(e.target.value),
                              }));
                            } catch {
                              // Invalid JSON, ignore
                            }
                          }}
                          className="font-mono text-sm"
                          rows={6}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4">
                    <div className="space-y-2">
                      <Label>HTML Content</Label>
                      <Textarea
                        placeholder="HTML email content"
                        value={emailForm.html || ''}
                        onChange={(e) =>
                          setEmailForm((prev) => ({ ...prev, html: e.target.value }))
                        }
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Text Content</Label>
                      <Textarea
                        placeholder="Plain text email content"
                        value={emailForm.text || ''}
                        onChange={(e) =>
                          setEmailForm((prev) => ({ ...prev, text: e.target.value }))
                        }
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <Button
                onClick={sendTestEmail}
                disabled={sendingEmail || !emailForm.to || !emailForm.subject}
                className="w-full"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Templates</CardTitle>
                <CardDescription>Preview and test email templates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.value}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div>
                      <div className="font-medium">{template.label}</div>
                      <div className="text-muted-foreground text-sm">{template.value}</div>
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewTemplate(template.value)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/api/email/preview/${template.value}`, '_blank')
                        }
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>Preview of selected template will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                {previewHtml ? (
                  <div
                    className="rounded border bg-white p-4"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="text-muted-foreground py-8 text-center">
                    Select a template to preview
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email service settings including sender email and provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Sender Email Address</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={settingsForm.fromEmail}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, fromEmail: e.target.value }))
                      }
                    />
                    <p className="text-muted-foreground text-sm">
                      This email address will be used as the sender for all outgoing emails.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Email Provider</Label>
                    <Select
                      value={settingsForm.provider}
                      onValueChange={(value) =>
                        setSettingsForm((prev) => ({ ...prev, provider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">Resend</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={settingsForm.isActive}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Enable email service
                  </Label>
                </div>

                <Button
                  onClick={saveEmailSettings}
                  disabled={savingSettings || !settingsForm.fromEmail || !settingsForm.provider}
                  className="w-full"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Save Email Settings
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Current Configuration</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    • Sender Email:{' '}
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      {settings?.fromEmail || 'Not configured'}
                    </code>
                  </div>
                  <div>
                    • Provider:{' '}
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      {settings?.provider || 'Not configured'}
                    </code>
                  </div>
                  <div>
                    • Status:{' '}
                    <Badge variant={settings?.isActive ? 'default' : 'secondary'}>
                      {settings?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Email configuration is now managed through the database. Environment variables are
                  used as fallback. See the docs/EMAIL_SETUP.md file for detailed setup
                  instructions.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">API Endpoints</h4>
                <div className="space-y-1 text-sm">
                  <div>• POST /api/email/send - Send emails</div>
                  <div>• GET /api/email/health - Service health check</div>
                  <div>• GET /api/email/settings - Get email settings</div>
                  <div>• PUT /api/email/settings - Update email settings</div>
                  <div>• GET /api/email/preview/[template] - Preview templates</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
