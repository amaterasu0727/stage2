-- DropForeignKey
ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_categorieId_fkey`;

-- DropIndex
DROP INDEX `tickets_categorieId_fkey` ON `tickets`;

-- AlterTable
ALTER TABLE `tickets` MODIFY `categorieId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_categorieId_fkey` FOREIGN KEY (`categorieId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
