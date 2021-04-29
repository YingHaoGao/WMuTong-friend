import { fsTool, consoleInner, Translator } from '../../util/index.js';

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

export { body }