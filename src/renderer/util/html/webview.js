const xhr_proxy = require('../xhr_proxy.js');

var interval;
// 访问的页面 title
var pageTitle;
// 等待下载的 m3u8 资源集合
var awaitSourceId = {};
var getStr = (str = '', start, end) => {
    let res = str.match(new RegExp(`${start}(.*?)${end}`))
    return res ? res[1] : null
};

// 捕获请求内的 m3u8 资源
var busClient = new WebSocket('ws://localhost:12122/');
let get_m3u8_responseText = function(xhr) {
	let isM3u8 = xhr.responseURL.match(/.+\.m3u8/);
	pageTitle = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");
	
	if(isM3u8) {
		let awaitLeng = Object.keys(awaitSourceId).length;

		busClient.send(JSON.stringify({
			id: 'source-str', str: xhr.responseText, title: pageTitle || awaitLeng, key: awaitLeng
		}));
	}
}
xhr_proxy.addHandler(get_m3u8_responseText);

window.onload=function(){
	const script=document.createElement("script");
	script.type="text/javascript"; 
	script.src="https://code.jquery.com/jquery-1.12.4.min.js"; 
	document.getElementsByTagName('head')[0].appendChild(script);
	
	setTimeout(() => {
		$('html').append('<span id="webview-img-show"><span>')
		var imgHideShow = function(is) {
			if(is) {
				$('img').css('display', 'block');
				$('iframe').css('display', 'block');
				$('.vjs-poster').css({ 'display': 'block' });
				$('video').css({ 'visibility': 'initial' });
				$('#webview-img-show').css({ 'display': 'block' });
			} else {
				$('img').css('display', 'none');
				$('iframe').css('display', 'none');
				$('.vjs-poster').css({ 'display': 'none' });
				$('video').css({ 'visibility': 'hidden' });
				$('#webview-img-show').css({ 'display': 'none' });
			}
		}

		const WebSocket = require('ws');

		let sourceSrc;

		pageTitle = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

		var busClient = new WebSocket('ws://localhost:12122/');
		var getSource = () => {
			let src = $('source').attr('src');
			let id = '';

			if(src && src != '') {
				src = src.match(/.+\.m3u8/);
				if(!src) return;

				id = getStr(src[0], '/m3u8/', '/');
				if(awaitSourceId[id]) return;
				awaitSourceId[id] = src[0];
			}

			Object.keys(awaitSourceId).map(k => {
				if(awaitSourceId[k] != 'false') {
					let src = awaitSourceId[k];
					let title = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

					if(busClient.readyState === 1) {
						busClient.send(JSON.stringify({
							id: 'source-src', src, title, key: k
						}));
						awaitSourceId[k] = 'false';
					} else {
						busClient = new WebSocket('ws://localhost:12122/');
					}
				}
			});
		};

		busClient.on('message', data => {
			if(data == 'get-source') {
				getSource();
			}
			else if(data == 'webview-imgHideShow') {
				imgHideShow($('#webview-img-show').css('display') == 'none');
			}
			else if(data == 'webview-discern') {
				let src = $('source').attr('src');
				let id = '';

				if(src && src != '') {
					src = src.match(/.+\.m3u8/);
					if(!src) return;

					id = getStr(src[0], '/m3u8/', '/');
					awaitSourceId[id] = src[0];
				}
			}
		});

		interval && clearInterval(interval);
		interval = setInterval(() => {
			getSource();
		}, 1000);

		$(window).off().on('DOMNodeInserted', () => {
			getSource();
		})
	}, 1000)
}
window.onbeforeunload = function() {
	interval && clearInterval(interval);
}