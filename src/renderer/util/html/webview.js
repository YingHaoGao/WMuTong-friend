var interval;
var awaitSourceId = {};
var getStr = (str = '', start, end) => {
    let res = str.match(new RegExp(`${start}(.*?)${end}`))
    return res ? res[1] : null
}

window.onload=function(){
	const WebSocket = require('ws');
	const script=document.createElement("script");
	const $webview = $('#webview');

	let sourceSrc;

	script.type="text/javascript"; 
	script.src="https://code.jquery.com/jquery-1.12.4.min.js"; 
	document.getElementsByTagName('head')[0].appendChild(script);


	var busClient = new WebSocket('ws://localhost:12122/');
	var getSource = () => {
		$('img').hide();
		$('iframe').hide();
		$('.vjs-poster').css({ display: 'none' });
		$('video').css({ visibility: 'hidden' });

		Object.keys(awaitSourceId).map(k => {
			let src = awaitSourceId[k];
			let title = $('#videodetails .login_register_header').text();

			if(busClient.readyState === 1) {
				busClient.send(JSON.stringify({
					id: 'source-src', src, title, key: k
				}));
				delete awaitSourceId[k];
			} else {
				busClient = new WebSocket('ws://localhost:12122/');
			}
		});
	};

	busClient.on('message', data => {
		if(data == 'get-source') {
			getSource();
		}
	});

	interval && clearInterval(interval);
	interval = setInterval(() => {
		getSource();
	}, 1000);

	$(window).off().on('DOMNodeInserted', () => {
		let src = $('source').attr('src');
		let id = '';

		if(src && src != '') {
			src = src.match(/.+\.m3u8/);
			if(!src) return;

			id = getStr(src[0], '/m3u8/', '/');
			awaitSourceId[id] = src[0];
		}
		

	})
}
window.onbeforeunload = function() {
	interval && clearInterval(interval);
}