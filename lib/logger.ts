// Server-side logger - writes to JSON file for dashboard to read
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'public', 'api-logs.json');

export type LogLevel = 'info' | 'working' | 'success' | 'warn' | 'error' | 'llm-request' | 'llm-response' | 'tool-call' | 'file-op';

export interface APILogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: 'llm' | 'tool' | 'file' | 'system' | 'user-request' | 'response';
  message: string;
  details?: string;
  metadata?: Record<string, any>;
  duration?: number;
}

function readLogs(): APILogEntry[] {
  if (!existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function addAPILog(
  level: LogLevel,
  category: APILogEntry['category'],
  message: string,
  details?: string,
  metadata?: Record<string, any>,
  duration?: number
) {
  const logs = readLogs();
  const newLog: APILogEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details,
    metadata,
    duration,
  };
  
  // Keep only last 500 logs
  logs.unshift(newLog);
  if (logs.length > 500) logs.pop();
  
  writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  
  // Also console log
  console.log(`[${level.toUpperCase()}] [${category}] ${message}`, details || '', metadata || '');
}

// Pre-populate with some logs
export function initLogs() {
  if (!existsSync(LOG_FILE)) {
    addAPILog('info', 'system', 'James OS API Logger initialized', 'Logging system ready');
  }
}
