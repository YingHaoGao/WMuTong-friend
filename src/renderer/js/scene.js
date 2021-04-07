import * as THREE from '../build/three.module.js';

import Stats from '../build/stats.module.js';
import { GUI } from '../build/dat.gui.module.js';

import { GLTFLoader } from '../build/loaders/GLTFLoader.js';

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

		// 控制面板
		createPanel();


		// 模型包含的动作列表
		var animations = gltf.animations;

		/* 动作 - start - */
		// 公话混合器是用于场景中特定对象的动作的播放器。当场景中的多个对象独立动作时，每个对象都可以使用同一个动作混合器。
		// AnimationMixer(rootObject: Object3D)
		// rootObject - 混合器播放的动作所属的对象
		mixer = new THREE.AnimationMixer( model );

		// .clipAction(clip: AnimationClip, optionalRoot: Object3D): AnimationAction
		// 返回所传入的剪辑参数的AnimationAction, 根对象参数可选，默认值为混合器的默认根对象。第一个参数可以是动作剪辑(AnimationClip)对象或者动作剪辑的名称。
		// 如果不存在符合传入的剪辑和根对象这两个参数的动作, 该方法将会创建一个。传入相同的参数多次调用将会返回同一个剪辑实例。

		// AnimationAction(mixer: AnimationMixer, clip: AnimationClip, localRoot: Object3D)
		// mixer - 被此动作控制的 *动作混合器*
		// clip - *动作剪辑* 保存了此动作当中的动作数据
		// localRoot - 动作执行的根对象
		// AnimationActions 用来调度存储在AnimationClips中的动作。
		// 不要直接调用这个构造函数，而应该先用AnimationMixer.clipAction实例化一个AnimationAction,
		// 因为这个方法提供了缓存以提高性能。
		// 闲置动作
		idleAction = mixer.clipAction( animations[ 0 ] );
		// 步行动作
		walkAction = mixer.clipAction( animations[ 3 ] );
		// 奔跑动作
		runAction = mixer.clipAction( animations[ 1 ] );
		// 模型动作列表
		actions = [ idleAction, walkAction, runAction ];

		// 初始化动作权重并激活所有动作
		activateAllActions();

		animate();
		/* 动作 - end - */
	} );
	/* 模型加载器 - end - */

	/* 渲染器 - start - */
	renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
	renderer.setClearColor( 0x000000, 0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	// renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setSize( env.canvesWidth, env.canvesHeight );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );
	/* 渲染器 - start - */

	stats = new Stats();
	container.appendChild( stats.dom );

	window.addEventListener( 'resize', onWindowResize, false );

}

