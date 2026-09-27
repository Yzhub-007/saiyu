CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`match_id` text NOT NULL,
	`trigger` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_notifications_unique` ON `notifications` (`user_id`,`match_id`,`trigger`);--> statement-breakpoint
CREATE TABLE `reminder_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`match_id` text NOT NULL,
	`trigger` text NOT NULL,
	`channel` text NOT NULL,
	`sent_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reminder_delivery_unique` ON `reminder_deliveries` (`user_id`,`match_id`,`trigger`,`channel`);--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD `user_email` text;