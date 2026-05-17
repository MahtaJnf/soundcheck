/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (optional - removes all data first)
  console.log('🧹 Cleaning database...');
  await prisma.booking.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();

  // Create Venues
  console.log('🏛️  Creating venues...');
  const wiltern = await prisma.venue.create({
    data: {
      name: 'The Wiltern',
      address: '3790 Wilshire Blvd, Los Angeles, CA 90010',
      capacity: 1850,
    },
  });

  const hollywoodBowl = await prisma.venue.create({
    data: {
      name: 'Hollywood Bowl',
      address: '2301 N Highland Ave, Los Angeles, CA 90068',
      capacity: 17500,
    },
  });

  // Create Events
  console.log('🎵 Creating events...');
  const taylorSwift = await prisma.event.create({
    data: {
      title: 'Taylor Swift | The Eras Tour',
      description:
        "Experience all of Taylor Swift's musical eras in one spectacular night.",
      date: new Date('2026-08-15T20:00:00'),
      price: 199.99,
      tags: ['pop', 'stadium', 'sold-out'],
      imageUrl: 'https://example.com/taylor-swift.jpg',
      venueId: hollywoodBowl.id,
    },
  });

  const theWeeknd = await prisma.event.create({
    data: {
      title: 'The Weeknd | After Hours Tour',
      description: 'The Weeknd returns with his biggest show yet.',
      date: new Date('2026-09-22T21:00:00'),
      price: 149.99,
      tags: ['r&b', 'pop', 'arena'],
      venueId: wiltern.id,
    },
  });

  const billie = await prisma.event.create({
    data: {
      title: 'Billie Eilish | Happier Than Ever',
      description: 'An intimate performance from Billie Eilish.',
      date: new Date('2026-07-10T19:30:00'),
      price: 89.99,
      tags: ['alternative', 'indie'],
      venueId: wiltern.id,
    },
  });

  // Create Seats for each event
  console.log('💺 Creating seats...');

  const sections = ['Orchestra', 'Mezzanine', 'Balcony'];
  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seatsPerRow = 10;

  const events = [taylorSwift, theWeeknd, billie];

  for (const event of events) {
    for (const section of sections) {
      for (const row of rows) {
        for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
          await prisma.seat.create({
            data: {
              seatNumber: seatNum.toString(),
              row,
              section,
              status: 'AVAILABLE',
              eventId: event.id,
            },
          });
        }
      }
    }
  }

  console.log('✅ Seed completed!');
  console.log(`📊 Created:`);
  console.log(`   - 2 venues`);
  console.log(`   - 3 events`);
  console.log(`   - ${3 * sections.length * rows.length * seatsPerRow} seats`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
