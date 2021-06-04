const { remote, ipcRenderer, desktopCapturer } = require('electron');
const { session } = remote;
const {
	robot, ioHook, globalShortcut, dialog, Notification, BrowserWindow
} = remote.app.main_params;
const fs = require('fs');
const cp = require("child_process");
const zlib = require('zlib');
const crypto = require("crypto");
const request = require('request-promise');
const path = require('path');
const iconv = require('iconv-lite');
const rUrl = require('url');
const WebSocket = require('ws');

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

		Ddiv.className = 'console_' + conLen;
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

			fs.exists(path, (exists) => {
				if(!exists) {
					fs.mkdirSync(path);
				}
			})

			ws.write(str, err => {
				if(err) throw err;
			});
			ws.end();

			ws.on('finish', () => {
				resolve();
			});
			ws.on('error', err => {
				console.error(err)
				reject(err.stack);
			});
		});
	}
	// 删除
	delete(path) {
		fs.unlinkSync(path);
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
	constructor(params = {}) {
		this.exec = null;
		this.params = params;
		this.stdout_fn = params.stdout_fn;
		this.stderr_fn = params.stderr_fn;
		this.close_fn = params.close_fn;
		this.env = {
			'PATH': `${process.env.PATH || process.env.Path};${__dirname}/build/ffmpeg/bin`
		};
	}

	cmd(s, not_record) {
		let that = this;
		if(!not_record) {
			this.exec_s = s;
		}

		if(typeof s === 'string') {
			this.exec = cp.exec(s, { encoding:'GBK', env: that.env });
		} else {
			this.exec = cp.exec(s.cwd, { encoding:'GBK', env: that.env, ...s });
		}

		// 正常可执行程序输出
		this.exec.stdout.on('data', res => {
			res = iconv.decode(Buffer.concat([res]), 'GBK');
			that.stdout_Data(res);
		});
		// 错误可执行程序输出
		this.exec.stderr.on('data', err => {
			err = iconv.decode(Buffer.concat([err]), 'GBK');
			that.stderr_Data(err);
		});
		// 退出后的输出
		this.exec.on('close', code => {
			that.exec_Close(code)
		});
	}
	stdout_Data(res) {
		console.log('stdoutData ------------', res);
		this.stdout_fn && this.stdout_fn();
	}
	stderr_Data(err) {
		console.log('stderrData --> end -------------', err);
		let that = this;
		let module_name = err.match(/\'([a-z]|[A-Z])+\'/)[0];

		module_name = module_name.replace(/\'|\"/g, '');

		if(err.indexOf('不是内部或外部命令') > -1) {
			switch(module_name) {
				case 'ffmpeg':
					
					break;
			}
		}
		this.stderr_fn && this.stderr_fn();
	}
	exec_Close(code) {
		console.log('execClose -------------', code, this.tag, this.close_fn);
		this.close_fn && this.close_fn();
	}
};

/**
 * session
 * */
 class sessionTool {
 	constructor(params = { urls: [] }) {
 		this.urls = params.urls;
 		this.sendHeaderCall = params.sendHeaderCall || function(){};

 		this.defaultSession();
 	}
 	defaultSession() {
 		const filter = {
   			urls: this.urls
		}

		session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
			this.sendHeaderCall(details);
	   		callback({cancel: false, requestHeaders: details.requestHeaders})
	 	})

		session.defaultSession.webRequest.onCompleted(filter, (details, callback) => {
			this.completedCall(details);
	   		// callback({cancel: false, requestHeaders: details.requestHeaders})
	 	})
 	}
 	sendHeaderCall(){}
 	completedCall(){}
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
		if($('.disableClick[name=translator]').length > 0) {
			this.removeDom();
		}

		this.dom = $(
				`<div class="disableClick" name="translator" style="position:fixed;top:${y-100}px;left:${x-100}px;width: 200px;">
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

/**
 * 系统通知
 * */
class cteateNotification {
	constructor(options) {
		// title String (optional) - 通知的标题，显示时将显示在通知窗口的顶部.
		// subtitleString (可选) 通知的副标题, 显示在标题下面。 macOS
		// body String (optional) - 通知的正文，将显示在标题或副标题下面.
		// silentBoolean (可选) 在显示通知时是否发出系统提示音。
		// icon(String | NativeImage ) (可选) 用于在该通知上显示的图标。
		// hasReplyBoolean (可选) 是否在通知中添加一个答复选项。 macOS
		// timeoutType String (optional) Linux Windows - 通知的超时时间。可以是'default'或'never'.
		// replyPlaceholderString (可选) 答复输入框中的占位符。 macOS
		// sound String (可选) 显示通知时播放的声音文件的名称。 macOS
		// urgency String (optional) Linux - 通知的紧急级别。可以是“正常”、“关键”或“低”.
		// actions NotificationAction[] (可选) macOS - 要添加到通知中的操作 请阅读 NotificationAction文档来了解可用的操作和限制。
		// closeButtonText String (optional) macOS - 警告的关闭按钮的自定义标题。空字符串将导致使用默认的本地化文本.
		// toastXml String (optional) Windows - Windows上的通知的自定义描述将取代上面的所有属性。提供对通知的设计和行为的完全定制
		
		this.options = {
			icon: path.join(__dirname, '../../icon/logo.png'),
			...options
		};
		this.not = new Notification(this.options.title, this.options);
		return this.not;
	}
}

/**
 * 创建浏览器窗口
 * */
class createWindow {
	constructor() {
		this.win = new BrowserWindow({
			width: 400,
			height: 400,
			center: true,
			frame: true,
			resizable: true,
			useContentSize: true,
			movable: true,
			minimizable: true,
			maximizable: false,
			closable: true,
			fullscreenable: false,
			autoHideMenuBar: true,
			darkTheme: true,
			fullscreen: false,
		    webPreferences: {
		      webviewTag: true,
		      nodeIntegration: true,
		      enableRemoteModule: true,
		      webSecurity: false,
		      nodeIntegrationInWorker: true,
		      nodeIntegrationInSubFrames: true,
		      allowRunningInsecureContent: true
		    }
		});
		this.win.setBackgroundColor('#000000')

		this.win.loadURL(
		  rUrl.format({
		    pathname: path.join(__dirname, './util/html/webview.html'),
		    protocol: 'file',
		    slashes: true,
		  })
		);
		return this.win;
	}
}


/**  -等待研究-
 * xhr_proxy.js
 * 通过劫持原生XMLHttpRequest实现对页面ajax请求的监听
 * @author binaryfire
 */
class xhr_proxy {
	constructor() {
		this.READY_STATE_CHANGE = 'readystatechange';
		this.gHandlerList = [];
		this.gIsInited = false;
	}
}

/**
 * ws
 * */
class wsTool {
	constructor(params = {}) {
		let that = this;

		this.onKey = {};
		this.wss = new WebSocket.Server({ port: 12122, ...params });

		// 有客户端连接时		 
		this.wss.on('connection', ws => {
			this.ws = ws;
			this.clients = this.wss.clients;
			this.msg();
			this.send('connection-success');
		});
	}
	// 创建 'message' 监听
	msg() {
		this.ws.on('message', data => {
	        this.onKey['message'] && this.onKey['message'](data);
	    });
	}
	send(data) {
        this.wss.clients.forEach(client => {
	        if (client.readyState === WebSocket.OPEN) {
	            client.send(data);
	        }
	    });
	}
	on(key, fn) {
		this.onKey[key] = fn;
	}
	getWs() {
		return this.ws;
	}
}

export {
	consoleInner, transcribe, createInterval, 
	print, getPerformance, robotMouse, robotKeyBoard, robotScreen,
	fsTool, cpTool, Translator, disableClickPropagation, enableClickPropagation,
	sessionTool, cteateNotification, createWindow, wsTool
};