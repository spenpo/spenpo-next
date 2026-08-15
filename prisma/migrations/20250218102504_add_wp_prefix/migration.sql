-- CreateTable
CREATE TABLE `wp_nextauth_accounts` (
    `id` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `provider` VARCHAR(255) NOT NULL,
    `providerAccountId` VARCHAR(255) NOT NULL,
    `refresh_token` VARCHAR(255) NULL,
    `access_token` VARCHAR(255) NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(255) NULL,
    `scope` VARCHAR(255) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(255) NULL,

    UNIQUE INDEX `wp_nextauth_accounts_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_nextauth_sessions` (
    `id` VARCHAR(255) NOT NULL,
    `sessionToken` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(255) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wp_nextauth_sessions_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_nextauth_users` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(255) NULL,

    UNIQUE INDEX `wp_nextauth_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_nextauth_verification_tokens` (
    `identifier` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wp_nextauth_verification_tokens_token_key`(`token`),
    PRIMARY KEY (`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_spenpo_products` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DOUBLE NOT NULL,
    `hide` BOOLEAN NOT NULL DEFAULT false,
    `learnMore` VARCHAR(255) NULL,
    `buyNow` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_spenpo_orders` (
    `id` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(255) NOT NULL,
    `productId` VARCHAR(255) NOT NULL,
    `metadata` JSON NULL,
    `complete` BOOLEAN NOT NULL DEFAULT false,
    `error` JSON NULL,
    `environment` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_spenpo_mandarin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `traditional` VARCHAR(255) NOT NULL,
    `simplified` VARCHAR(255) NOT NULL,
    `pinyin` VARCHAR(255) NOT NULL,
    `meaning` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_spenpo_truth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sentence` TEXT NOT NULL,
    `is_true` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wp_nextauth_accounts` ADD CONSTRAINT `wp_nextauth_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `wp_nextauth_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_nextauth_sessions` ADD CONSTRAINT `wp_nextauth_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `wp_nextauth_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_spenpo_orders` ADD CONSTRAINT `wp_spenpo_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `wp_nextauth_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_spenpo_orders` ADD CONSTRAINT `wp_spenpo_orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `wp_spenpo_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