// 创建 GUI 控制面板
function createPanel() {
	// 创建宽度为 310px 的控制面板
	var panel = new GUI( { width: 310, opacity: 0.5 } );

	// 给控制面板设置 id
	panel.domElement.id = 'gui';

	// panel.addFolder(name): gui
	// 创建一个新的子文件夹GUI实例。
	// 返回子文件夹
	var folder1 = panel.addFolder( 'Visibility' );
	var folder2 = panel.addFolder( 'Activation/Deactivation' );
	var folder3 = panel.addFolder( 'Pausing/Stepping' );
	var folder4 = panel.addFolder( 'Crossfading' );
	var folder5 = panel.addFolder( 'Blend Weights' );
	var folder6 = panel.addFolder( 'General Speed' );
	var folder7 = panel.addFolder( 'Camera lookAt' );
	var folder8 = panel.addFolder( 'Camera position' );
	var folder9 = panel.addFolder( 'Fog rgb' );
	var folder10 = panel.addFolder( 'hemiLight position' );

	// 控制面板内控制的初始数据
	settings = {
		'show model': true,
		'show skeleton': false,
		'deactivate all': deactivateAllActions,
		'activate all': activateAllActions,
		'pause/continue': pauseContinue,
		'make single step': toSingleStepMode,
		'modify step size': 0.05,
		'from walk to idle': function () {

			prepareCrossFade( walkAction, idleAction, 1.0 );

		},
		'from idle to walk': function () {

			prepareCrossFade( idleAction, walkAction, 0.5 );

		},
		'from walk to run': function () {

			prepareCrossFade( walkAction, runAction, 2.5 );

		},
		'from run to walk': function () {

			prepareCrossFade( runAction, walkAction, 5.0 );

		},
		'use default duration': true,
		'set custom duration': 3.5,
		'modify idle weight': 0.0,
		'modify walk weight': 1.0,
		'modify run weight': 0.0,
		'modify time scale': 1.0,
		'注视坐标x': lookAt.x,
		'注视坐标y': lookAt.y,
		'注视坐标z': lookAt.z,
		'相机坐标x': cameraPosition.x,
		'相机坐标y': cameraPosition.y,
		'相机坐标z': cameraPosition.z,
		'Fog r': fog.r,
		'Fog g': fog.g,
		'Fog b': fog.b,
		'Fog near': fog.near,
		'Fog far': fog.far,
		'HemiLight x': hemiLightPosition.x,
		'HemiLight y': hemiLightPosition.y,
		'HemiLight z': hemiLightPosition.z,
	};

	// gui.add(object: Object, property: String, [min:Number], [max: Number], [step: Number]) => controller
	// object - 要操作的对象
	// property - 要操作对象的key
	// min ~ max - 控制器取值返回 最小值 ~ 最大值
	// step - 控制器数值修改跨度

	// controller.onChange(fn)
	// 控制器数值改变的回调函数
	folder1.add( settings, 'show model' ).onChange( showModel );
	folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
	folder2.add( settings, 'deactivate all' );
	folder2.add( settings, 'activate all' );
	folder3.add( settings, 'pause/continue' );
	folder3.add( settings, 'make single step' );
	folder3.add( settings, 'modify step size', 0.01, 0.1, 0.001 );
	crossFadeControls.push( folder4.add( settings, 'from walk to idle' ) );
	crossFadeControls.push( folder4.add( settings, 'from idle to walk' ) );
	crossFadeControls.push( folder4.add( settings, 'from walk to run' ) );
	crossFadeControls.push( folder4.add( settings, 'from run to walk' ) );
	folder4.add( settings, 'use default duration' );
	folder4.add( settings, 'set custom duration', 0, 10, 0.01 );
	folder5.add( settings, 'modify idle weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

		setWeight( idleAction, weight );

	} );
	folder5.add( settings, 'modify walk weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

		setWeight( walkAction, weight );

	} );
	folder5.add( settings, 'modify run weight', 0.0, 1.0, 0.01 ).listen().onChange( function ( weight ) {

		setWeight( runAction, weight );

	} );
	folder6.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );
	folder7.add( settings, '注视坐标x', 0.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setLookAt(weight, 'x');

	} );
	folder7.add( settings, '注视坐标y', 0.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setLookAt(weight, 'y');

	} );
	folder7.add( settings, '注视坐标z', 0.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setLookAt(weight, 'z');

	} );
	folder8.add( settings, '相机坐标x', -3.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setCameraPosition(weight, 'x');

	} );
	folder8.add( settings, '相机坐标y', -3.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setCameraPosition(weight, 'y');

	} );
	folder8.add( settings, '相机坐标z', -3.0, 3.0, 0.01 ).listen().onChange( function ( weight ) {

		setCameraPosition(weight, 'z');

	} );
	folder9.add( settings, 'Fog r', 0, 255, 1 ).listen().onChange( function ( weight ) {

		setFog(weight, 'r');

	} );
	folder9.add( settings, 'Fog g', 0, 255, 1 ).listen().onChange( function ( weight ) {

		setFog(weight, 'g');

	} );
	folder9.add( settings, 'Fog b', 0, 255, 1 ).listen().onChange( function ( weight ) {

		setFog(weight, 'b');

	} );
	folder9.add( settings, 'Fog near', 0, 100, 1 ).listen().onChange( function ( weight ) {

		setFog(weight, 'near');

	} );
	folder9.add( settings, 'Fog far', 0, 100, 1 ).listen().onChange( function ( weight ) {

		setFog(weight, 'far');

	} );
	folder10.add( settings, 'HemiLight x', -100, 100, 1 ).listen().onChange( function ( weight ) {

		setHemiLightPosition(weight, 'x');

	} );
	folder10.add( settings, 'HemiLight y', -100, 100, 1 ).listen().onChange( function ( weight ) {

		setHemiLightPosition(weight, 'y');

	} );
	folder10.add( settings, 'HemiLight z', -100, 100, 1 ).listen().onChange( function ( weight ) {

		setHemiLightPosition(weight, 'z');

	} );

	// folder1.open();
	// folder2.open();
	// folder3.open();
	// folder4.open();
	// folder5.open();
	// folder6.open();

	crossFadeControls.forEach( function ( control ) {

		control.classList1 = control.domElement.parentElement.parentElement.classList;
		control.classList2 = control.domElement.previousElementSibling.classList;

		control.setDisabled = function () {

			control.classList1.add( 'no-pointer-events' );
			control.classList2.add( 'control-disabled' );

		};

		control.setEnabled = function () {

			control.classList1.remove( 'no-pointer-events' );
			control.classList2.remove( 'control-disabled' );

		};

	} );

}

