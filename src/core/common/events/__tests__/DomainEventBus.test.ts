import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEventBus } from '../DomainEventBus';
import { ErrorCommittedPayload } from '../types';

describe('DomainEventBus', () => {
  let bus: DomainEventBus;

  beforeEach(() => {
    bus = new DomainEventBus();
    bus.clear();
  });

  it('publishes and delivers event to subscriber', () => {
    const handler = vi.fn();
    bus.subscribe<ErrorCommittedPayload>('ERROR_COMMITTED', handler);

    const payload: ErrorCommittedPayload = {
      userId: 'user_1',
      errorTaxonomyCode: 'L1_PRO_DROP',
      source: 'SRS',
      incorrectToken: 'Is raining',
      correctToken: 'It is raining',
    };

    bus.publish('ERROR_COMMITTED', payload);
    expect(handler).toHaveBeenCalledWith(payload);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes handler properly', () => {
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('ERROR_COMMITTED', handler);

    unsubscribe();
    bus.publish('ERROR_COMMITTED', { foo: 'bar' });
    expect(handler).not.toHaveBeenCalled();
  });
});
