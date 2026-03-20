CREATE TABLE `cells` (
	`q` integer NOT NULL,
	`r` integer NOT NULL,
	`player` text NOT NULL,
	`placed_at` integer NOT NULL,
	`move_index` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_state` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`player_x_id` text,
	`player_o_id` text,
	`current_turn` text DEFAULT 'X' NOT NULL,
	`pieces_placed_this_turn` integer DEFAULT 0 NOT NULL,
	`move_count` integer DEFAULT 0 NOT NULL,
	`winner` text,
	`win_reason` text,
	`win_line` text,
	`started_at` integer,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player` text NOT NULL,
	`q` integer NOT NULL,
	`r` integer NOT NULL,
	`move_index` integer NOT NULL,
	`timestamp` integer NOT NULL
);
