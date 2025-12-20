-- CreateTable
CREATE TABLE "PokedexPokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pokedexId" INTEGER NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    CONSTRAINT "PokedexPokemon_pokedexId_fkey" FOREIGN KEY ("pokedexId") REFERENCES "Pokedex" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PokedexPokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PokedexPokemon_pokedexId_pokemonId_key" ON "PokedexPokemon"("pokedexId", "pokemonId");
