const { app, BrowserWindow, screen, ipcMain, globalShortcut  } = require('electron');
const path = require('path');
const fs = require('fs');
const robot = require("robotjs");
const ioHook = require('iohook');
// const nodeAbi = require("node-abi");
const env = process.env;
const exeName = path.basename(process.execPath)

// console.log(nodeAbi.getTarget('64', 'node'));
// console.log(nodeAbi.getAbi('11.4.2', 'electron'));
// console.log(nodeAbi.getTarget('85', 'electron'));

app.main_params = {
	robot: robot,
	globalShortcut: globalShortcut,
	ioHook: ioHook
};

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
		icon: 'icon/logo.ico',
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

	win.webContents.on('did-finish-load', () => {
	    win.webContents.send('browserWindowCreated', '弹窗渲染完毕!')
	})
};

app.on('ready', () => {
	createWindow();
});

// 开机自启
app.setLoginItemSettings({
	// true在登录时启动应用，false 移除应用作为登录启动项默认为 false
	openAtLogin: true,
	// macOS - true 表示以隐藏的方式启动应用。 默认为false。
	openAsHidden: false,
	// Windows - 在登录时启动的可执行文件，具体的为打包后的APP所在的exe文件路径。默认为 process.execPath
	path: process.execPath,
	// Windows - 要传递给可执行文件的命令行参数。默认为空数组。注意用引号将路径换行。
	args: [ "--processStart", `"${exeName}"` ]
})