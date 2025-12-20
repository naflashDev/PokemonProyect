async function main() {
  console.log('Running seed...')

  // dynamic import to work with ts-node ESM/CJS interop
  let prismaModule: any
  try {
    prismaModule = await import('../src/prisma/client')
  } catch (e1) {
    try {
      prismaModule = await import('../src/prisma/client.ts')
    } catch (e2) {
      try {
        prismaModule = await import('../src/prisma/client.js')
      } catch (e3) {
        throw new Error('Could not import prisma client from ../src/prisma/client(.ts|.js)')
      }
    }
  }
  const prisma = prismaModule.default || prismaModule.prisma || prismaModule

  const adminEmail = 'admin@example.com'

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', name: 'Admin' },
    create: { email: adminEmail, name: 'Admin', role: 'ADMIN' }
  })

  console.log('Admin user ensured:', admin.email)

  const kanto = await prisma.pokedex.upsert({
    where: { slug: 'kanto' },
    update: {},
    create: { slug: 'kanto', name: 'Kanto', game: 'Red/Blue', status: 'published' }
  })

  const pokemons = [
    { nationalId: 1, name: 'Bulbasaur', types: 'Grass,Poison', imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    { nationalId: 4, name: 'Charmander', types: 'Fire', imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
    { nationalId: 7, name: 'Squirtle', types: 'Water', imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' }
  ]

  for (const p of pokemons) {
    await prisma.pokemon.upsert({
      where: { id: -1 }, // force create by using non-existing where (Prisma doesn't allow composite upsert by fields easily)
      create: {
        nationalId: p.nationalId,
        name: p.name,
        types: p.types,
        imageUrl: p.imageUrl,
        pokedexId: kanto.id
      },
      update: {}
    }).catch(async (e) => {
      // fallback to create if upsert with fake where fails
      await prisma.pokemon.create({ data: { nationalId: p.nationalId, name: p.name, types: p.types, imageUrl: p.imageUrl, pokedexId: kanto.id } })
    })
  }

  console.log('Seed finished')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    try {
      const prismaModule = await import('../src/prisma/client')
      const prisma = prismaModule.default || prismaModule.prisma || prismaModule
      await prisma.$disconnect()
    } catch (e) {
      // ignore
    }
  })
