const { remote, ipcRenderer } = require('electron');
const { dialog } = remote.app.main_params;

import {
	fsTool, consoleInner, Translator, sessionTool, cteateNotification,
	cpTool, wsTool
} from '../../util/index.js';

const body = function(){
	
};

const nFsTool = new fsTool();

// nFsTool.read('src/renderer/personate/body/test.js').then(data => {
// 	let text = data.toString();
// 	let b = function(){ console.log(11) }
// 	eval(text);
// 	global.c();
// })

// nFsTool.gzip('src/renderer/personate/body/test.js', 'src/renderer/personate/body/test.js');
// nFsTool.gunzip('src/renderer/personate/body/test.js.gz', 'src/renderer/personate/body/test.js');

// const nTranslator = new Translator();
// nTranslator.translate('你好').then(res => {
// 	res['translation'].map(item => {
// 		console.log(item)
// 	})
// })
// new cteateNotification({ title: "通知", body: __dirname })

let nWs = new wsTool();
nWs.on('message', msg => {
	if(typeof msg == 'string') {
		msg = JSON.parse(msg);

		if(msg.id == 'source-src' && msg.src) {
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
					nCpTool.cmd(`ffmpeg -i ${msg.src} -c copy -bsf:a aac_adtstoasc ${__dirname}/downloack/${msg.title}.mp4`);
				}
			}
		}
		else if(msg.id.indexOf('webview') > -1) {
			nWs.send(msg.id);
		}
	}
})

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

export { body }