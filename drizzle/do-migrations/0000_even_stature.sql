-- Create game_state table
CREATE TABLE `game_state` (
  `id` integer PRIMARY KEY CHECK (id = 1),
  `status` text NOT NULL DEFAULT 'waiting',
  `player_x_id` text,
  `player_o_id` text,
  `current_turn` text NOT NULL DEFAULT 'X',
  `pieces_placed_this_turn` integer NOT NULL DEFAULT 0,
  `move_count` integer NOT NULL DEFAULT 0,
  `winner` text,
  `win_reason` text,
  `win_line` text,
  `started_at` integer,
  `updated_at` integer NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create cells table (sparse board storage)
CREATE TABLE `cells` (
  `q` integer NOT NULL,
  `r` integer NOT NULL,
  `player` text NOT NULL,
  `placed_at` integer NOT NULL DEFAULT (strftime('%s', 'now')),
  `move_index` integer NOT NULL,
  PRIMARY KEY (q, r)
);

-- Create moves table (move history)
CREATE TABLE `moves` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `player` text NOT NULL,
  `q` integer NOT NULL,
  `r` integer NOT NULL,
  `move_index` integer NOT NULL,
  `timestamp` integer NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Create queue_entries table for matchmaking
CREATE TABLE `queue_entries` (
  `user_id` text PRIMARY KEY NOT NULL,
  `elo` integer NOT NULL,
  `game_mode` text NOT NULL DEFAULT 'standard',
  `enqueued_at` integer NOT NULL
);

-- Create match_results table for matchmaking
CREATE TABLE `match_results` (
  `user_id` text PRIMARY KEY NOT NULL,
  `game_id` text NOT NULL,
  `matched_at` integer NOT NULL
);
