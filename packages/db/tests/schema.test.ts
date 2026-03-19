import { describe, it, expect } from 'vitest';
import * as schema from '../src/schema';
import * as doSchema from '../src/do-schema';

describe('db package', () => {
  it('exports schema tables', () => {
    expect(schema.users).toBeDefined();
    expect(schema.ratings).toBeDefined();
    expect(schema.matches).toBeDefined();
    expect(schema.matchMoves).toBeDefined();
    expect(schema.lessons).toBeDefined();
    expect(schema.lessonProgress).toBeDefined();
  });

  it('exports DO schema tables', () => {
    expect(doSchema.gameState).toBeDefined();
    expect(doSchema.cells).toBeDefined();
    expect(doSchema.moves).toBeDefined();
  });
});
