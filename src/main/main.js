const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const nodeApi = require('node-api');
const robot = require("robotjs");
const env = process.env;

process.env.canvesWidth = 200;
process.env.canvesHeight = 250;

// 创建弹窗
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
};
// 控制鼠标
function robotMouse() {
	// Speed up the mouse.
	robot.setMouseDelay(2);

	var twoPI = Math.PI * 2.0;
	var screenSize = robot.getScreenSize();
	var height = (screenSize.height / 2) - 10;
	var width = screenSize.width;

	for (var x = 0; x < width; x++)
	{
		y = height * Math.sin((twoPI * x) / width) + height;
		robot.moveMouse(x, y);
	}
};
// 控制键盘
function robotKeyBoard() {
	console.log('robotKeyBoard')
	// Type "Hello World".
	robot.typeString("Hello World");

	// Press enter.
	robot.keyTap("enter");
};
// 获取屏幕
function robotScreen() {
	console.log('robotScreen')
	// Get mouse position.
	var mouse = robot.getMousePos();

	// Get pixel color in hex format.
	var hex = robot.getPixelColor(mouse.x, mouse.y);
	console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
};

app.on('ready', () => {
	createWindow();
	setTimeout(() => {
		robotScreen();
	}, 3000)
})