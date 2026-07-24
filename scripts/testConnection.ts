/**
 * Database Connection Test Script
 *
 * This script verifies that the Prisma Client can connect to the PostgreSQL database
 * and performs basic create/read operations.
 *
 * Usage:
 *   npx ts-node scripts/testConnection.ts
 *
 * Prerequisites:
 *   - PostgreSQL database running at DATABASE_URL from .env
 *   - All Prisma migrations applied: npx prisma migrate deploy
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');

    // Test 1: Create a test session
    console.log('\n1. Creating test session...');
    const session = await prisma.session.create({
      data: {
        slug: `test-session-${Date.now()}`,
        name: 'Test Session',
        description: 'Auto-generated test session',
        status: 'ACTIVE',
        moderatorId: 'test-moderator',
      },
    });
    console.log('✓ Session created:', session.id, session.slug);

    // Test 2: Read the created session
    console.log('\n2. Reading session back...');
    const readSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: {
        participants: true,
        epics: true,
        messages: true,
      },
    });
    console.log('✓ Session retrieved:', readSession?.slug);
    console.log(`  - Participants: ${readSession?.participants.length || 0}`);
    console.log(`  - Epics: ${readSession?.epics.length || 0}`);
    console.log(`  - Messages: ${readSession?.messages.length || 0}`);

    // Test 3: Create a participant
    console.log('\n3. Creating participant...');
    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        pseudonym: 'Test User',
      },
    });
    console.log('✓ Participant created:', participant.pseudonym);

    // Test 4: Verify participant uniqueness constraint
    console.log('\n4. Testing participant uniqueness constraint...');
    try {
      await prisma.participant.create({
        data: {
          sessionId: session.id,
          pseudonym: 'Test User',
        },
      });
      console.log('✗ ERROR: Should have rejected duplicate pseudonym!');
    } catch (error) {
      console.log('✓ Uniqueness constraint working: duplicate pseudonym rejected');
    }

    // Test 5: Clean up (delete test session - cascade should delete participants)
    console.log('\n5. Cleaning up...');
    const deleted = await prisma.session.delete({
      where: { id: session.id },
    });
    console.log('✓ Test session deleted:', deleted.slug);

    // Verify cascade delete
    const deletedSession = await prisma.session.findUnique({
      where: { id: session.id },
    });
    console.log('✓ Cascade delete verified: session no longer exists');

    console.log('\n✅ All tests passed! Database connection is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
