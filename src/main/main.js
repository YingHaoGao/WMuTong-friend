const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const env = process.env;

function createWindow() {
	let workAreaSize = screen.getPrimaryDisplay().workAreaSize,
		width = 200,
		height = 250,
		// x = 0,
		// y = 0,
		// width = workAreaSize.width,
		// height = workAreaSize.height,
		x = workAreaSize.width - width,
		y = workAreaSize.height - height,
		alwaysOnTop = true;

	if(env.NODE_ENV == 'devTools') {
		width = 1600;
		height = 800;
		x = workAreaSize.width - width;
		y = workAreaSize.height - height;
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