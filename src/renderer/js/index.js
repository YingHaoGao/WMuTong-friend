const { remote, ipcRenderer, desktopCapturer, app } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;
const cp = require("child_process");
const fs = require('fs');

import {
	consoleInner, transcribe, createInterval, getPerformance,
	Translator, disableClickPropagation, enableClickPropagation,
	createWindow, wsTool, sessionTool, fsTool, cpTool
} from '../util/index.js';
import { personate } from '../personate/index.js';


var win;
var interval;
var nTranscribe;
var elConsole;
var elOperateMiss;
var mousedown, mouseselect;
var nTranscribe;
var mouseLocat = {};
var tsObj = {};

function init() {
	elConsole = document.getElementById('console');
	elOperateMiss = document.getElementById('operateMiss');
	win = remote.getCurrentWindow();
	nTranscribe = new Translator();

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
						};
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
	  mouseLocat = { x: event.x, y: event.y };
	  addGradeFn('mousemoveObj');

	  if(mousedown) {
	  	mouseselect = true;
	  }
	});
	// 鼠标按下
	ioHook.on('mousedown', event => {
	  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mousedown' }
	  mousedown = true;
	});
	// 鼠标抬起
	ioHook.on('mouseup', event => {
	  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mouseup' }
	  if(mouseselect) {
	  	let textContent = window.getSelection();
	  }
	  mouseselect = false;
	  mousedown = false;
	});
	// 鼠标拖动
	ioHook.on('mousedrag', event => {
	  // { button: 0, clicks: 0, x: 373, y: 683, type: 'mousedrag' }
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

	// ctrl + alt + w  创建浏览器窗口
	_createShortcut('CommandOrControl+alt+w',
		(event.ctrlkey && event.altKey && keyCode === 87),
		() => {
			new createWindow();
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

	// ctrl + alt + t  翻译
	_createShortcut('CommandOrControl+alt+t',
		(event.ctrlkey && event.altKey && keyCode === 84),
		() => {
			nTranscribe.createDom(mouseLocat.x, mouseLocat.y);
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


/**
 * ts 资源下载
 * */
tsObj = {
	init() {
		let nWs = new wsTool();
		nWs.on('message', msg => {
			if(typeof msg == 'string') {
				msg = JSON.parse(msg);

				// 收到下载 m3u8 的通知
				if(msg.id == 'source-src' && msg.src) {
					tsObj.startDownload(msg);
				}
				else if(msg.id == 'source-str' && msg.str) {
					var nFsTool = new fsTool();
					nFsTool.write(`${__dirname}/${msg.title}.m3u8`, msg.str);
					msg.src = `${__dirname}/${msg.title}.m3u8`;
					tsObj.startDownload(msg);
				}
				else if(msg.id.indexOf('webview') > -1) {
					nWs.send(msg.id);
				}
			}
		});

		let sendHeaderCall = details => {
			nWs.send('get-source');
		}
		let completedCall = details => {
			console.log(details)
		}
		const nSessionTool = new sessionTool({
			urls: ['*://*/*'],
			// urls: ['http://91porn.com/', 'https://www.baidu.com/'],
			sendHeaderCall, completedCall
		});
	},
	startDownload(msg) {
		let sourceSrc = msg.src;
		let title = msg.title;
		let m3u8Str = sourceSrc.match(/.+\.m3u8/);

		if(m3u8Str) {
			m3u8Str = m3u8Str[0];
			let noti = new Notification("检测到m3u8资源",
				{ body: `发现名为${title}的m3u8资源。点击通知开始下载` });
			noti.onclick = () => {
				let nCpTool = new cpTool();
				nCpTool.stdoutData = res => {
					console.log(res);
					consoleInner({'stdout': res}, 10)
				}
				nCpTool.stderrData = err => {
					consoleInner({ 'stderr': err })
				}
				nCpTool.execClose = code => {
					console.log(code);
					consoleInner({ 'execClose': code })
				}
				nCpTool.cmd(`ffmpeg -protocol_whitelist "file,http,https,rtp,udp,tcp,tls" -i ${msg.src} -c copy -bsf:a aac_adtstoasc ${__dirname}/download/${msg.title}.mp4`);
			}
		}
	}
};

ipcRenderer.on('browserWindowCreated', (event, ans) => {
	interval = new createInterval();
	// interval.mount({ id: 'getPerformance', repetition: Infinity, fn: getPerformance });
	nTranscribe = new transcribe({interval});

    init();
    tsObj.init();
});

ipcRenderer.on('electron_quit', (event, ans) => {
	interval.clear()
});