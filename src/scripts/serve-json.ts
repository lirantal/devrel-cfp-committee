import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
const DB_PATH = join(__dirname, '../../__fixtures__/db.json');
const SPEAKERS_PATH = join(__dirname, '../../__fixtures__/speakers.json');

// Read the JSON files
let dbData: any;
let speakersData: any;

try {
  const rawData = readFileSync(DB_PATH, 'utf8');
  dbData = JSON.parse(rawData);
} catch (error) {
  console.error('Error reading database file:', error);
  process.exit(1);
}

try {
  const rawSpeakersData = readFileSync(SPEAKERS_PATH, 'utf8');
  speakersData = JSON.parse(rawSpeakersData);
} catch (error) {
  console.error('Error reading speakers file:', error);
  process.exit(1);
}

const server = createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Handle different routes
  if (req.method === 'GET') {
    if (req.url === '/' || req.url === '/db') {
      // Serve the entire database
      res.writeHead(200);
      res.end(JSON.stringify(dbData, null, 2));
    } else if (req.url === '/sessions') {
      // Serve just the sessions array
      const sessions = dbData[0]?.sessions || [];
      res.writeHead(200);
      res.end(JSON.stringify(sessions, null, 2));
    } else if (req.url === '/speakers') {
      // Serve the speakers data
      res.writeHead(200);
      res.end(JSON.stringify(speakersData, null, 2));
    } else {
      // 404 for unknown routes
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } else {
    // Method not allowed
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

server.listen(PORT, () => {
  console.log(`JSON server running at http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET / - Full database`);
  console.log(`  GET /db - Full database`);
  console.log(`  GET /sessions - Sessions only`);
  console.log(`  GET /speakers - Speakers data`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
