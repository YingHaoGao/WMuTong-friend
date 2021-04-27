var a = [{ a:1 }, {a: 2}];
a.map(item => {console.log(item.a)})
b();
function c() {
	console.log(22)
}
global.c = c;