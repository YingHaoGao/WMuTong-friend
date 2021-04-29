const { remote, ipcRenderer, desktopCapturer } = require('electron');
const { robot, ioHook, globalShortcut } = remote.app.main_params;
const fs = require('fs');
const cp = require("child_process");
const zlib = require('zlib');
const crypto = require("crypto");
const request = require('request-promise');

/**
 * @params obj - 打印的数据  打印结果： key: value
 * @params idx - 期望打印的位置 相对于 consoleList, 缺省时在consoleList尾部添加
 * @return idx - 实际打印的位置 相对于 consoleList
 */
var consoleList = [];
const consoleInner = function(obj, idx) {
	let elConsole = document.getElementById('console');
	let s = '';

	if(obj.constructor == String) {
		s = obj;
	}
	else if(obj.constructor == Object) {
		Object.keys(obj).map( k => {
			s += k + ': ' + JSON.stringify(obj[k]) + '  ';
		});
	}
	else if(obj.constructor == Array) {
		s = k + ': ' + JSON.stringify(obj[k]) + '  ';
	}
	else {
		s = obj;
	}

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
 * 屏幕录制
 * */
class transcribe {
	constructor(params = {}) {
		this.isTranscribe = false;
		this.time = 0;
		this.consoleInner = 55;
		this.interval = params.interval;
		this.blob = null;
	}
	// 开始录制
	createRecorder() {
		let source;
		let that = this;
		// 获取当前屏幕和应用窗口源信息
		desktopCapturer.getSources({ types: ['window', 'screen'] })
			.then(async (sources) => {
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
				})
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
						})
						.catch(err => {
							consoleInner('获取音频失败', 10);
							createRecorder(Mediastream);
						})
				})
				
			}).catch(error => consoleInner({ '获取窗口源信息失败': error }, 10));

		// 函数初始化录制
		that.recorder = null;
		let i=0;
		function createRecorder(stream) {
			that.isTranscribe = true;
			
			that.interval.mount({
				id: that.consoleInner,
				repetition: Infinity,
				fn() {
					that.time++;
					consoleInner({'开始录制': that.time}, that.consoleInner);
				}
			});

			that.recorder = new MediaRecorder(stream);
			that.recorder.start(10000);
			// 如果 start 没设置 timeslice，ondataavailable 在 stop 时会触发
			that.recorder.ondataavailable = event => {
			    let blob = new Blob([event.data], {
			    	type: 'video/mp4',
			    });
			    saveMedia(blob);
			};
			that.recorder.onerror = err => {
				that.isTranscribe = false;
		    	console.error(err);
			};
		};
		function saveMedia(blob) {
			let reader = new FileReader();
			reader.onload = () => {
		    	let buffer = Buffer.from(reader.result);

		    	fs.writeFile('test'+i+'.mp4', buffer, {}, (err, res) => {
		      		if (err) return console.error(err);
		    	});
		    	i++;
		  	};
			reader.onerror = err => console.error(err);
			reader.readAsArrayBuffer(blob);
		};
	}
	// 结束录制
	stopRecord() {
		consoleInner({'结束录制,总时长': this.time + 's'}, this.consoleInner);
		this.isTranscribe = false;
		this.recorder.stop();
		this.time = 0;
		this.interval.unload(this.consoleInner);
	}
	// 录制状态
	getIs() {
		return this.isTranscribe;
	}
};

/**
 * 生命计时器
 * */
class createInterval {
	constructor(params) {
		this.params = params || {};
		this.interval = undefined;
		this.time = 100;

		this.init();
	}
	// 初始化
	init() {
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
					this.params[k].repetition--;

					if(this.params[k].repetition <= 0) {
						this.unload(this.params[k].id);
					}
				}
			})
		}, this.time);
	}
	// 清空
	clear() {
		this.interval && clearInterval(this.interval);
		this.params = {};
	}
	// 挂载
	mount(params) {
		params = {
			id: new Date().getTime(),
			fn: function() {},
			interval: 1000,
			before: 0,
			repetition: 1, // 0 ~ Infinity
			...params
		};
		this.params[params.id] = params;
	}
	// 卸载
	unload(id) {
		delete this.params[id];
	}
};

