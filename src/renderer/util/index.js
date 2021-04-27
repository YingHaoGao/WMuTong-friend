const { desktopCapturer } = require('electron');
const fs = require('fs');

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
				console.log(sources)
				/*首先根据选择的录制源是窗口还是摄像头以不同的方式获取视频流；*/
				let sourceId = source.id; // 所选择的屏幕或窗口 sourceId
				console.log(sourceId)
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
		    	let buffer = new Buffer(reader.result);
		    	console.log(buffer)
		    	fs.writeFileSync('test'+i+'.mp4', buffer, {}, (err, res) => {
		      		if (err) return console.error(err);
		    	});
		    	i++;
		  	};
			reader.onerror = err => console.error(err);
			console.log(blob)
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
 * 读写
 * */
class fsOperation {
	constructor(params = {}) {
		this.fs = null;
		this.ws = null;
		this.path = params.path;
	}
	read(path) {
		let that = this;
		return new Promise((resolve, reject) => {
			that.rs = fs.createReadStream(path);
			// 读取可读流的内容
			that.rs.on('data', (chunk) => {
				resolve(chunk)
			});
		});
	}
	write(path, str) {
		let that = this;
		return new Promise((resolve, reject) => {
			that.ws = fs.createWriteStream(path);
			that.ws.write(str, err => {
				if(err) throw err;
			})
		});
	}
};

export {
	consoleInner, transcribe, createInterval, fsOperation
};