/*  */
// 场景
var scene = new THREE.Scene();
// 相机
var camera = new THREE.PerspectiveCamera(75, $(window).width() / $(window).height(), 0.1, 1000);
// 渲染器
var renderer = new THREE.WebGLRenderer();

renderer.setSize($(window).width(), $(window).height());
$('#clickThroughElement').append(renderer.domElement);
/*  */

/*  */
// 多维数据集
var geometry = new THREE.BoxGeometry();
// 材料
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// 网格
var cube = new THREE.Mesh(geometry, material);

scene.add(cube);

camera.position.z = 5;
/*  */

/*  */
// 渲染
var animate = () => {
	requestAnimationFrame(animate);

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render(scene, camera);
};
animate();
/*  */