-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PokedexPokemon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pokedexId" INTEGER NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "captured" BOOLEAN NOT NULL DEFAULT false,
    "shiny" BOOLEAN NOT NULL DEFAULT false,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PokedexPokemon_pokedexId_fkey" FOREIGN KEY ("pokedexId") REFERENCES "Pokedex" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PokedexPokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PokedexPokemon" ("id", "pokedexId", "pokemonId") SELECT "id", "pokedexId", "pokemonId" FROM "PokedexPokemon";
DROP TABLE "PokedexPokemon";
ALTER TABLE "new_PokedexPokemon" RENAME TO "PokedexPokemon";
CREATE UNIQUE INDEX "PokedexPokemon_pokedexId_pokemonId_key" ON "PokedexPokemon"("pokedexId", "pokemonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
