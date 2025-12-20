import prisma from '../src/prisma/client'

async function main() {
  // Do not create any fixtures here. This seed script intentionally
  // only ensures the Prisma client can connect and disconnect. Use
  // `npx prisma db push` or `npx prisma migrate dev` to apply schema.
  console.log('Seed: connecting to database (no fixtures will be created)')
  await prisma.$connect()
  await prisma.$disconnect()
  console.log('Seed finished (no data created)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
