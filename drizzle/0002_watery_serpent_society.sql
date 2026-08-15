CREATE TABLE `travelProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferences` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travelProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `travelProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `trips` ADD `budgetBreakdown` json;--> statement-breakpoint
ALTER TABLE `travelProfiles` ADD CONSTRAINT `travelProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;