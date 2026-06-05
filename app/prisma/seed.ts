import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingConcierge = await prisma.concierges.findFirst({
    where: { email: 'conserje@edificio.cl' }
  });

  if (!existingConcierge) {
    await prisma.concierges.create({
      data: {
        full_name: 'Conserje Principal',
        email: 'conserje@edificio.cl',
        shift: 'dia',
      },
    });
  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });