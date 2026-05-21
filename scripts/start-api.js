const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const root = path.join(__dirname, '..');

// Use uvicorn directly — avoids fastapi-cli's rich/emoji output that crashes
// on Windows terminals using legacy CP1252 encoding.
const uvicorn = path.join(root, 'backend', '.venv', isWin ? 'Scripts' : 'bin', 'uvicorn');

const child = spawn(
  uvicorn,
  ['app.main:app', '--reload', '--port', '8000'],
  {
    cwd: path.join(root, 'backend'),
    stdio: 'inherit',
    shell: false,
    env: Object.assign({}, process.env, {
      PYTHONUTF8: '1',
      PYTHONIOENCODING: 'utf-8',
    }),
  }
);

child.on('exit', function(code) { process.exit(code || 0); });
