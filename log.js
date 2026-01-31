#!/usr/bin/env node
// CLI tool to send logs to James OS dashboard
// Usage: node log.js <level> <category> <message> [details]

const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node log.js <level> <category> <message> [details]');
  console.error('Levels: info, working, success, warn, error, llm-request, llm-response, tool-call, file-op');
  console.error('Categories: llm, tool, file, system, user-request, response');
  process.exit(1);
}

const [level, category, message, ...detailsArr] = args;
const details = detailsArr.join(' ') || undefined;

const logData = JSON.stringify({
  level,
  category,
  message,
  details,
  timestamp: new Date().toISOString(),
});

const options = {
  hostname: HOST,
  port: PORT,
  path: '/api/logs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(logData),
  },
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✓ Log sent:', message);
  } else {
    console.error('✗ Failed to send log:', res.statusCode);
  }
});

req.on('error', (e) => {
  // Silently fail - dashboard might not be running
  // console.error('Log server error:', e.message);
});

req.write(logData);
req.end();
