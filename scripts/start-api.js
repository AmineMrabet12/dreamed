const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const root = path.join(__dirname, '..');
const fastapi = path.join(root, 'backend', '.venv', isWin ? 'Scripts' : 'bin', 'fastapi');

const child = spawn(fastapi, ['dev', 'app/main.py', '--port', '8000'], {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
  shell: false,
});

child.on('exit', function(code) { process.exit(code || 0); });
