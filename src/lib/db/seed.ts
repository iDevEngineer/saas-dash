import { db } from './index';
import { users, accounts, organizations, organizationMembers, projects, tasks } from './schema';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create organizations with text IDs
    const org1Id = randomUUID();
    const org2Id = randomUUID();

    await db.insert(organizations).values([
      {
        id: org1Id,
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'Leading technology solutions provider',
        maxUsers: 10,
      },
      {
        id: org2Id,
        name: 'StartUp Inc',
        slug: 'startup-inc',
        description: 'Innovative startup company',
        maxUsers: 5,
      },
    ]);

    console.log('✅ Created organizations');

    // Create users with text IDs
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminId = randomUUID();
    const user1Id = randomUUID();
    const user2Id = randomUUID();

    await db.insert(users).values([
      {
        id: adminId,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'super_admin',
        emailVerified: new Date(),
      },
      {
        id: user1Id,
        email: 'john@example.com',
        name: 'John Doe',
        role: 'admin',
        emailVerified: new Date(),
      },
      {
        id: user2Id,
        email: 'jane@example.com',
        name: 'Jane Smith',
        role: 'user',
        emailVerified: new Date(),
      },
    ]);

    console.log('✅ Created users');

    // Create credential accounts for Better Auth
    await db.insert(accounts).values([
      {
        id: randomUUID(),
        userId: adminId,
        provider: 'credential',
        providerId: 'credential',
        providerAccountId: 'admin@example.com',
        accountId: adminId,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        userId: user1Id,
        provider: 'credential',
        providerId: 'credential',
        providerAccountId: 'john@example.com',
        accountId: user1Id,
        password: hashedPassword,
      },
      {
        id: randomUUID(),
        userId: user2Id,
        provider: 'credential',
        providerId: 'credential',
        providerAccountId: 'jane@example.com',
        accountId: user2Id,
        password: hashedPassword,
      },
    ]);

    console.log('✅ Created credential accounts for Better Auth');

    // Add users to organizations
    await db.insert(organizationMembers).values([
      {
        id: randomUUID(),
        organizationId: org1Id,
        userId: adminId,
        role: 'owner',
      },
      {
        id: randomUUID(),
        organizationId: org1Id,
        userId: user1Id,
        role: 'admin',
      },
      {
        id: randomUUID(),
        organizationId: org2Id,
        userId: user2Id,
        role: 'owner',
      },
    ]);

    console.log('✅ Added users to organizations');

    // Create projects
    const projectsData = [];
    const statuses = ['draft', 'active', 'completed', 'archived'] as const;
    const projectIds = [];

    for (let i = 0; i < 10; i++) {
      const projectId = randomUUID();
      projectIds.push(projectId);
      projectsData.push({
        id: projectId,
        name: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        organizationId: i < 5 ? org1Id : org2Id,
        ownerId: i < 5 ? user1Id : user2Id,
        priority: Math.floor(Math.random() * 3),
        dueDate: faker.date.future(),
      });
    }

    await db.insert(projects).values(projectsData);
    console.log('✅ Created projects');

    // Create tasks for first 5 projects
    const tasksData = [];
    for (const projectId of projectIds.slice(0, 5)) {
      for (let i = 0; i < 3; i++) {
        tasksData.push({
          id: randomUUID(),
          projectId: projectId,
          title: faker.hacker.phrase(),
          description: faker.lorem.sentence(),
          assigneeId: [user1Id, user2Id][Math.floor(Math.random() * 2)],
          order: i,
          completed: Math.random() > 0.5 ? new Date() : null,
        });
      }
    }

    await db.insert(tasks).values(tasksData);
    console.log('✅ Created tasks');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📧 Test credentials:');
    console.log('  Admin: admin@example.com / password123');
    console.log('  User 1: john@example.com / password123');
    console.log('  User 2: jane@example.com / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;
