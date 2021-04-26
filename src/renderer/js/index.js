const { remote, ipcRenderer, desktopCapturer } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;
const cp = require("child_process");
const fs = require('fs');

import { consoleInner, transcribe, createInterval } from './util.js';


var win;
var interval;
var nTranscribe;
var elConsole;
var elOperateMiss;

function init() {
	elConsole = document.getElementById('console');
	elOperateMiss = document.getElementById('operateMiss');
	win = remote.getCurrentWindow();

	var operationInterval;
	var operationTime = 1000;
	var prepareIng = false;
	var decreaseGrade = 2;
	var nextPrepare;
	var operationGradeVal = 0;
	var operationGradeTypeParams = {};

	var gradeArr = [
		{ key: 'idleAction', grade: 0, time: 2 },
		{ key: 'walkAction', grade: 50, time: 2 },
		{ key: 'runAction', grade: 2000, time: 2 }
	];
	var mousemoveObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mouseclickObj = { preTime: 0, interval: 0, addGrade: 2 };
	var mousewheelObj = { preTime: 0, interval: 300, addGrade: 1 };
	var keydownObj = { preTime: 0, interval: 0, addGrade: 1 };
	var mouseAndKeyObj = { mousemoveObj, mouseclickObj, mousewheelObj, keydownObj };

	var elHtml = document.getElementById('html');

	var operationGrade = Object.defineProperty({}, 'val', {
		get() { return operationGradeVal },
		set(v) {
			operationGradeVal = v;
			consoleInner({ v, ...operationGradeTypeParams }, 0);

			function timeout(t) {
				setTimeout(() => {
					if(nextPrepare) {
						nextPrepare();
					} else {
						prepareIng = false;
					}
				}, t * 1000)
			};

			for(let i = 0; i < gradeArr.length; i++) {
				let nextGrade = gradeArr[i+1];
				if(
					v > gradeArr[i].grade &&
					(nextGrade ? (v <= nextGrade.grade) : true)
					) {
					if(gradeArr[i].key != window.animation) {
						if(!prepareIng) {
							prepareIng = true;

							window.prepareCrossFade(window.actions[window.animation], window.actions[gradeArr[i].key], gradeArr[i].time);
							window.animation = gradeArr[i].key;
							timeout(gradeArr[i].time);
						} else {
							nextPrepare = function() {
								nextPrepare = undefined;
								prepareIng = true;
								window.prepareCrossFade(window.actions[window.animation], window.actions[gradeArr[i].key], gradeArr[i].time);
								window.animation = gradeArr[i].key;
								timeout(gradeArr[i].time);
							};
						}
					}
					break;
				}
			}
		}
	});

	// idleAction, walkAction, runAction
	window.animation = 'idleAction';

	decrease();
	// robotMouse();

	/* ioHook 监听 */
	// 键盘按下
	ioHook.on('keydown', event => {
	  // { keycode: 46, rawcode: 8, type: 'keydown', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }
	  operationGradeTypeParams = { type: event.type, keycode: event.keycode };
	  addGradeFn('keydownObj');

	  var mt = globalShortcut.isRegistered('CommandOrControl+m+t');
	  createShortcut(event);
	});
	// 键盘抬起 
	ioHook.on('keyup', event => {
	  // { keycode: 46, rawcode: 8, type: 'keyup', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }
	  operationGradeTypeParams = { type: event.type, keycode: event.keycode };
	  addGradeFn('mousewheelObj');
	});
	// 鼠标移动
	ioHook.on('mousemove', event => {
	  // { button: 0, clicks: 0, x: 521, y: 737, type: 'mousemove' }
	  operationGradeTypeParams = { type: event.type, x: event.x, y: event.y };
	  addGradeFn('mousemoveObj');
	});
	// 鼠标点击
	ioHook.on('mouseclick', event => {
	  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mouseclick' }
	  operationGradeTypeParams = { type: event.type, x: event.x, y: event.y };
	  addGradeFn('mouseclickObj');
	});
	// 鼠标滚轮
	ioHook.on('mousewheel', event => {
	  // { amount: 3, clicks: 1, direction: 3, rotation: 1, type: 'mousewheel', x: 466, y: 683 }
	  operationGradeTypeParams = { type: event.type, x: event.x, y: event.y, amount: event.amount, clicks: event.clicks };
	  addGradeFn('mousewheelObj');
	});
	/*
		// 鼠标按下
		ioHook.on('mousedown', event => {
		  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mousedown' }
		  addGradeFn('mousedownObj');
		});
		// 鼠标抬起
		ioHook.on('mouseup', event => {
		  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mouseup' }
		  addGradeFn('mouseupObj');
		});
		// 鼠标拖动
		ioHook.on('mousedrag', event => {
		  // { button: 0, clicks: 0, x: 373, y: 683, type: 'mousedrag' }
		  addGradeFn('mousedragObj');
		});
	*/

	ioHook.start();

	// 紧迫程度 - 递增
	function addGradeFn(key) {
		let time = new Date().getTime();

		if(time - mouseAndKeyObj[key].preTime > mouseAndKeyObj[key].interval) {
			mouseAndKeyObj[key].preTime = time;
			operationGrade.val += mouseAndKeyObj[key].addGrade;
		}
	};
	// 紧迫程度 - 衰退
	function decrease() {
		operationInterval && clearInterval(operationInterval);
		operationInterval = setInterval(() => {
			if(operationGradeVal > 0) {
				operationGrade.val -= decreaseGrade;
			}
		}, operationTime);
	};

	createShortcut();
	enableClickPropagation();
};

