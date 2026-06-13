const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');

function startServer() {
  console.log('Starting server...');
  const child = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '.next', 'standalone'),
    env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    console.log('[server]', data.toString());
  });

  child.stderr.on('data', (data) => {
    console.log('[server-err]', data.toString());
  });

  child.on('exit', (code) => {
    console.log('Server exited with code', code, '- restarting in 3s...');
    setTimeout(startServer, 3000);
  });

  child.on('error', (err) => {
    console.log('Server error:', err, '- restarting in 3s...');
    setTimeout(startServer, 3000);
  });
}

startServer();