/**
 * 执行记录
 * */
class history {
	constructor(params = {}) {

	}
};

/**
 * fs
 * */
class fsTool {
	constructor(params = {}) {
	}
	// 读取
	read(path) {
		let that = this;
		return new Promise((resolve, reject) => {
			let data = "";
			let rs = fs.createReadStream(path);

			rs.setEncoding('UTF8');
			// 读取可读流的内容
			rs.on('data', chunk => {
				data = chunk;
			});
			rs.on('end', () => {
				resolve(data)
			});
			rs.on('error', err => {
				reject(err.stack)
			});
		});
	}
	// 写入
	write(path, str) {
		let that = this;
		return new Promise((resolve, reject) => {
			let ws = fs.createWriteStream(path);

			ws.write(str, err => {
				if(err) throw err;
			});
			ws.end();

			ws.on('finish', () => {
				resolve();
			});
			ws.on('error', err => {
				reject(err.stack);
			});
		});
	}
	// 压缩
	gzip(pathIn, pathOut, pswd = 'mutong') {
		let password = new Buffer(pswd);
		let encryptStream = crypto.createCipher("aes-256-cbc", password);
		let gzip = zlib.createGzip();
		let rs = fs.createReadStream(pathIn);
		let ws = fs.createWriteStream(pathOut + '.gz');

		return new Promise((resolve, reject) => {
			rs
				.pipe(encryptStream)
				.pipe(gzip)
				.pipe(ws)
				.on("finish", () => {
					resolve();
				})
				.on("error", err => {
					reject(err)
				});
		})
	}
	// 解压
	gunzip(pathIn, pathOut, pswd = 'mutong') {
		let password = new Buffer(pswd);
		let decipherStream = crypto.createDecipher("aes-256-cbc", password);
		let gunzip = zlib.createGunzip();
		let rs = fs.createReadStream(pathIn);
		let ws = fs.createWriteStream(pathOut);

		// process.stdout.write 终端
		return new Promise((resolve, reject) => {
			rs
			  .pipe(gunzip)
			  .pipe(decipherStream)
			  .pipe(ws)
			  .on("finish", () => {
			  	resolve()
			  })
			  .on("error", err => {
			  	reject(err)
			  });
		});
	}
};

/**
 * cp 
 * */
class cpTool {
	constructor() {

	}
	cmd(s) {
		return new Promise((resolve, reject) => {
			cp.exec(s, (err, stdout, stderr) => {
				if(err) {
					reject(err);
				} else {
					resolve(stdout);
				}
			})
		})
	}
};


/**
 * 截图
 * */
function print() {
	var screen_window = cp.execFile(__dirname + '/lib_exe/PrintScr.exe');
	screen_window.on('exit', function (code) {
      // 执行成功返回 1，返回 0 没有截图
      if (code) mainWindow.webContents.paste()
    })
};


/**
 * 获取浏览器内存占用情况
 * */
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

/**
 * 控制鼠标
 * */
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

/**
 * 控制键盘
 * */
function robotKeyBoard() {
	robot.typeString("Hello World");

	robot.keyTap("enter");
};

/**
 * 获取屏幕
 * */
function robotScreen() {
	var mouse = robot.getMousePos();

	var hex = robot.getPixelColor(mouse.x, mouse.y);
};


/**
 * 允许鼠标点击事件传播
 * */
function enableClickPropagation() {
	let win = remote.getCurrentWindow();
	// ioHook.enableClickPropagation()
	win.setIgnoreMouseEvents(true, { forward: true });
	if($('.disableClick')){
		$('.disableClick').on('mouseover', () => { win.setIgnoreMouseEvents(false); })
		$('.disableClick').on('mouseout', () => { win.setIgnoreMouseEvents(true, { forward: true }); })
	}
};

/**
 * 禁止鼠标点击事件传播
 * */
function disableClickPropagation() {
	let win = remote.getCurrentWindow();
	// ioHook.disableClickPropagation()
	win.setIgnoreMouseEvents(false);
};

/**
 * 翻译
 * */