// 是否展示模型
function showModel( visibility ) {

	model.visible = visibility;

}

// 是否展示骨骼
function showSkeleton( visibility ) {

	skeleton.visible = visibility;

}


function modifyTimeScale( speed ) {

	mixer.timeScale = speed;

}


function deactivateAllActions() {

	actions.forEach( function ( action ) {

		action.stop();

	} );

}

// 初始化动作权重并激活所有动作
function activateAllActions() {
	// 设置动作的权重为初始值
	setWeight( idleAction, settings[ 'modify idle weight' ] );
	setWeight( walkAction, settings[ 'modify walk weight' ] );
	setWeight( runAction, settings[ 'modify run weight' ] );

	actions.forEach( function ( action ) {
		// animationAction.play(): AnimationAction
		// 让混合器激活动作
		// 动作激活并不是马上开始动作，会受到 paused、enabled、weight、timeScale 属性的影响
		action.play();

	} );

}

function pauseContinue() {

	if ( singleStepMode ) {

		singleStepMode = false;
		unPauseAllActions();

	} else {

		if ( idleAction.paused ) {

			unPauseAllActions();

		} else {

			pauseAllActions();

		}

	}

}

function pauseAllActions() {

	actions.forEach( function ( action ) {

		action.paused = true;

	} );

}

// 设置所有动作都不是在暂停状态
function unPauseAllActions() {

	actions.forEach( function ( action ) {

		action.paused = false;

	} );

}

function toSingleStepMode() {

	unPauseAllActions();

	singleStepMode = true;
	sizeOfNextStep = settings[ 'modify step size' ];

}

// 切换动作
function prepareCrossFade( startAction, endAction, defaultDuration ) {
	// 判断使用 配置的持续时间 还是使用 控制面板设置的持续时间
	var duration = setCrossFadeDuration( defaultDuration );

	// 确保我们没有在单步模式下运行，并且所有的动作都是未暂停的
	singleStepMode = false;
	unPauseAllActions();

	// 如果当前动作是“闲置”的话，马上执行切换的动作
	// 否则等待当前动作执行完毕后再执行切换的动作
	if ( startAction === idleAction ) {
		executeCrossFade( startAction, endAction, duration );
	} else {
		synchronizeCrossFade( startAction, endAction, duration );
	}

}

// 判断使用 配置的持续时间 还是使用 控制面板设置的持续时间
function setCrossFadeDuration( defaultDuration ) {
	// 获取控制面板是否选择了使用配置的持续时间
	if ( settings[ 'use default duration' ] ) {
		return defaultDuration;
	} else {
		return settings[ 'set custom duration' ];
	}

}

// 等待当前执行动作结束后再切换动作
function synchronizeCrossFade( startAction, endAction, duration ) {
	// 动作混合器添加 单次循环结束 的事件监听
	mixer.addEventListener( 'loop', onLoopFinished );

	function onLoopFinished( event ) {
		// 确保当前结束的动作与需要执行的切换前的动作一致
		if ( event.action === startAction ) {
			// 移除事件监听
			mixer.removeEventListener( 'loop', onLoopFinished );
			// 马上切换动作
			executeCrossFade( startAction, endAction, duration );

		}

	}

}

// 马上切换动作
function executeCrossFade( startAction, endAction, duration ) {

	// 不仅开始动作，而且结束动作的权重都必须为1
	// (关于开始操作，这在这里已经得到了保证)
	setWeight( endAction, 1 );
	endAction.time = 0;

	// Crossfade with翘曲-你也可以通过设置第三个参数为false来尝试不翘曲
	// AnimationAction.crossFadeTo(fadeInAction: AnimationAction, durationInSeconds: AnimationAction, warpBoolean: Boolean): AnimationAction
	// 在传入的时间段内, 让此动作淡出（fade out），同时让另一个动作淡入
	// 如果warpBoolean值是true, 额外的 warping (时间比例的渐变)将会被应用。
	// fadeInAction - 需要淡入的动作对象
	// durationInSeconds - 淡入动作过度时间

	startAction.crossFadeTo( endAction, duration, true );

}

