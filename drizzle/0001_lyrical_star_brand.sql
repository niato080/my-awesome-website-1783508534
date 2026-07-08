CREATE TABLE `cartItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cartItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`maxUses` int,
	`currentUses` int DEFAULT 0,
	`minOrderAmount` decimal(10,2),
	`expiresAt` timestamp,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`isActive` boolean DEFAULT true,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
	`subtotal` decimal(10,2) NOT NULL,
	`discountAmount` decimal(10,2) DEFAULT '0',
	`couponCode` varchar(50),
	`total` decimal(10,2) NOT NULL,
	`customerEmail` varchar(320),
	`customerName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `recentlyViewed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recentlyViewed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`userId` int NOT NULL,
	`orderId` int,
	`rating` int NOT NULL,
	`title` varchar(255),
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`coverImage` varchar(500),
	`galleryImages` json DEFAULT ('[]'),
	`zipFileKey` varchar(500),
	`zipFileSize` int,
	`livePreviewUrl` varchar(500),
	`features` json DEFAULT ('[]'),
	`technologies` json DEFAULT ('[]'),
	`tags` json DEFAULT ('[]'),
	`mobileCompatible` boolean DEFAULT true,
	`desktopCompatible` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`averageRating` decimal(3,2) DEFAULT '0',
	`reviewCount` int DEFAULT 0,
	`downloadCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `wishlistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userTemplateIdx` ON `cartItems` (`userId`,`templateId`);--> statement-breakpoint
CREATE INDEX `codeIdx` ON `coupons` (`code`);--> statement-breakpoint
CREATE INDEX `activeIdx` ON `coupons` (`isActive`);--> statement-breakpoint
CREATE INDEX `emailIdx` ON `newsletterSubscribers` (`email`);--> statement-breakpoint
CREATE INDEX `activeIdx` ON `newsletterSubscribers` (`isActive`);--> statement-breakpoint
CREATE INDEX `orderIdx` ON `orderItems` (`orderId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `orderItems` (`templateId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `orders` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `stripeIdx` ON `orders` (`stripePaymentIntentId`);--> statement-breakpoint
CREATE INDEX `userTemplateIdx` ON `recentlyViewed` (`userId`,`templateId`);--> statement-breakpoint
CREATE INDEX `templateIdx` ON `reviews` (`templateId`);--> statement-breakpoint
CREATE INDEX `userIdx` ON `reviews` (`userId`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `templates` (`categoryId`);--> statement-breakpoint
CREATE INDEX `slugIdx` ON `templates` (`slug`);--> statement-breakpoint
CREATE INDEX `featuredIdx` ON `templates` (`isFeatured`);--> statement-breakpoint
CREATE INDEX `userTemplateIdx` ON `wishlistItems` (`userId`,`templateId`);