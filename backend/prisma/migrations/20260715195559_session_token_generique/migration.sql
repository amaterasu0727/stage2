/*
  Warnings:

  - You are about to drop the column `utilisateurId` on the `session_tokens` table. All the data in the column will be lost.
  - Added the required column `compteId` to the `session_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeCompte` to the `session_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `session_tokens` DROP FOREIGN KEY `session_tokens_utilisateurId_fkey`;

-- DropIndex
DROP INDEX `session_tokens_utilisateurId_fkey` ON `session_tokens`;

-- AlterTable
ALTER TABLE `agents` ADD COLUMN `codeVerification` VARCHAR(191) NULL,
    ADD COLUMN `codeVerificationExpiration` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `session_tokens` DROP COLUMN `utilisateurId`,
    ADD COLUMN `compteId` INTEGER NOT NULL,
    ADD COLUMN `typeCompte` VARCHAR(191) NOT NULL;
