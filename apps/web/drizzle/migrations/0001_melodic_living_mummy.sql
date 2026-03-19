CREATE TABLE `lesson_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`score` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`difficulty` integer NOT NULL,
	`order_index` integer NOT NULL,
	`content` text NOT NULL,
	`xp_reward` integer DEFAULT 10 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `match_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` text NOT NULL,
	`move_index` integer NOT NULL,
	`player_id` text NOT NULL,
	`q` integer NOT NULL,
	`r` integer NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`player_x_id` text NOT NULL,
	`player_o_id` text NOT NULL,
	`winner_id` text,
	`win_reason` text,
	`move_count` integer NOT NULL,
	`duration_sec` integer NOT NULL,
	`board_radius` integer DEFAULT 20 NOT NULL,
	`elo_x_before` integer NOT NULL,
	`elo_o_before` integer NOT NULL,
	`elo_x_after` integer NOT NULL,
	`elo_o_after` integer NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer NOT NULL,
	`final_board` text,
	FOREIGN KEY (`player_x_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_o_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`game_mode` text DEFAULT 'standard' NOT NULL,
	`elo` integer DEFAULT 1200 NOT NULL,
	`peak_elo` integer DEFAULT 1200 NOT NULL,
	`games_played` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`draws` integer DEFAULT 0 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `songs` ADD `created_at` integer NOT NULL;