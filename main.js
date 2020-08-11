const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
	let width = 400,
		height = 500,
		workAreaSize = screen.getPrimaryDisplay().workAreaSize,
		x = workAreaSize.width - width,
		y = workAreaSize.height - height;

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
		// alwaysOnTop: true,
		fullscreenable: false,
		autoHideMenuBar: true,
		// icon: '',
		backgroundColor: '#2e2c29',
	    webPreferences: {
	      nodeIntegration: true,
	      nodeIntegrationInWorker: true,
	      nodeIntegrationInSubFrames: true
	    }
	});

	win.loadFile('index.html');
}

app.whenReady().then(createWindow);