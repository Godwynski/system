const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

// Setup persistent logging
const LOG_DIR = path.join(os.homedir(), '.lumina-lms');
const LOG_FILE = path.join(LOG_DIR, 'electron-debug.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message, error = null) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${message}${error ? `\n${error.stack || error}` : ''}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logMsg);
  } catch (e) {
    // Fallback if writing fails
  }
  console.log(message, error || '');
}

// Intercept global uncaught errors
process.on('uncaughtException', (err) => {
  log('FATAL: Uncaught Exception in Electron Main Process:', err);
  app.quit();
});

process.on('unhandledRejection', (reason) => {
  log('FATAL: Unhandled Rejection in Electron Main Process:', reason);
});

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

let nextProcess = null;
let mainWindow = null;

function startNextServer(port) {
  log(`Starting Next.js production server on port ${port}...`);
  try {
    const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');
    const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
    
    let spawnCmd = 'node';
    let spawnArgs = [];
    
    if (fs.existsSync(standaloneServer)) {
      log('Standalone server found. Starting standalone server...');
      
      const toPublic = path.join(__dirname, '.next', 'standalone', 'public');
      const fromPublic = path.join(__dirname, 'public');
      if (fs.existsSync(fromPublic)) {
        log('Syncing public assets to standalone...');
        try {
          if (fs.existsSync(toPublic)) fs.rmSync(toPublic, { recursive: true, force: true });
          copyFolderSync(fromPublic, toPublic);
        } catch (copyErr) {
          log('Error copying public files:', copyErr);
        }
      }
      
      const toStatic = path.join(__dirname, '.next', 'standalone', '.next', 'static');
      const fromStatic = path.join(__dirname, '.next', 'static');
      if (fs.existsSync(fromStatic)) {
        log('Syncing static assets to standalone...');
        try {
          if (fs.existsSync(toStatic)) fs.rmSync(toStatic, { recursive: true, force: true });
          copyFolderSync(fromStatic, toStatic);
        } catch (copyErr) {
          log('Error copying static files:', copyErr);
        }
      }
      
      spawnCmd = 'node';
      spawnArgs = [standaloneServer];
    } else {
      log('Standalone server not found. Starting default Next.js server...');
      if (!fs.existsSync(nextBin)) {
        throw new Error(`Next.js binary not found at path: ${nextBin}`);
      }
      spawnCmd = 'node';
      spawnArgs = [nextBin, 'start', '-p', port];
    }

    nextProcess = spawn(spawnCmd, spawnArgs, {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        PORT: port.toString(), 
        NODE_ENV: 'production',
        ELECTRON_MODE: 'true',
        NEXT_PUBLIC_ELECTRON_MODE: 'true'
      }
    });

    nextProcess.stdout.on('data', (data) => {
      log(`Next.js stdout: ${data.toString().trim()}`);
    });

    nextProcess.stderr.on('data', (data) => {
      log(`Next.js stderr error: ${data.toString().trim()}`);
    });

    nextProcess.on('error', (err) => {
      log('Failed to start Next.js process:', err);
    });

    nextProcess.on('exit', (code, signal) => {
      log(`Next.js server process exited with code ${code} and signal ${signal}`);
    });

  } catch (err) {
    log('Synchronous failure spawning Next.js server:', err);
  }
}

function checkServerReady(port, callback) {
  const req = http.request({ host: 'localhost', port, path: '/', method: 'GET', timeout: 1000 }, (res) => {
    callback(true);
  });

  req.on('error', () => {
    callback(false);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(false);
  });

  req.end();
}

function pollServer(port, callback) {
  let attempts = 0;
  log('Polling local server to verify readiness...');
  const interval = setInterval(() => {
    attempts++;
    checkServerReady(port, (ready) => {
      if (ready) {
        log(`Local server is ready on port ${port} after ${attempts} seconds.`);
        clearInterval(interval);
        callback(true);
      } else if (attempts > 40) { // 40 seconds max wait
        log(`Local server failed to respond on port ${port} after 40 seconds.`);
        clearInterval(interval);
        callback(false);
      }
    });
  }, 1000);
}

function createWindow() {
  log('Creating main BrowserWindow...');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "Lumina LMS (Desktop)",
    autoHideMenuBar: true
  });

  const port = process.env.PORT || 3000;
  
  if (process.env.NODE_ENV === 'development') {
    log(`Running in development mode. Loading http://localhost:${port}...`);
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    log('Running in production mode.');
    startNextServer(port);
    pollServer(port, (success) => {
      if (success) {
        log(`Loading local production URL: http://localhost:${port}`);
        mainWindow.loadURL(`http://localhost:${port}`);
      } else {
        log('Failed to launch Next.js server. Loading fallback offline HTML panel.');
        mainWindow.loadURL(`data:text/html,<html><body style="font-family:sans-serif;padding:40px;background:#0d0e12;color:#fff;"><h1>Failed to start server.</h1><p>Make sure you have run <code>npm run build</code> before launching the application.</p></body></html>`);
      }
    });
  }

  mainWindow.on('closed', () => {
    log('BrowserWindow closed.');
    mainWindow = null;
  });
}

app.on('ready', () => {
  log('Electron App ready.');
  createWindow();
});

app.on('window-all-closed', () => {
  log('All windows closed. Cleaning up child processes...');
  if (nextProcess) {
    try {
      log('Terminating Next.js child process...');
      nextProcess.kill('SIGTERM');
    } catch (e) {
      log("Error killing next process:", e);
    }
  }
  if (process.platform !== 'darwin') {
    log('Quitting Electron app.');
    app.quit();
  }
});

app.on('activate', () => {
  log('Electron App activated.');
  if (mainWindow === null) {
    createWindow();
  }
});

process.on('exit', () => {
  log('Electron process exiting. Cleanup child process if any...');
  if (nextProcess) {
    try {
      nextProcess.kill('SIGTERM');
    } catch (e) {
      // Ignored
    }
  }
});
