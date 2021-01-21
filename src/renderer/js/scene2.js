import * as THREE from '../build/three.module.js';

import Stats from '../build/stats.module.js';
import { GUI } from '../build/dat.gui.module.js';

import { GLTFLoader } from '../build/loaders/GLTFLoader.js';
import { OBJLoader } from '../build/loaders/OBJLoader.js';

// 环境变量
var env = process.env;

var scene, renderer, camera, stats;
var model, skeleton, mixer, clock;
var hemiLight;

// 切换动作的控制器集合
var crossFadeControls = [];

var idleAction, walkAction, runAction;
var idleWeight, walkWeight, runWeight;
var actions, settings;

var lookAt = { x: 0, y: 1, z: 0 };
var cameraPosition = { x: 1, y: 2, z: -3 };
var fog = { r: 0, g: 136, b: 136, near: 10, far: 50 };
var hemiLightPosition = { x: 0, y: 20, z: 0 };

var singleStepMode = false;
var sizeOfNextStep = 0;

init();

function init() {

	var container = document.getElementById( 'clickThroughElement' );

	/* 相机 - start - */
	// 创建透视摄像机
	// argument: [视野角度, 宽高比, 远剪切面, 近剪切面]
	// camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
	camera = new THREE.PerspectiveCamera( 45, env.canvesWidth / env.canvesHeight, 1, 1000 );
	// 设置相机位置 (相机摆放位置)
	camera.position.set( cameraPosition.x, cameraPosition.y, cameraPosition.z );
	// 设置摄像机镜头指向的的具体坐标位置
	camera.lookAt( lookAt.x, lookAt.y, lookAt.z );
	/* 相机 - end - */

	/* 时钟 - start - */
	// clock(autoStart: true) 自动开启时钟
	clock = new THREE.Clock();
	/* 时钟 - end - */

	/* 场景 - start - */
	// 创建场景对象
	scene = new THREE.Scene();
	// 在渲染场景的时候将设置背景，且背景总是首先被渲染
	// 可以设置一个用于“clear”的color、一个覆盖canvas的Texture(纹理)、一个cubTexture
	// scene.background = new THREE.Color( '0xa0a0a0' );
	// 定义了影响场景中的每个物体的雾的类型
	/* 雾 - start - */
	// 这个类中的参数定义了线性迷雾，雾的密度是随着距离线性增大的
	// Fog(color: Integer, near: Float, far: Float);
	scene.fog = new THREE.Fog( `rgb(${fog.r}, ${fog.g}, ${fog.b})`, fog.near, fog.far );
	/* 雾 - end - */
	/* 场景 - end - */

	/* 半球光 - start - */
	// 光源直接放置于场景上，光罩颜色从天空光纤颜色渐变到地面光线颜色。
	// 半球光不能投射阴影
	// HemisphereLight(skyColor: Integer, groundColor: Integer, intensity: Float)
	// skyColor - 天空中发出光线的颜色
	// groundColor - 地面发出光线的颜色
	// intensity - 光照强度 默认： 1
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
	hemiLight.position.set( 0, 20, 0 );
	// scene.add( hemiLight );
	/* 半球光 - end - */

	/* 平行光 - start - */
	// 平行光是沿着特定方向发射的光。这种光的表现像是无限远，从它发出的光线都是平行的。常用来模拟太阳光的效果
	// 平行光可以投影
	// DirectionalLight(color: Intrget, intensity: Float)
	// intensity - 光照强度
	var dirLight = new THREE.DirectionalLight( 0xffffff );
	dirLight.position.set( - 3, 10, - 10 );
	// 动态阴影。需要调整到阴影看起来正确
	dirLight.castShadow = true;
	// DirectionalLightShadow
	// 用于 DirectionalLights 内部计算阴影
	// shadow.camera 用于生成场景的深度图。从光的角度来看，其他物体背后的物体将处于阴影中
	dirLight.shadow.camera.top = 2;
	dirLight.shadow.camera.bottom = - 2;
	dirLight.shadow.camera.left = - 2;
	dirLight.shadow.camera.right = 2;
	dirLight.shadow.camera.near = 0.1;
	dirLight.shadow.camera.far = 40;
	scene.add( dirLight );
	// 为阴影相机创建一个助手(可选)
	// scene.add( new CameraHelper( dirLight.shadow.camera ) );
	/* 平行光 - end - */

	/* 网格 - start - */
	// 表示基于以三角形为 polygon mesh (多边形网格)的物体的类。同时也作为其他类的基类
	// Mesh(geometry: Geometry, material: Material)
	// geometry - Geometry或者BufferGeometry的实例，默认值是一个新的BufferGeometry。
	// material - 一个Material，或是一个包含有Material的数组，默认是一个新的MeshBasicMaterial。

	/* 几何体 - start - */
	// PlaneBufferGeometry(width: Float, height: Float, widthSegments: Integer, heightSegments: Integer)
	// width - 平面沿着x轴的宽度 默认：1
	// height - 平面沿着y轴的宽度 默认：1
	// widthSegments - 平面的宽度分段数 默认：1
	// heightSegments - 平面的高度分段数 默认：1
	/* 几何体 - end - */

	/* Phong网格材质 - start - */
	// 一种用于具有镜面高光的光泽表面材质
	// MeshPhongMaterial(parameters: Object)
	// parameters - 用于定义材质外观的对象，具有一个或多个属性。材质的任何属性都可以从此处插入
	/* Phong网格材质 - end - */

	// 在该项目内为地板
	var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	mesh.rotation.x = - Math.PI / 2;
	mesh.receiveShadow = true;
	// scene.add( mesh );
	/* 网格 - end - */

	/* 模型加载器 - start - */
	// glTF（GL传输格式）是一种 开放格式规范，用于有效交付和加载3D内容。、
	// 资产可以JSON（.gltf）或二进制（.glb）格式提供。外部文件存储纹理（.jpg，.png）和其他二进制数据（.bin）。
	// glTF资产可以传递一个或多个场景，包括网格，材质，纹理，外观，骨骼，变形目标，动作，灯光和/或相机。
	var loader = new GLTFLoader();
	
	// .load(url: String, onLoad: Function, onProgress: Function, onError: Function)
	// url - 包含.gltf或.glb文件的路径/ URL的字符串。
	// onLoad - 成功完成加载后要调用的函数。该函数接收从parse返回的已加载JSON响应。
	// onProgress - 在加载过程中要调用的函数。参数将是XMLHttpRequest实例，其中包含。总计和。已加载的字节。
	// onError -（可选）如果在加载过程中发生错误则要调用的函数。该函数接收错误作为参数
	loader.load( './model/figure/Soldier.glb', function ( gltf ) {
		model = gltf.scene;
		scene.add( model );

		model.traverse( function ( object ) {
			if ( object.isMesh ) object.castShadow = true;
		} );

		/* 辅助对象 - start - */
		// SkeletonHelper(object)
		// object - 可以是任何拥有一组骨 Bone 作为子对象的对象
		// 用来模拟骨骼 Skeleton 的辅助对象，该辅助对象使用 LineBasicMaterial 材质
		skeleton = new THREE.SkeletonHelper( model );
		// 隐藏骨骼线
		skeleton.visible = false;
		scene.add( skeleton );
		/* 辅助对象 - end - */
	} );
	/* 模型加载器 - end - */

	/* 渲染器 - start - */
	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );
	renderer.setClearColor( 0x000000, 0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setSize( env.canvesWidth, env.canvesHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );
	/* 渲染器 - start - */
	container.appendChild( stats.dom );
}