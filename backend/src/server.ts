import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 SyncERP Backend running on http://localhost:${PORT}`);
  console.log(`💚 Health endpoint at http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
