#!/usr/bin/env node

import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔧 Starting Vercel-compatible build process...');

try {
  // Force reinstall Rollup with proper platform binaries
  console.log('🔄 Reinstalling Rollup with correct binaries...');
  try {
    execSync('npm uninstall rollup @rollup/rollup-linux-x64-gnu', { stdio: 'pipe' });
  } catch (e) {
    // Ignore if already uninstalled
  }
  
  execSync('npm install rollup@latest --force', { stdio: 'inherit' });
  
  console.log('✅ Rollup reinstalled, starting Vite build...');

  // Run the actual Vite build with environment variables
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });

  console.log('✅ Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Fallback: try with rollup skip native
  console.log('🔄 Attempting fallback build with ROLLUP_SKIP_NATIVE...');
  try {
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        ROLLUP_SKIP_NATIVE: 'true',
        NODE_ENV: 'production'
      }
    });
    console.log('✅ Fallback build completed successfully!');
  } catch (fallbackError) {
    console.error('❌ Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}
