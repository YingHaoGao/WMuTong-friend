/**
 * @params obj - 打印的数据  打印结果： key: value
 * @params idx - 期望打印的位置 相对于 consoleList, 缺省时在consoleList尾部添加
 * @return idx - 实际打印的位置 相对于 consoleList
 */
var consoleList = [];
var consoleInner = function(obj, idx) {
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

export {
	consoleInner
};