import { z } from "zod";

export const HexCoordSchema = z.object({
  q: z.number(),
  r: z.number(),
});

export const PlayerIdSchema = z.enum(["player1", "player2"]);

export const MoveActionSchema = z.object({
  type: z.literal("PLACE_TOKEN"),
  hex: HexCoordSchema,
  player: PlayerIdSchema,
});

export const GameStateSchema = z.object({
  status: z.enum(["WAITING", "PLAYING", "FINISHED"]),
  turn: PlayerIdSchema,
  winner: PlayerIdSchema.nullable(),
  board: z.record(z.string(), PlayerIdSchema), // stringified JSON keys "q,r" to player
});

export type MoveAction = z.infer<typeof MoveActionSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
