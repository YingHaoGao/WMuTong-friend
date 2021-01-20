const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const env = process.env;

process.env.canvesWidth = 200;
process.env.canvesHeight = 250;

function createWindow() {
	let workAreaSize = screen.getPrimaryDisplay().workAreaSize,
		width = workAreaSize.width - 1,
		height = workAreaSize.height - 1,
		x = workAreaSize.width - width,
		y = workAreaSize.height - height,
		alwaysOnTop = true;

	if(env.NODE_ENV == 'devTools') {
		alwaysOnTop = false;
	}

	let win = new BrowserWindow({
		width: width,
		height: height,
		x: x,
		y: y,
		center: false,
		frame: false,
		transparent: true,
		resizable: false,
		minimizable: false,
		maximizable: false,
		closable: false,
		alwaysOnTop: alwaysOnTop,
		fullscreenable: false,
		autoHideMenuBar: true,
		icon: 'icon/logo.png',
		// backgroundColor: '#2e2c29',
	    webPreferences: {
	      nodeIntegration: true,
	      enableRemoteModule: true,
	      nodeIntegrationInWorker: true,
	      nodeIntegrationInSubFrames: true
	    }
	});

	if(env.NODE_ENV == 'devTools') {
		win.webContents.openDevTools();
	}
	win.loadFile('src/renderer/index.html');
}

app.whenReady().then(createWindow);