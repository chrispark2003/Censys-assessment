/**
 * Simple in-memory storage for session data
 * Data persists until server restart to provide context across conversations
 */

interface SessionData {
  data: any;
  originalFilename: string;
  uploadedAt: Date;
  filePath?: string;
  summaries?: any[];
}

class InMemoryStoreClass {
  private dataStore = new Map<string, SessionData>();
  // Removed timers and TTL - data persists until server restart

  /**
   * Store data (persists until server restart)
   */
  store(sessionId: string, data: SessionData): void {
    this.dataStore.set(sessionId, data);
  }

  /**
   * Retrieve data by session ID
   */
  get(sessionId: string): SessionData | null {
    return this.dataStore.get(sessionId) || null;
  }

  /**
   * Delete data by session ID
   */
  delete(sessionId: string): boolean {
    return this.dataStore.delete(sessionId);
  }

  /**
   * Get current store size (for monitoring)
   */
  size(): number {
    return this.dataStore.size;
  }

  /**
   * Clear all data (for testing/cleanup)
   */
  clear(): void {
    this.dataStore.clear();
  }

  /**
   * Get all active session IDs (for monitoring)
   */
  getActiveSessionIds(): string[] {
    return Array.from(this.dataStore.keys());
  }
}

// Export singleton instance
export const InMemoryStore = new InMemoryStoreClass();
export type { SessionData };