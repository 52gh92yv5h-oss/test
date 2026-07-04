#!/usr/bin/env node

/**
 * Build Artifacts Script
 * Collects all built app artifacts and icons into a single distribution folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const artifactsDir = path.join(distDir, 'artifacts');

// Create artifacts directory
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const apps = ['editor', 'configurator', 'editor-wasm', 'editor-windows'];
const timestamp = new Date().toISOString();
const buildLog = {
  timestamp,
  version: '1.0.0',
  apps: {},
  icons: {}
};

console.log('📦 Building artifacts...\n');

// Process each app
apps.forEach(app => {
  const appDir = path.join(rootDir, 'apps', app);
  const publicDir = path.join(appDir, 'public');
  const buildDir = path.join(appDir, 'dist');
  
  // Check for icon
  const iconSvg = path.join(publicDir, 'icon.svg');
  if (fs.existsSync(iconSvg)) {
    const destIcon = path.join(artifactsDir, `fred-${app}.svg`);
    fs.copyFileSync(iconSvg, destIcon);
    buildLog.icons[app] = `fred-${app}.svg`;
    console.log(`✅ Icon: ${app} -> fred-${app}.svg`);
  }
  
  // Check for built dist
  if (fs.existsSync(buildDir)) {
    const destApp = path.join(artifactsDir, `fred-${app}-build`);
    copyDir(buildDir, destApp);
    buildLog.apps[app] = {
      status: 'built',
      path: `fred-${app}-build`
    };
    console.log(`✅ Built: ${app}`);
  } else {
    buildLog.apps[app] = {
      status: 'pending',
      path: null
    };
    console.log(`⚠️  Not built: ${app}`);
  }
});

// Create manifest
const manifest = {
  name: 'FRED Applications',
  version: '1.0.0',
  description: 'Fred (Fras-EDitor) - fristaende, offline ordbehandlingssystem',
  buildDate: timestamp,
  buildLog
};

fs.writeFileSync(
  path.join(artifactsDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

// Create README
const readmeContent = `# FRED Application Artifacts

Build Date: ${timestamp}

## Available Artifacts

### Icons
${Object.entries(buildLog.icons).map(([app, file]) => `- **${app}**: \`${file}\``).join('\n')}

### Built Applications
${Object.entries(buildLog.apps)
  .filter(([_, info]) => info.status === 'built')
  .map(([app, info]) => `- **${app}**: \`${info.path}/\``)
  .join('\n')}

### Pending Applications
${Object.entries(buildLog.apps)
  .filter(([_, info]) => info.status === 'pending')
  .map(([app]) => `- **${app}**: Not yet built`)
  .join('\n')}

## Usage

All icons are SVG format (scalable vector graphics) and can be used in:
- Web applications
- Desktop applications
- App stores
- UI frameworks

## Build Information

- **Timestamp**: ${timestamp}
- **Version**: 1.0.0
`;

fs.writeFileSync(path.join(artifactsDir, 'README.md'), readmeContent);

console.log('\n✨ Artifacts built successfully!');
console.log(`📁 Location: ${artifactsDir}`);
console.log(`📄 Manifest: manifest.json`);

/**
 * Recursively copy directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}
