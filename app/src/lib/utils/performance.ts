export class PerformanceMonitor {
  private samples: number[] = [];
  private maxSamples = 100;
  private lastTime = 0;
  private enabled = false;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  startTiming() {
    if (!this.enabled) return;
    this.lastTime = performance.now();
  }

  endTiming() {
    if (!this.enabled) return;
    const duration = performance.now() - this.lastTime;
    this.samples.push(duration);

    // Keep only the last N samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  getStats() {
    if (this.samples.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0, maxFreq: 0 };
    }

    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const min = Math.min(...this.samples);
    const max = Math.max(...this.samples);
    const maxFreq = avg > 0 ? Math.floor(1000 / avg) : 0;

    return { avg, min, max, count: this.samples.length, maxFreq };
  }

  reset() {
    this.samples = [];
  }
}

// Global instance for step performance monitoring
export const stepPerformanceMonitor = new PerformanceMonitor();
