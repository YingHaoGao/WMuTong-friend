setTimeout(function (){
	var that = this;
	var operationInterval;
	var operationTime = 1000;
	var gradeArr = [ { key: 'idleAction', grade: 0 }, { key: 'walkAction', grade: 50 }, { key: 'runAction', grade: 150 } ];
	var mousemoveObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mousedownObj = { preTime: 0, interval: 0, addGrade: 3 };
	var mousewheelObj = { preTime: 0, interval: 300, addGrade: 1 };
	var mouseObj = { mousemoveObj: mousemoveObj, mousedownObj: mousedownObj, mousewheelObj: mousewheelObj };
	var operationGradeVal = 0;
	var elConsole = document.getElementById('console');
	var operationGrade = Object.defineProperty({}, 'val', {
		get() { return operationGradeVal },
		set(v) {
			operationGradeVal = v;
			elConsole.innerHTML = v;

			for(let i = 0; i < gradeArr.length; i++) {
				let nextGrade = gradeArr[i+1];
				if(
					v > gradeArr[i].grade &&
					(nextGrade ? v <= nextGrade.grade : true)
					) {

					elConsole.innerHTML = v + '  ' + window.animation  + '  ' + gradeArr[i].key;
					if(gradeArr[i].key != window.animation) {
						elConsole.innerHTML = v + '  ' + window.animation  + '  ' + gradeArr[i].key;
						window.prepareCrossFade(window.actions[window.animation], window.actions[gradeArr[i].key], 1.0);
						window.animation = gradeArr[i].key;
					}
					break;
				}
			}
		}
	});

	// idleAction, walkAction, runAction
	window.animation = 'idleAction';

	var addGradeFn = (key) => {
		let time = new Date().getTime();

		if(time - mouseObj[key].preTime > mouseObj[key].interval) {
			mouseObj[key].preTime = time;
			operationGrade.val += mouseObj[key].addGrade;
		}
	};

	// 衰退
	operationInterval = setInterval(() => {
		if(operationGradeVal > 0) {
			operationGrade.val -= 1;
		}
	}, operationTime);


	let el = document.getElementById('html');
	el.onmousemove = function(){
		addGradeFn('mousemoveObj');
	};
	// 不能接收除了 移动 以外的鼠标事件。。。。。
	el.onmousedown = function(){
		addGradeFn('mousedownObj');
	};
	el.onmouseup = function(){
		addGradeFn('mousedownObj');
	};
	el.onmousewheel = function(e, d){
		elConsole.innerHTML = 'onmousewheel';
		let dir = d > 0 ? 'up' : 'down';

		addGradeFn('mousewheelObj');
		if(dir == 'up') {
			// 向上滚动
		}
		else {
			// 向下滚动
		}
	};
}, 1000);