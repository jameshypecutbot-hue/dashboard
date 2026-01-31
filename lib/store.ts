// In-memory store for serverless environment
// Note: Data resets on cold starts (function re-deployment/instance restart)
// For production, use Vercel KV, Upstash Redis, or a proper database

export interface LogEntry {
  id: string;
  sessionId: string;
  parentId?: string | null;
  timestamp: string;
  level: string;
  message: string;
  category?: string;
  details?: string;
  metadata?: Record<string, string>;
  duration?: number;
  [key: string]: any;
}

// Global in-memory store (persists during function lifetime)
declare global {
  var __LOGS_STORE__: LogEntry[] | undefined;
  var __SESSIONS_STORE__: Map<string, any> | undefined;
}

// Initialize stores
if (!globalThis.__LOGS_STORE__) {
  globalThis.__LOGS_STORE__ = [];
}
if (!globalThis.__SESSIONS_STORE__) {
  globalThis.__SESSIONS_STORE__ = new Map();
}

const logs = globalThis.__LOGS_STORE__;
const sessions = globalThis.__SESSIONS_STORE__;

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function generateSessionId(): string {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function getAllLogs(): LogEntry[] {
  return [...logs];
}

export function getLogById(id: string): LogEntry | undefined {
  return logs.find(l => l.id === id);
}

export function getLogsBySessionId(sessionId: string): LogEntry[] {
  return logs.filter(l => l.sessionId === sessionId);
}

export function getLogsByParentId(parentId: string): LogEntry[] {
  return logs.filter(l => l.parentId === parentId);
}

export function getTopLevelLogs(): LogEntry[] {
  return logs.filter(l => !l.parentId);
}

export function createLog(data: Partial<LogEntry>): LogEntry {
  const newLog: LogEntry = {
    ...data,
    id: generateId(),
    sessionId: data.sessionId || generateSessionId(),
    parentId: data.parentId || null,
    timestamp: new Date().toISOString(),
    level: data.level || 'info',
    message: data.message || data.content || 'No message',
    category: data.category || 'system',
  };

  logs.unshift(newLog);
  
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.length = 1000;
  }

  return newLog;
}

export function createChildLog(parentId: string, data: Partial<LogEntry>): LogEntry | null {
  const parentLog = getLogById(parentId);
  if (!parentLog) return null;

  const newLog: LogEntry = {
    ...data,
    id: generateId(),
    sessionId: parentLog.sessionId, // Inherit from parent
    parentId: parentId,
    timestamp: new Date().toISOString(),
    level: data.level || 'info',
    message: data.message || data.content || 'No message',
    category: data.category || 'system',
  };

  logs.unshift(newLog);
  
  if (logs.length > 1000) {
    logs.length = 1000;
  }

  return newLog;
}

export function deleteLog(id: string): number {
  const idsToDelete = new Set<string>([id]);
  
  // Find all children recursively
  const findChildren = (parentId: string) => {
    logs.forEach(log => {
      if (log.parentId === parentId) {
        idsToDelete.add(log.id);
        findChildren(log.id);
      }
    });
  };
  
  findChildren(id);
  
  // Remove from array
  const initialLength = logs.length;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (idsToDelete.has(logs[i].id)) {
      logs.splice(i, 1);
    }
  }
  
  return idsToDelete.size;
}

export function deleteAllLogs(): void {
  logs.length = 0;
}

export function getAllSessions(): any[] {
  const sessionMap = new Map<string, any>();
  
  logs.forEach(log => {
    if (log.sessionId) {
      if (!sessionMap.has(log.sessionId)) {
        sessionMap.set(log.sessionId, {
          sessionId: log.sessionId,
          createdAt: log.timestamp,
          logCount: 0,
          summary: log.message || 'No summary',
          topLevelId: !log.parentId ? log.id : null
        });
      }
      sessionMap.get(log.sessionId).logCount++;
    }
  });
  
  return Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getStats(): { totalLogs: number; totalSessions: number } {
  const sessionIds = new Set(logs.filter(l => l.sessionId).map(l => l.sessionId));
  return {
    totalLogs: logs.length,
    totalSessions: sessionIds.size
  };
}
