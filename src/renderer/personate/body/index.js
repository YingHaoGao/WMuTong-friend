import { fsOperation, consoleInner } from '../../util/index.js';

const body = function(){
	const nFsOperstion = new fsOperation();

	nFsOperstion.read('src/renderer/personate/body/test.js').then(data => {
		let text = data.toString();
		let b = function(){ console.log(11) }
		eval(text);
		global.c();
	})
};

export { body }