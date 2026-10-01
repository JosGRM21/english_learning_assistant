import { EventHandler } from './types';

export class DomainEventBus {
  private static instance: DomainEventBus | null = null;
  private handlers = new Map<string, Set<EventHandler>>();

  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  public subscribe<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    const handlersSet = this.handlers.get(eventName)!;
    handlersSet.add(handler);

    return () => {
      handlersSet.delete(handler);
    };
  }

  public publish<T = any>(eventName: string, payload: T): void {
    const handlersSet = this.handlers.get(eventName);
    if (!handlersSet || handlersSet.size === 0) return;

    for (const handler of Array.from(handlersSet)) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[DomainEventBus] Error executing handler for event "${eventName}":`, err);
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = DomainEventBus.getInstance();
