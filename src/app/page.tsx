import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Github, Star, Users, Shield, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: 'Authentication Ready',
      description: 'Built-in auth with Better Auth, supporting credentials and OAuth providers.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with Next.js 15 App Router and React Server Components.',
    },
    {
      icon: Users,
      title: 'Multi-tenancy',
      description: 'Organization support with role-based access control out of the box.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="space-y-6 text-center">
          <h1 className="text-4xl font-bold text-gray-900 md:text-6xl dark:text-white">
            Build Your SaaS
            <span className="text-blue-600 dark:text-blue-400"> Faster</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            A production-ready dashboard template with authentication, database, and UI components.
            Start building your SaaS in minutes, not months.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="/auth/signin">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href="https://github.com/iDevEngineer/saas-dash"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-4 h-10 w-10 text-blue-600 dark:text-blue-400" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Built with Modern Technologies
        </h2>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 md:grid-cols-4">
          {[
            'Next.js 15',
            'TypeScript',
            'Tailwind CSS',
            'PostgreSQL',
            'Drizzle ORM',
            'Docker',
            'ShadCN/UI',
            'Better Auth',
          ].map((tech) => (
            <div
              key={tech}
              className="flex items-center justify-center rounded-lg border bg-white p-4 dark:bg-gray-800"
            >
              <span className="font-medium text-gray-900 dark:text-white">{tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="border-0 bg-blue-600 text-white">
          <CardContent className="py-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Start Building?</h2>
            <p className="mb-8 text-xl opacity-90">
              Join thousands of developers building their SaaS with our template.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">View Demo Dashboard</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600"
              >
                <a href="https://github.com/iDevEngineer/saas-dash">
                  <Star className="mr-2 h-5 w-5" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-gray-600 dark:text-gray-400">© 2024 SaaS Dash. MIT License.</p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <a
                href="https://github.com/iDevEngineer/saas-dash"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                GitHub
              </a>
              <a
                href="/docs"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Documentation
              </a>
              <a
                href="https://discord.gg/saas-dash"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
