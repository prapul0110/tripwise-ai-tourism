CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('free','pro') NOT NULL DEFAULT 'free',
	`status` enum('active','cancelled','pending','expired') NOT NULL DEFAULT 'active',
	`provider` varchar(40) DEFAULT 'demo',
	`renewalDate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`destination` varchar(120) NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`days` int NOT NULL,
	`travelers` int NOT NULL,
	`budgetTier` enum('Budget','Moderate','Premium','Luxury') NOT NULL,
	`budgetAmount` int NOT NULL,
	`styles` json NOT NULL,
	`itinerary` json NOT NULL,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trips` ADD CONSTRAINT `trips_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;