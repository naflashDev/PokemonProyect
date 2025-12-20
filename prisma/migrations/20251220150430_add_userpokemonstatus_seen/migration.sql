-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserPokemonStatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "has" BOOLEAN NOT NULL DEFAULT false,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "shinyOnly" BOOLEAN NOT NULL DEFAULT false,
    "allForms" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserPokemonStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPokemonStatus_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "Pokemon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserPokemonStatus" ("allForms", "has", "id", "pokemonId", "shinyOnly", "userId") SELECT "allForms", "has", "id", "pokemonId", "shinyOnly", "userId" FROM "UserPokemonStatus";
DROP TABLE "UserPokemonStatus";
ALTER TABLE "new_UserPokemonStatus" RENAME TO "UserPokemonStatus";
CREATE UNIQUE INDEX "UserPokemonStatus_userId_pokemonId_key" ON "UserPokemonStatus"("userId", "pokemonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