/**
 * 快捷键
 * */
// 注册快捷键
function createShortcut(event = {}) {
	// 是否启动控制模式
	var hasControl = false;

	// ctrl + alt + m  进入控制模式
	_createShortcut('CommandOrControl+alt+m',
		(event.ctrlkey && event.altKey && keyCode === 77),
		() => {
			hasControl = !hasControl;

			if(hasControl) {
				showConsoleInner();
				showOperateMiss();
				disableClickPropagation();
			} else {
				hideConsoleInner();
				hideOperateMiss();
				enableClickPropagation();
			}
		}
	);

	// ctrl + alt + a  截屏到粘贴板
	_createShortcut('CommandOrControl+alt+a',
		(event.ctrlkey && event.altKey && keyCode === 65),
		() => {
			print();
		}
	);

	// ctrl + alt + c  切换console显示、隐藏
	_createShortcut('CommandOrControl+alt+c',
		(event.ctrlkey && event.altKey && keyCode === 67),
		() => {
			if(elConsole.style.display == 'none') {
				showConsoleInner();
			} else {
				hideConsoleInner();	
			}
		}
	);

	// ctrl + alt + p  录制屏幕 开始/结束
	_createShortcut('CommandOrControl+alt+p',
		(event.ctrlkey && event.altKey && keyCode === 80),
		() => {
			if(nTranscribe.getIs()) {
				nTranscribe.stopRecord();
			} else {
				nTranscribe.createRecorder();
			}
		}
	);
};
function _createShortcut(key, eveIf, fn) {
	if(!globalShortcut.isRegistered(key)) {
		globalShortcut.register(key, fn);

	} else {
		try {
			eveIf && fn();
		} catch(err) {}
	}
};
// 截图
function print() {
	var screen_window = cp.execFile(__dirname + '/lib_exe/PrintScr.exe');
	screen_window.on('exit', function (code) {
      // 执行成功返回 1，返回 0 没有截图
      if (code) mainWindow.webContents.paste()
    })
};
// 获取浏览器内存占用情况
function getPerformance() {
	let memory = window.performance.memory;
	let obj = {
		"可用堆最大体积": memory.jsHeapSizeLimit + ' b<br/>',
		"已分配堆体积": memory.totalJSHeapSize + ' b<br/>',
		"当前JS堆活跃段体积": memory.usedJSHeapSize + ' b<br/>',
	}
	// jsHeapSizeLimit: 上下文内可用堆的最大体积，以字节计算。
	// totalJSHeapSize: 已分配的堆体积，以字节计算。
	// usedJSHeapSize: 当前 JS 堆活跃段（segment）的体积，以字节计算。
	consoleInner(obj, 1);
};
// 允许鼠标点击事件传播
function enableClickPropagation() {
	// ioHook.enableClickPropagation()
	win.setIgnoreMouseEvents(true, { forward: true });
};
// 禁止鼠标点击事件传播
function disableClickPropagation() {
	// ioHook.disableClickPropagation()
	win.setIgnoreMouseEvents(false);
};
// 显示consoleInner
function showConsoleInner() {
	elConsole.style.display = 'block';

	$(elConsole).off().hover(function(e) {
		disableClickPropagation();
	}, function(e) {
		enableClickPropagation();
	});
};
// 隐藏consoleInner
function hideConsoleInner() {
	elConsole.style.display = 'none';
};
// 显示操作区域
function showOperateMiss() {
	elOperateMiss.style.display = 'block';

	$(elOperateMiss).off().hover(function(e) {
		disableClickPropagation();
	}, function(e) {
		enableClickPropagation();
	});
};
// 隐藏 操作区域
function hideOperateMiss() {
	elOperateMiss.style.display = 'none';
};
// 控制鼠标
function robotMouse() {
	// Speed up the mouse.
	robot.setMouseDelay(2);

	var twoPI = Math.PI * 2.0;
	var screenSize = robot.getScreenSize();
	var height = (screenSize.height / 2) - 10;
	var width = screenSize.width;
	var y;

	robot.moveMouse(100, 100);
};
// 控制键盘
function robotKeyBoard() {
	robot.typeString("Hello World");

	robot.keyTap("enter");
};
// 获取屏幕
function robotScreen() {
	var mouse = robot.getMousePos();

	var hex = robot.getPixelColor(mouse.x, mouse.y);
};


ipcRenderer.on('browserWindowCreated', (event, ans) => {
	interval = new createInterval();
	interval.mount({ id: 'getPerformance', repetition: Infinity, fn: getPerformance });
	nTranscribe = new transcribe({interval});

    init();
});

ipcRenderer.on('electron_quit', (event, ans) => {
	interval.clear()
})