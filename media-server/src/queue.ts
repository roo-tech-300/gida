export type JobProcessor = (id: string, signal: AbortSignal) => Promise<void>;

/**
 * Runs one transcode at a time: Contabo vCPUs are shared, and parallel FFmpeg
 * jobs would only make every job slower. Durable state lives in
 * listing_videos.status, so this queue can be rebuilt after a restart.
 */
export class TranscodeQueue {
  private readonly processor: JobProcessor;
  private readonly pending: string[] = [];
  private current: { id: string; controller: AbortController } | null = null;
  private draining = false;

  constructor(processor: JobProcessor) {
    this.processor = processor;
  }

  get size(): number {
    return this.pending.length + (this.current ? 1 : 0);
  }

  enqueue(id: string): void {
    if (this.current?.id === id || this.pending.includes(id)) return;
    this.pending.push(id);
    void this.drain();
  }

  /** Drops a pending job or aborts the running one. */
  cancel(id: string): void {
    const index = this.pending.indexOf(id);
    if (index !== -1) this.pending.splice(index, 1);
    if (this.current?.id === id) this.current.controller.abort();
  }

  cancelAll(): void {
    this.pending.length = 0;
    this.current?.controller.abort();
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      let id = this.pending.shift();
      while (id) {
        const controller = new AbortController();
        this.current = { id, controller };
        try {
          await this.processor(id, controller.signal);
        } catch (error) {
          console.error(`[queue] Job ${id} crashed:`, error);
        } finally {
          this.current = null;
        }
        id = this.pending.shift();
      }
    } finally {
      this.draining = false;
    }
  }
}
