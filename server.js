const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'logs.json');

// Read logs
function readLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// Write logs
function writeLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Generate session ID
function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// API Routes (before static files)

// Get logs with optional filtering
app.get('/api/logs', (req, res) => {
  const logs = readLogs();
  const { verbose, sessionId, parentId } = req.query;
  
  let filtered = logs;
  
  // If not verbose, return only top-level logs (no parentId)
  if (verbose !== 'true' && !parentId && !sessionId) {
    filtered = logs.filter(log => !log.parentId);
  }
  
  // Filter by sessionId
  if (sessionId) {
    filtered = logs.filter(log => log.sessionId === sessionId);
  }
  
  // Filter by parentId (for nested logs)
  if (parentId) {
    filtered = logs.filter(log => log.parentId === parentId);
  }
  
  res.json(filtered);
});

// Get a single log by ID with its nested children
app.get('/api/logs/:id', (req, res) => {
  const logs = readLogs();
  const logId = req.params.id;
  
  const log = logs.find(l => l.id === logId);
  if (!log) {
    return res.status(404).json({ error: 'Log not found' });
  }
  
  // Get all nested logs (children of this log)
  const children = logs.filter(l => l.parentId === logId);
  
  res.json({
    ...log,
    children: children
  });
});

// Get all unique sessions
app.get('/api/sessions', (req, res) => {
  const logs = readLogs();
  const sessionMap = new Map();
  
  logs.forEach(log => {
    if (log.sessionId) {
      if (!sessionMap.has(log.sessionId)) {
        sessionMap.set(log.sessionId, {
          sessionId: log.sessionId,
          createdAt: log.timestamp,
          logCount: 0,
          summary: log.message || log.content || 'No summary',
          topLevelId: !log.parentId ? log.id : null
        });
      }
      sessionMap.get(log.sessionId).logCount++;
    }
  });
  
  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(sessions);
});

// Create a new log entry
app.post('/api/logs', (req, res) => {
  const logs = readLogs();
  
  // Validate required fields
  if (!req.body.message && !req.body.content) {
    return res.status(400).json({ error: 'message or content is required' });
  }
  
  const newLog = {
    id: generateId(),
    sessionId: req.body.sessionId || generateSessionId(),
    parentId: req.body.parentId || null,
    timestamp: new Date().toISOString(),
    level: req.body.level || 'info',
    message: req.body.message || req.body.content,
    ...req.body,
  };
  
  // Ensure id, sessionId, parentId, timestamp are not overwritten
  newLog.id = newLog.id || generateId();
  newLog.timestamp = new Date().toISOString();
  
  logs.unshift(newLog);
  if (logs.length > 1000) logs.pop();
  
  writeLogs(logs);
  res.json({ success: true, log: newLog });
});

// Create a nested log (child of another log)
app.post('/api/logs/:parentId/children', (req, res) => {
  const logs = readLogs();
  const parentId = req.params.parentId;
  
  const parentLog = logs.find(l => l.id === parentId);
  if (!parentLog) {
    return res.status(404).json({ error: 'Parent log not found' });
  }
  
  const newLog = {
    id: generateId(),
    sessionId: parentLog.sessionId, // Inherit session from parent
    parentId: parentId,
    timestamp: new Date().toISOString(),
    level: req.body.level || 'info',
    message: req.body.message || req.body.content,
    ...req.body,
    id: undefined, // Will be set above
    sessionId: parentLog.sessionId, // Force inherit from parent
    parentId: parentId, // Force parent
    timestamp: new Date().toISOString(),
  };
  
  newLog.id = generateId();
  
  logs.unshift(newLog);
  if (logs.length > 1000) logs.pop();
  
  writeLogs(logs);
  res.json({ success: true, log: newLog });
});

// Delete all logs
app.delete('/api/logs', (req, res) => {
  writeLogs([]);
  res.json({ success: true });
});

// Delete a specific log
app.delete('/api/logs/:id', (req, res) => {
  const logs = readLogs();
  const logId = req.params.id;
  
  // Also delete all children
  const idsToDelete = new Set([logId]);
  const findChildren = (parentId) => {
    logs.forEach(log => {
      if (log.parentId === parentId) {
        idsToDelete.add(log.id);
        findChildren(log.id);
      }
    });
  };
  findChildren(logId);
  
  const filtered = logs.filter(l => !idsToDelete.has(l.id));
  writeLogs(filtered);
  res.json({ success: true, deleted: idsToDelete.size });
});

// Health check
app.get('/api/health', (req, res) => {
  const logs = readLogs();
  const sessions = new Set(logs.filter(l => l.sessionId).map(l => l.sessionId));
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stats: {
      totalLogs: logs.length,
      totalSessions: sessions.size
    }
  });
});

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all for SPA (must be last)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`James OS Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/logs`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
