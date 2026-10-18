import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const daysFromNow = (days: number, hour = 8): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main(): Promise<void> {
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.performanceTask.deleteMany();
  await prisma.reviewer.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.subject.deleteMany();

  const filipino = await prisma.subject.create({
    data: { name: 'Filipino', emoji: '📖', color: '#b91c1c' },
  });
  const english = await prisma.subject.create({
    data: { name: 'English', emoji: '✍️', color: '#1d4ed8' },
  });
  const math = await prisma.subject.create({
    data: { name: 'Mathematics', emoji: '🧮', color: '#7c3aed' },
  });
  const science = await prisma.subject.create({
    data: { name: 'Science', emoji: '🔬', color: '#15803d' },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Chapter 5 summary',
        description: 'One-page summary in your own words.',
        subjectId: filipino.id,
        dueAt: daysFromNow(2),
        priority: 'HIGH',
      },
      { title: 'Grammar worksheet 3', subjectId: english.id, dueAt: daysFromNow(4), priority: 'MEDIUM' },
      {
        title: 'Problem set: linear equations',
        subjectId: math.id,
        dueAt: daysFromNow(-1),
        priority: 'HIGH',
      },
      { title: 'Read pages 40-55', subjectId: science.id, dueAt: daysFromNow(6), priority: 'LOW' },
    ],
  });

  await prisma.performanceTask.createMany({
    data: [
      {
        title: 'Group dramatization',
        description: 'Perform a scene from the novel.',
        subjectId: filipino.id,
        dueAt: daysFromNow(10),
        rubricText: 'Script 30%, Acting 40%, Teamwork 30%',
      },
      { title: 'Science fair poster', subjectId: science.id, dueAt: daysFromNow(14) },
    ],
  });

  const reviewer = await prisma.reviewer.create({
    data: {
      title: 'Quarter 2 reviewer',
      description: 'Key concepts and sample questions.',
      subjectId: math.id,
      tag: 'Q2',
    },
  });
  await prisma.attachment.create({
    data: {
      ownerType: 'REVIEWER',
      ownerId: reviewer.id,
      kind: 'link',
      name: 'Khan Academy: Linear equations',
      url: 'https://www.khanacademy.org/math/algebra',
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: 'Class presentation day',
        location: 'Room 204',
        startsAt: daysFromNow(3, 9),
        endsAt: daysFromNow(3, 11),
      },
      {
        title: 'Quarterly exams',
        description: 'Bring pens and calculators.',
        location: 'Classroom',
        startsAt: daysFromNow(12, 7),
        endsAt: daysFromNow(14, 15),
      },
    ],
  });

  await prisma.announcement.create({
    data: {
      title: 'Welcome back!',
      body: 'Check this page daily for tasks, reviewers, and events.',
      pinned: true,
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
