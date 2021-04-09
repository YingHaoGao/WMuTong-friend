const { remote, ipcRenderer } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;

function init() {
	var operationInterval;
	var operationTime = 1000;
	var prepareIng = false;
	var nextPrepare;
	var gradeArr = [
		{ key: 'idleAction', grade: 0, time: 2 },
		{ key: 'walkAction', grade: 50, time: 2 },
		{ key: 'runAction', grade: 1000, time: 2 }
	];
	var mousemoveObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mousedownObj = { preTime: 0, interval: 0, addGrade: 3 };
	var mousewheelObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mouseObj = { mousemoveObj: mousemoveObj, mousedownObj: mousedownObj, mousewheelObj: mousewheelObj };
	var operationGradeVal = 0;
	var elConsole = document.getElementById('console');
	var elHtml = document.getElementById('html');
	var operationGrade = Object.defineProperty({}, 'val', {
		get() { return operationGradeVal },
		set(v) {
			operationGradeVal = v;
			elConsole.innerHTML = v;

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
					consoleInner({ v, animation: window.animation, key: gradeArr[i].key, prepareIng });
					if(gradeArr[i].key != window.animation) {
						consoleInner({ v, animation: window.animation, key: gradeArr[i].key, prepareIng });

						console.log(v, window.animation, gradeArr[i].key, prepareIng)
						if(!prepareIng) {
							prepareIng = true;

							window.prepareCrossFade(window.actions[window.animation], window.actions[gradeArr[i].key], gradeArr[i].time);
							window.animation = gradeArr[i].key;
							timeout(gradeArr[i].time);
						} else {
							nextPrepare = function() {
								nextPrepare = undefined;
								prepareIng = true;
								console.log('nextPrepare', v, window.animation, gradeArr[i].key, prepareIng)
								consoleInner({ v, animation: window.animation, key: gradeArr[i].key, prepareIng });
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

	elHtml.onmousemove = function(){
		addGradeFn('mousemoveObj');
	};
	// ioHook.on('mousemove', event => {
	//   console.log(event);
	// });

	decrease();

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

		if(time - mouseObj[key].preTime > mouseObj[key].interval) {
			mouseObj[key].preTime = time;
			operationGrade.val += mouseObj[key].addGrade;
		}
	};
	// 紧迫程度 - 衰退
	function decrease() {
		operationInterval && clearInterval(operationInterval);
		operationInterval = setInterval(() => {
			if(operationGradeVal > 0) {
				operationGrade.val -= 1;
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