const { remote, ipcRenderer } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;

function init() {
	var operationInterval;
	var operationTime = 1000;
	var prepareIng = false;
	var decreaseGrade = 2;
	var nextPrepare;
	var gradeArr = [
		{ key: 'idleAction', grade: 0, time: 2 },
		{ key: 'walkAction', grade: 50, time: 2 },
		{ key: 'runAction', grade: 2000, time: 2 }
	];
	var mousemoveObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mouseclickObj = { preTime: 0, interval: 0, addGrade: 2 };
	var mousewheelObj = { preTime: 0, interval: 300, addGrade: 1 };
	var keydownObj = { preTime: 0, interval: 0, addGrade: 1 };
	var mouseAndKeyObj = {
		mousemoveObj, mouseclickObj, mousewheelObj, keydownObj
	};
	var operationGradeVal = 0;
	var operationGradeTypeParams = {};
	var elConsole = document.getElementById('console');
	var elHtml = document.getElementById('html');
	var operationGrade = Object.defineProperty({}, 'val', {
		get() { return operationGradeVal },
		set(v) {
			operationGradeVal = v;
			elConsole.innerHTML = v;

			consoleInner({ v, ...operationGradeTypeParams });

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

	/* ioHook 监听 */
	// 键盘按下
	ioHook.on('keydown', event => {
	  // { keycode: 46, rawcode: 8, type: 'keydown', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }
	  operationGradeTypeParams = { type: `type: ${event.type}`, keycode: `keycode: ${event.keycode}` };
	  addGradeFn('keydownObj');
	});
	// 键盘抬起
	ioHook.on('keyup', event => {
	  // { keycode: 46, rawcode: 8, type: 'keyup', altKey: true, shiftKey: true, ctrlKey: false, metaKey: false }
	  operationGradeTypeParams = { type: `type: ${event.type}`, keycode: `keycode: ${event.keycode}` };
	  addGradeFn('mousewheelObj');
	});
	// 鼠标移动
	ioHook.on('mousemove', event => {
	  // { button: 0, clicks: 0, x: 521, y: 737, type: 'mousemove' }
	  operationGradeTypeParams = { type: `type: ${event.type}`, x: `x: ${event.x}`, y: `y: ${event.y}` };
	  addGradeFn('mousemoveObj');
	});
	// 鼠标点击
	ioHook.on('mouseclick', event => {
	  // { button: 1, clicks: 1, x: 545, y: 696, type: 'mouseclick' }
	  operationGradeTypeParams = { type: `type: ${event.type}`, x: `x: ${event.x}`, y: `y: ${event.y}` };
	  addGradeFn('mouseclickObj');
	});
	// 鼠标滚轮
	ioHook.on('mousewheel', event => {
	  // { amount: 3, clicks: 1, direction: 3, rotation: 1, type: 'mousewheel', x: 466, y: 683 }
	  operationGradeTypeParams = { type: `type: ${event.type}`, x: `x: ${event.x}`, y: `y: ${event.y}`, 
	  								amount: `amount: ${event.amount}`, clicks: `clicks: ${event.clicks}` };
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

	// console
	function consoleInner(obj) {
		let s = '';
		Object.keys(obj).map( k => {
			s += obj[k] + '  ';
		});
		elConsole.innerHTML = s;
	};
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

	/* 快捷键 */
	// ctrk + i  紧迫程度复位
	globalShortcut.register('CommandOrControl+i', () => {
		operationGrade.val = 0;
	})
};

ipcRenderer.on('browserWindowCreated', (event, ans) => {
    init();
})