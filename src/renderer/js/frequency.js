const { remote, ipcRenderer, desktopCapturer } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;

var consoleList = [];
var interval;

function init() {
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
		var y;

		robot.moveMouse(100, 100);
		// for (var x = 0; x < width; x++)
		// {
		// 	y = height * Math.sin((twoPI * x) / width) + height;
		// 	robot.moveMouse(x, y);
		// }
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

// 屏幕录制
function transcribe() {
	console.log("sources", desktopCapturer)
	let source;
	// 获取当前屏幕和应用窗口源信息
	desktopCapturer.getSources(
		{ types: ['window', 'screen'] },
		function(err, sources) {
			console.log("err", err, sources)
			error && consoleInner({ '获取窗口源信息失败': JSON.stringify(err) });

			source = sources[0];

			/*首先根据选择的录制源是窗口还是摄像头以不同的方式获取视频流；*/
			let sourceId = source.id; // 所选择的屏幕或窗口 sourceId
			let stream = navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
				    mandatory: {
					    chromeMediaSource: 'desktop',
					    chromeMediaSourceId: sourceId,
					    maxWidth: window.screen.width,
					    maxHeight: window.screen.height,
					}
				}
			});

			/*因为无法通过直接设置 audio: true 来获取音频，所以需要另外加入麦克风的音轨。*/
			stream.then(function(Mediastream) {
				let audioTracks = navigator.mediaDevices
					.getUserMedia({
						audio: true,
						video: false
					})
					.then(mediaStream =>{
						//mediaStream.getAudioTracks()[0];
						Mediastream.addTrack(mediaStream.getAudioTracks()[0]);
						createRecorder(Mediastream); // createRecorder() 函数实现见下文
					});
			}).catch(err => consoleInner({ 'startRecord error': JSON.stringify(err) }));
		}
	);

	// 函数初始化录制
	let recorder = null;
	let i=0;
	function createRecorder(stream) {
		recorder = new MediaRecorder(stream);
		recorder.start(10000);
		// 如果 start 没设置 timeslice，ondataavailable 在 stop 时会触发
		recorder.ondataavailable = event => {
		    let blob = new Blob([event.data], {
		    	type: 'video/mp4',
		    });
		    saveMedia(blob);
		};
		recorder.onerror = err => {
	    	console.error(err);
		};

		setTimeout(() => {
			consoleInner({ '结束录制': '结束录制' });
			stopRecord();
		}, 20000);
	};

	// 函数结束录制并保存至本地 mp4 文件；
	function stopRecord() {
		recorder.stop();
	}
	 
	function saveMedia(blob) {
		let reader = new FileReader();
		reader.onload = () => {
	    	let buffer = new Buffer(reader.result);
	    	fs.writeFile('test'+i+'.mp4', buffer, {}, (err, res) => {
	      		if (err) return console.error(err);
	    	});
	    	i++;
	  	};
		reader.onerror = err => console.error(err);
		reader.readAsArrayBuffer(blob);
	}
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
}


/**
 * @params obj - 打印的数据  打印结果： key: value
 * @params idx - 期望打印的位置 相对于 consoleList, 缺省时在consoleList尾部添加
 * @return idx - 实际打印的位置 相对于 consoleList
 */
function consoleInner(obj, idx) {
	let elConsole = document.getElementById('console');
	let s = '';

	Object.keys(obj).map( k => {
		s += k + ': ' + obj[k] + '  ';
	});

	if(idx || idx === 0) {
		if(consoleList[idx]) {
			let Didx = elConsole.getElementsByClassName('console_'+idx)[0];
			Didx.innerHTML = s;
			return idx;
		} else {
			let Ddiv = document.createElement('div');

			Ddiv.className = 'console_' + idx;
			Ddiv.innerHTML = s;

			elConsole.appendChild(Ddiv);
			consoleList[idx] = Ddiv;
			return idx;
		}
	} else {
		let conLen = consoleList.length;
		let Ddiv = document.createElement('div');

		Ddiv.className = 'console_' + idx;
		Ddiv.innerHTML = s;

		elConsole.appendChild(Ddiv);
		consoleList[conLen] = Ddiv;
		return conLen;
	}
};

/**
 * 生命计时器
 * */
function createInterval(params) {
	this.params = params || {};
	this.interval = undefined;
	this.time = 100;

	this.init();
};
createInterval.prototype.init = function() {
	this.interval = setInterval(() => {
		let newTime = new Date().getTime();

		Object.keys(this.params).map(k => {
			if(
				newTime - this.params[k].before > this.params[k].interval &&
				this.params[k].repetition > 0 &&
				this.params[k].fn
			) {
				this.params[k].fn();
				this.params[k].before = newTime;
				this.params[k].repetition --;

				if(this.params[k].repetition <= 0) {
					this.unload(this.params[k].id);
				}
			}
		})
	}, this.time);
};
createInterval.prototype.clear = function() {
	this.interval && clearInterval(this.interval);
	this.params = {};
};
createInterval.prototype.mount = function(params) {
	params = {
		id: new Date().getTime(),
		fn: function() {},
		interval: 1000,
		before: 0,
		repetition: 1, // 0 ~ Infinity
		...params
	};
	this.params[params.id] = params;
};
createInterval.prototype.unload = function(id) {
	delete this.params[id];
};



ipcRenderer.on('browserWindowCreated', (event, ans) => {
	interval = new createInterval();
	interval.mount({ id: 'getPerformance', repetition: Infinity, fn: getPerformance });

    init();
	transcribe();
});

ipcRenderer.on('electron_quit', (event, ans) => {
	interval.clear()
})