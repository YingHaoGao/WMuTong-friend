const xhr_proxy = require('../util/xhr_proxy.js');
const WebSocket = require('ws');

var interval;
// 访问的页面 title
var pageTitle;
// 等待下载的 m3u8 资源集合
var awaitSourceId = {};
var getStr = (str = '', start, end) => {
    let res = str.match(new RegExp(`${start}(.*?)${end}`))
    return res ? res[1] : null
};

/**
 * 将中文符号转换成英文符号
 */
function chineseChar2englishChar(chineseChar){
    // 将单引号‘’都转换成'，将双引号“”都转换成"
    var str = chineseChar.replace(/\’|\‘/g,"'").replace(/\“|\”/g,"\"");
    // 将中括号【】转换成[]，将大括号｛｝转换成{}
    str = str.replace(/\【/g,"[").replace(/\】/g,"]").replace(/\｛/g,"{").replace(/\｝/g,"}");
    // 将逗号，转换成,，将：转换成:
    str = str.replace(/，/g,",").replace(/：/g,":");
    return str;
};

// 捕获请求内的 m3u8 资源
var busClient = new WebSocket('ws://localhost:12122/');
let get_m3u8_responseText = function(xhr) {
	console.log(xhr)
	let isM3u8 = xhr.responseURL.match(/.+\.m3u8/);

	if($('html title')){
		pageTitle = $('html title').text();
	}
	else if(document.getElementById("thread_subject")) {
		pageTitle = document.getElementById("thread_subject").innerHTML;
	}
	else {
		pageTitle = new Date().getTime() + "";
	}
	pageTitle = chineseChar2englishChar(pageTitle);
	pageTitle = pageTitle.trim().replace(/[ ]|[\r\n]|-|:|\*|\?|"|\/|\\|\<|\>/g,"");

	if(isM3u8) {
		let awaitLeng = Object.keys(awaitSourceId).length;

		if(xhr.responseText.match('URI="key.key"')) {
			busClient.send(JSON.stringify({
				id: 'source-url', url: isM3u8[0], title: pageTitle || awaitLeng, key: awaitLeng,
				// header_url: xhr.responseURL.match
			}));
		}
		else {
			busClient.send(JSON.stringify({
				id: 'source-str', str: xhr.responseText, title: pageTitle || awaitLeng, key: awaitLeng,
				// header_url: xhr.responseURL.match
			}));
		}
	}
}
xhr_proxy.addHandler(get_m3u8_responseText);

window.onload=function(){
	const script=document.createElement("script");
	script.type="text/javascript";
	script.src="https://code.jquery.com/jquery-1.12.4.min.js";
	script.onload = function() {
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

		var eventBind = function() {
			let aCss = {
				'padding-right': '10px', 'cursor': 'pointer'
			}

			$('#locaUrl').css({ 'margin-right': '10px' }).off().on('keydown', e => {
				if(e.keyCode == 13) {
					$('#webview').attr('src', $('#locaUrl').val().trim());
				}
			});

			$('#skip').css(aCss).off().on('click', e => {
				$('#webview').attr('src', $('#locaUrl').val().trim());
			});
			$('#rollback').css(aCss).off().on('click', e => {
				$('#webview')[0].goBack();
			});
			$('#refresh').css(aCss).off().on('click', e => {
				$('#webview')[0].reload();
			});
			$('#imgHideShow').css(aCss).off().on('click', e => {
				busClient.send(JSON.stringify({ id: 'webview-imgHideShow' }));
			});
			$('#discern').css(aCss).off().on('click', e => {
				busClient.send(JSON.stringify({ id: 'webview-discern' }));
			})
			$('#openTool').css(aCss).off().on('click', e => {
				$('#webview')[0].openDevTools();
			});


			busClient.send(JSON.stringify({ id: 'webview-imgHideShow' }));
		};
		eventBind();

		let sourceSrc;

		pageTitle = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

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
			console.log(data)
			if(data == 'get-source') {
				getSource();
			}
			else if(data == 'webview-imgHideShow') {
				console.log($('#webview-img-show').css('display') == 'none')
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
	};

	document.getElementsByTagName('head')[0].appendChild(script);
}
window.onbeforeunload = function() {
	interval && clearInterval(interval);
}
