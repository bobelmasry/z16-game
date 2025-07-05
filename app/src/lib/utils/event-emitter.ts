type Listener<Args extends any[]> = (...args: Args) => void;

export class EventEmitter<Events extends { [K in keyof Events]: any[] }> {
  private listeners: Map<keyof Events, Set<Listener<any[]>>> = new Map();

  /**
   * Register a listener for the given event.
   */
  on<E extends keyof Events>(
    eventName: E,
    listener: Listener<Events[E]>
  ): this {
    const set = this.listeners.get(eventName) ?? new Set<Listener<any[]>>();
    set.add(listener as Listener<any[]>);
    this.listeners.set(eventName, set);
    return this;
  }

  /**
   * Register a one-time listener for the given event.
   */
  once<E extends keyof Events>(
    eventName: E,
    listener: Listener<Events[E]>
  ): this {
    const onceListener: Listener<Events[E]> = (...args) => {
      this.off(eventName, onceListener);
      listener(...args);
    };
    return this.on(eventName, onceListener);
  }

  /**
   * Remove a specific listener, or all listeners for an event if no listener is provided.
   */
  off<E extends keyof Events>(
    eventName: E,
    listener?: Listener<Events[E]>
  ): this {
    if (!listener) {
      this.listeners.delete(eventName);
    } else {
      const set = this.listeners.get(eventName);
      set?.delete(listener as Listener<any[]>);
      if (set && set.size === 0) {
        this.listeners.delete(eventName);
      }
    }
    return this;
  }

  /**
   * Emit an event, invoking all registered listeners with the provided arguments.
   */
  emit<E extends keyof Events>(eventName: E, ...args: Events[E]): boolean {
    const set = this.listeners.get(eventName);
    if (!set || set.size === 0) {
      return false;
    }
    // Copy to prevent issues if listeners modify subscription during emit
    for (const listener of Array.from(set)) {
      (listener as Listener<Events[E]>)(...args);
    }
    return true;
  }

  /**
   * Remove all listeners for all events.
   */
  removeAllListeners(): this {
    this.listeners.clear();
    return this;
  }
}
