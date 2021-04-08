const { remote, ipcRenderer } = require('electron');
const { robot, ioHook } = remote.app.main_params;

function init() {
	var operationInterval;
	var operationTime = 1000;
	var gradeArr = [ { key: 'idleAction', grade: 0 }, { key: 'walkAction', grade: 50 }, { key: 'runAction', grade: 150 } ];
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

			for(let i = 0; i < gradeArr.length; i++) {
				let nextGrade = gradeArr[i+1];
				if(
					v > gradeArr[i].grade &&
					(nextGrade ? v <= nextGrade.grade : true)
					) {

					elConsole.innerHTML = v + '  ' + window.animation  + '  ' + gradeArr[i].key;
					if(gradeArr[i].key != window.animation) {
						elConsole.innerHTML = v + '  ' + window.animation  + '  ' + gradeArr[i].key;
						window.prepareCrossFade(window.actions[window.animation], window.actions[gradeArr[i].key], 1.0);
						window.animation = gradeArr[i].key;
					}
					break;
				}
			}
		}
	});

	// idleAction, walkAction, runAction
	window.animation = 'idleAction';

	// elHtml.onmousemove = function(){
	// 	addGradeFn('mousemoveObj');
	// };
	// ioHook.on('mousemove', event => {
	//   console.log(event);
	// });

	decrease();

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
};

ipcRenderer.on('browserWindowCreated', (event, ans) => {
    init();
})