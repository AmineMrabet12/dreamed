/**
 * Runs before dev/start — installs frontend node_modules if missing or incomplete.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, '..', 'frontend');

// Check for react-scripts specifically, not just node_modules folder
const reactScripts = path.join(frontendDir, 'node_modules', '.bin', 'react-scripts');

if (!fs.existsSync(reactScripts)) {
  console.log('[setup] Dependances frontend manquantes — installation en cours...');
  execSync('npm install --legacy-peer-deps', {
    cwd: frontendDir,
    stdio: 'inherit',
  });
  console.log('[setup] Frontend pret.');
}