// 这个函数是必需的，因为animationAction.crossFadeTo()禁用了它的开始动作，
// 并将开始动作的时间尺度设置为((开始动作的持续时间)/(结束动作的持续时间))
function setWeight( action, weight ) {
	// animationAction.weight: Number
	// 动作的影响程度(取值范围[0,1])，0 无影响到 1 完全影响 之间的值可以用来混合多个动作
	// 理解： A 动作执行的同时， B 动作对 A 多做的影响

	// animationAction.enabled: Boolean
	// 设置为 false 会禁用动作，也就是无效，默认 true
	// 当enabled被重新置为true, 动作将从当前时间（time）继续 (将 enabled 置为 false 不会重置此次动作)
	// 说明: 将enabled置为true不会让动作自动重新开始。
	// 只有满足以下条件时才会马上重新开始: 暂停（paused）值为false, 
	// 同时动作没有失效 (执行停止(stop)命令或重置(reset)命令， 且权重(weight)和时间比例(timeScale)都不能为0
	action.enabled = true;
	// animationAction.setEffectiveTimeScale(timeScale: Number): AnimationAction
	// 设置时间比例（timeScale）以及停用所有的变形。该方法可以链式调用
	action.setEffectiveTimeScale( 1 );
	// animationAction.setEffectiveWeight(weight: Number): AnimationAction
	// 设置权重 weight 以及停止所有淡入淡出。该方法可以链式调用
	action.setEffectiveWeight( weight );
}

function setLookAt( weight, key ) {

	lookAt[key] = weight;
	camera.lookAt( lookAt.x, lookAt.y, lookAt.z );

}

function setCameraPosition( weight, key ) {

	cameraPosition[key] = weight;
	camera.position.set( cameraPosition.x, cameraPosition.y, cameraPosition.z );

}

function setFog( weight, key ) {

	fog[key] = weight;
	scene.fog = new THREE.Fog( `rgb(${fog.r}, ${fog.g}, ${fog.b})`, fog.near, fog.far );

}

function setHemiLightPosition( weight, key ) {

	hemiLightPosition[key] = weight;
	hemiLight.position.set( hemiLightPosition.x, hemiLightPosition.y, hemiLightPosition.z );

}


// 将”面板“设置的权重值更新到变量
function updateWeightSliders() {
	settings[ 'modify idle weight' ] = idleWeight;
	settings[ 'modify walk weight' ] = walkWeight;
	settings[ 'modify run weight' ] = runWeight;
}

// Called by the render loop

function updateCrossFadeControls() {

	crossFadeControls.forEach( function ( control ) {

		control.setDisabled();

	} );

	if ( idleWeight === 1 && walkWeight === 0 && runWeight === 0 ) {

		crossFadeControls[ 1 ].setEnabled();

	}

	if ( idleWeight === 0 && walkWeight === 1 && runWeight === 0 ) {

		crossFadeControls[ 0 ].setEnabled();
		crossFadeControls[ 2 ].setEnabled();

	}

	if ( idleWeight === 0 && walkWeight === 0 && runWeight === 1 ) {

		crossFadeControls[ 3 ].setEnabled();

	}

}

function onWindowResize() {

	// camera.aspect = window.innerWidth / window.innerHeight;
	camera.aspect = env.canvesWidth / env.canvesHeight;
	camera.updateProjectionMatrix();

	// renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setSize( env.canvesWidth, env.canvesHeight );

}

function animate() {

	// requestAnimationFrame(Function): frameId
	// 请求动作帧
	// 系统决定回调函数的执行时机。60Hz的刷新频率，那么每次刷新的间隔中会执行一次回调函数，不会引起丢帧，不会卡顿
	// cancelAnimationFrame(frameId)
	// 停止 requestAnimationFrame 动作
	requestAnimationFrame( animate );

	// AnimationAction.getEffectiveWeight(): Number
	// 返回影响权重
	idleWeight = idleAction.getEffectiveWeight();
	walkWeight = walkAction.getEffectiveWeight();
	runWeight = runAction.getEffectiveWeight();

	// 将”面板“设置的权重值更新到变量
	updateWeightSliders();

	// 根据当前的权重值启用/禁用交叉褪色控件
	updateCrossFadeControls();

	// 获取从最后一帧开始所经过的时间，用于混频器更新(如果不是在单步模式)
	// 获取自 oldTime 设置后到当前的秒数。 同时将 oldTime 设置为当前时间。
	// 如果 autoStart 设置为 true 且时钟并未运行，则该方法同时启动时钟。
	var mixerUpdateDelta = clock.getDelta();

	// 如果在单步模式下，只做一步，然后什么都不做(直到用户再次单击）

	if ( singleStepMode ) {

		mixerUpdateDelta = sizeOfNextStep;
		sizeOfNextStep = 0;

	}

	// 更新动作混合器，统计面板，并渲染这个框架

	mixer.update( mixerUpdateDelta );

	stats.update();

	renderer.render( scene, camera );

}