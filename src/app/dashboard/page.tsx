import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { projects, tasks, organizationMembers } from '@/lib/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, CheckCircle2, Clock, Users, TrendingUp, Activity } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  // Get user's organization
  const [userOrg] = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, session.user.id))
    .limit(1);

  // Get statistics
  const projectsCount = await db
    .select({ count: count() })
    .from(projects)
    .where(
      userOrg
        ? eq(projects.organizationId, userOrg.organizationId)
        : eq(projects.ownerId, session.user.id)
    );

  const tasksStats = await db
    .select({
      total: count(),
      completed: count(tasks.completed),
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      userOrg
        ? eq(projects.organizationId, userOrg.organizationId)
        : eq(projects.ownerId, session.user.id)
    );

  const recentProjects = await db
    .select()
    .from(projects)
    .where(
      userOrg
        ? eq(projects.organizationId, userOrg.organizationId)
        : eq(projects.ownerId, session.user.id)
    )
    .orderBy(desc(projects.createdAt))
    .limit(5);

  const stats = [
    {
      title: 'Total Projects',
      value: projectsCount[0]?.count || 0,
      description: 'Active projects in your workspace',
      icon: FolderOpen,
      trend: '+12%',
    },
    {
      title: 'Tasks Completed',
      value: tasksStats[0]?.completed || 0,
      description: `Out of ${tasksStats[0]?.total || 0} total tasks`,
      icon: CheckCircle2,
      trend: '+8%',
    },
    {
      title: 'Active Hours',
      value: '142',
      description: 'This month',
      icon: Clock,
      trend: '+23%',
    },
    {
      title: 'Team Members',
      value: userOrg ? '5' : '1',
      description: 'In your organization',
      icon: Users,
      trend: '+2',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session.user.name || session.user.email}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
              <div className="mt-2 flex items-center">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently updated projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-4">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                      <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {project.description?.substring(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'default'
                          : project.status === 'completed'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {project.status}
                    </Badge>
                    <Activity className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                No projects yet. Create your first project to get started!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button className="rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <h4 className="mb-1 font-medium text-gray-900 dark:text-white">Create New Project</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start a new project from scratch
              </p>
            </button>
            <button className="rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <h4 className="mb-1 font-medium text-gray-900 dark:text-white">Invite Team Member</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add collaborators to your workspace
              </p>
            </button>
            <button className="rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <h4 className="mb-1 font-medium text-gray-900 dark:text-white">View Analytics</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check your project performance
              </p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
