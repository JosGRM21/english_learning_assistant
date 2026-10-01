import { describe, it, expect } from 'vitest';
import { polysemyDisambiguator } from '../services/PolysemyDisambiguator';

describe('PolysemyDisambiguator (RF-SEM-03)', () => {
  it('contains all 7 canonical high-confusion polysemic verb pairs', () => {
    const catalog = polysemyDisambiguator.getCatalog();
    expect(catalog.length).toBe(7);

    const keys = catalog.map((p) => p.pairKey);
    expect(keys).toContain('MAKE_DO');
    expect(keys).toContain('SAY_TELL_SPEAK_TALK');
    expect(keys).toContain('HEAR_LISTEN');
    expect(keys).toContain('SEE_LOOK_WATCH');
    expect(keys).toContain('BORROW_LEND');
    expect(keys).toContain('WIN_EARN_GAIN');
    expect(keys).toContain('MISS_LOSE');
  });

  it('correctly evaluates Make vs Do exercises based on creation vs activity distinction', () => {
    const makeDoPair = polysemyDisambiguator.getPairByKey('MAKE_DO');
    expect(makeDoPair).toBeDefined();

    const decisionEx = makeDoPair!.exercises[0]; // "make an important decision"
    const correctResult = polysemyDisambiguator.evaluateExercise(decisionEx, 'make');
    expect(correctResult.isCorrect).toBe(true);

    const wrongResult = polysemyDisambiguator.evaluateExercise(decisionEx, 'do');
    expect(wrongResult.isCorrect).toBe(false);
  });

  it('correctly distinguishes Borrow from Lend based on trajectory of possession', () => {
    const borrowLendPair = polysemyDisambiguator.getPairByKey('BORROW_LEND');
    expect(borrowLendPair).toBeDefined();

    const borrowEx = borrowLendPair!.exercises[0];
    const result = polysemyDisambiguator.evaluateExercise(borrowEx, 'borrow');
    expect(result.isCorrect).toBe(true);
  });

  it('correctly distinguishes Miss from Lose for transport vs physical object', () => {
    const missLosePair = polysemyDisambiguator.getPairByKey('MISS_LOSE');
    expect(missLosePair).toBeDefined();

    const flightEx = missLosePair!.exercises[0];
    const result = polysemyDisambiguator.evaluateExercise(flightEx, 'miss');
    expect(result.isCorrect).toBe(true);
  });
});
