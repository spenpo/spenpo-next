-- AlterTable
ALTER TABLE `wp_nextauth_users` ADD COLUMN `stripeCustomerId` VARCHAR(255) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `wp_nextauth_users_stripeCustomerId_key` ON `wp_nextauth_users`(`stripeCustomerId`);
