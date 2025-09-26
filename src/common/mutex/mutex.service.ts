import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';
import { isNil } from '../utils';

@Injectable()
export class MutexService {
  private readonly mutexCache: Map<string, Mutex> = new Map();
  private readonly mapMutex: Mutex = new Mutex();

  /**
   * Executes an operation exclusively by key
   */
  async performExclusively<T>(
    key: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    let mutex: Mutex | undefined;

    // Ensure safe access to mutexCache
    const releaseMapLock = await this.mapMutex.acquire();
    try {
      mutex = this.mutexCache.get(key);
      if (isNil(mutex)) {
        mutex = new Mutex();
        this.mutexCache.set(key, mutex);
      }
    } finally {
      releaseMapLock();
    }

    // Acquire specific mutex for the key
    const release = await mutex.acquire();
    try {
      return await operation();
    } finally {
      release();

      // Clean up mutex if no longer needed
      const cleanupRelease = await this.mapMutex.acquire();
      try {
        if (this.mutexCache.get(key) === mutex) {
          this.mutexCache.delete(key);
        }
      } finally {
        cleanupRelease();
      }
    }
  }

  async getStats() {
    const releaseCacheLock = await this.mapMutex.acquire();
    try {
      return {
        activeMutexes: Array.from(this.mutexCache.keys()),
        mutexCount: this.mutexCache.size,
      };
    } finally {
      releaseCacheLock();
    }
  }
}
