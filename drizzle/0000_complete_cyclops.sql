CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_calendar_tokens_user_id` ON `calendar_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`in_app_enabled` integer DEFAULT true NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`reminder_24h` integer DEFAULT true NOT NULL,
	`reminder_15m` integer DEFAULT true NOT NULL,
	`timezone` text DEFAULT 'Asia/Shanghai' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`user_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `entity_type`, `entity_id`)
);