class Translator {
	constructor() {
		this.config = {
			// zh-CHS(中文) || ja(日语) || EN(英文)
			from: 'zh-CHS',
			to: 'EN',
			appKey: '69081ddc1b778fab',
			secretKey: 'rH75zpJ7fuoHgJ5miue8Tjdco4npV2iB',
		};
		this.dom = null;
	}
	// md5 加密
	md5(str) {
		let crypto_md5 = crypto.createHash("md5");
		crypto_md5.update(str);
		return crypto_md5.digest('hex');
	}
	getRandomN(roundTo) {
		return Math.round(Math.random() * roundTo);
	}
	// obj 转 url params
	generateUrlParams(_params) {
		const paramsData = [];
		for(const key in _params) {
			if(_params.hasOwnProperty(key)){
				paramsData.push(key + '=' + _params[key]);
			}
		}
		return paramsData.join('&');
	}
	// 翻译
	async translate(word) {
		let youdaoHost = 'http://openapi.youdao.com/api';
		let encodeURIWord = encodeURI(word);
		let salt = this.getRandomN(1000);
		let sign = this.md5(this.config.appKey + word + salt + this.config.secretKey);
		let paramsJson = {
			q: encodeURIWord,
			from: this.config.from,
			to: this.config.to,
			appKey: this.config.appKey,
			salt: salt,
			sign: sign
		};
		let url = `${youdaoHost}?${this.generateUrlParams(paramsJson)}`;
		let result = await request.get({url});

		/*
			返回结果：
				errorCode	text	错误返回码	一定存在
				query		text	源语言	查询正确时，一定存在
				translation	Array	翻译结果	查询正确时，一定存在
				basic		text	词义	基本词典，查词时才有
				web			Array	词义	网络释义，该结果不一定存在
				l			text	源语言和目标语言	一定存在
				dict		text	词典deeplink	查询语种为支持语言时，存在
				webdict		text	webdeeplink	查询语种为支持语言时，存在
				tSpeakUrl	text	翻译结果发音地址	翻译成功一定存在，需要应用绑定语音合成实例才能正常播放否则返回110错误码
				speakUrl	text	源语言发音地址	翻译成功一定存在，需要应用绑定语音合成实例才能正常播放否则返回110错误码
				returnPhrase	Array	单词校验后的结果	主要校验字母大小写、单词前含符号、中文简繁体
		*/ 
		return JSON.parse(result);
	}
	// 插入dom
	createDom(x, y) {
		if($('disableClick[name=translator]').length > 0) {
			this.removeDom();
		}

		this.dom = $(
				`<div class="disableClick" name="translator" style="position:fixed;top:${parseInt(y)-100}px;left:${parseInt(x)-100}px;width: 200px;">
					<div class="input"><input type="text"/><input type="button" name="close" value="关闭"/></div>
					<div><input type="button" name="from" value="中-英"/></div>
					<div class="text"></div>
				</div>`
			);
		let $input = this.dom.find('input[type=text]');
		let $from = this.dom.find('input[name=from]');
		let $close = this.dom.find('input[name=close]');
		let $text = this.dom.find('.text');

		$('body').append(this.dom);
		enableClickPropagation();

		$from.off().on('click', e => {
			if($from.val() == '中-英') {
				this.config.from = 'EN';
				this.config.to = 'zh-CHS';
				$from.val('英-中');
			} else {
				this.config.from = 'zh-CHS';
				this.config.to = 'EN';
				$from.val('中-英');
			}
		});
		$input.off().on('keydown', e => {
			if(e.keyCode == 13) {
				this.translate($input.val()).then(res => {
					let s = '';
					res['translation'].map(item => {
						s += item;
					});
					$text.text(s);
				})
			}
		});
		$close.off().on('click', e => {
			this.removeDom();
		})
	}
	// 移除dom
	removeDom() {
		if(this.dom) {
			this.dom.remove();
			this.dom = null;
			enableClickPropagation();
		}
	}
}


export {
	consoleInner, transcribe, createInterval, 
	print, getPerformance, robotMouse, robotKeyBoard, robotScreen,
	fsTool, cpTool, Translator, disableClickPropagation, enableClickPropagation
};