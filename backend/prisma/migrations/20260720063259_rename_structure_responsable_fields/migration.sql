/*
  Warnings:

  - You are about to drop the column `mailrespo` on the `structures` table. All the data in the column will be lost.
  - You are about to drop the column `nomrespo` on the `structures` table. All the data in the column will be lost.
  - You are about to drop the column `numrespo` on the `structures` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `structures` DROP COLUMN `mailrespo`,
    DROP COLUMN `nomrespo`,
    DROP COLUMN `numrespo`,
    ADD COLUMN `mailResponsable` VARCHAR(191) NULL,
    ADD COLUMN `nomResponsable` VARCHAR(191) NULL,
    ADD COLUMN `numResponsable` VARCHAR(191) NULL,
    ADD COLUMN `prenomResponsable` VARCHAR(191) NULL;
