const { app, BrowserWindow, screen, ipcMain, globalShortcut, dialog, Notification  } = require('electron');
const path = require('path');
const cp = require("child_process");
const fs = require('fs');
const robot = require("robotjs");
const ioHook = require('iohook');
const env = process.env;
const exeName = path.basename(process.execPath)

let win;

// const nodeAbi = require("node-abi");
// console.log(nodeAbi.getTarget('64', 'node'));
// console.log(nodeAbi.getAbi('11.4.2', 'electron'));
// console.log(nodeAbi.getTarget('85', 'electron'));

app.main_params = {
	robot: robot,
	globalShortcut: globalShortcut,
	ioHook: ioHook,
	dialog: dialog,
	Notification: Notification,
	BrowserWindow: BrowserWindow
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

	win = new BrowserWindow({
		width: width,
		height: height,
		x: x,
		y: y,
		center: false,
		frame: false,
		kiosk: true,
		transparent: true,
		resizable: false,
		skipTaskbar: false,
		minimizable: false,
		maximizable: false,
		closable: false,
		alwaysOnTop: alwaysOnTop,
		fullscreenable: false,
		autoHideMenuBar: true,
		icon: 'icon/logo.ico',
		// backgroundColor: '#2e2c29',
	    webPreferences: {
	      webviewTag: true,
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

	win.webContents.on('did-finish-load', (e) => {
	    win.webContents.send('browserWindowCreated', '弹窗渲染完毕!');
	})
};

/* 生命周期 */
// Electron完成初始化
app.on('ready', () => {
	createWindow();
});
// 所有窗口被关闭
app.on('window-all-closed', () => {
	win.webContents.send('electron_window-all-closed', '所有窗口被关闭');
	globalShortcut.unregisterAll();
});
// 应用程序开始,关闭窗口之前
app.on('before-quit', () => {
	win.webContents.send('electron_before-quit', '应用程序开始,关闭窗口之前');
});
// 所有窗口都已经关闭,应用程序将退出
app.on('will-quit', () => {
	win.webContents.send('electron_will-quit', '所有窗口都已经关闭,应用程序将退出');
	globalShortcut.unregisterAll();
});
// 所有应用程序退出
app.on('quit', () => {
	win.webContents.send('electron_quit', '所有应用程序退出');
	globalShortcut.unregisterAll();
});

if(env.NODE_ENV == 'devTools') {
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
}
