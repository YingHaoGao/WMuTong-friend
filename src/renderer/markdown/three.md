## 摄像机

### ArrayCamera - 摄像机阵列

```
说明： ArrayCamera 用于更加高效的使用一组已经预定义的摄像机来渲染一个场景。这将能够更好的提升VR场景的渲染性能。
	一个 ArrayCamera 的实例中总是包含着一组子摄像机，应当为每一个子摄像机定义viewport(边界)属性，这一属性决定了由该子摄像机所渲染的视口区域的大小。

```

#### 语法
	
	new THREE.ArrayCamera( array );

#### 示例
	
	[ArrayCamera 使用示例](http://www.yanhuangxueyuan.com/threejs/examples/#webgl_camera_array)

### Camera - 摄像机(注意：这个类并不是被直接调用的)

#### 属性
	
	* .isCamera: Boolean
		> 用来检查这个类或者派生的类是否是摄像机

	* .layers: Layers
		> 摄像机是一个 layers 的成员。 当摄像机的视点被渲染的时候，物体必须和当前被看到的摄像机共享至少一个层。

	* .matrixWorldInverse: Matrix4
		> 这是 matrixWorl 矩阵的逆矩阵。 MatrixWorld 包含了相机的世界变换矩阵。

	* .projectionMatrix: Matrix4
		> 投影变换矩阵

	* .projectionMatrixInverse: Matrix4
		> 投影变换矩阵的逆矩阵

#### 方法

	* .clone(): Camera 克隆
		> 返回一个具有和当前相机的属性一样的新的相机

	* .copy(source: Camera, recursive: Boolean): Camera 复制
		> 将源摄像机(source)的属性复制到新的摄像机中

	* .getWorldDirection(target: Vector3): Vector3
		> target —— 调用该函数的结果将赋值给该 Vector3 对象
		> 返回一个能够表示当前摄像机所正视的射界空间方向的 Vector3 对象。(注意：摄像机俯视时，其Z轴坐标为负数)

### CubeCamera - 立方相机

```
说明： 创立6个摄像机，并将它们所拍摄的场景渲染到 WebGLRenderTargetCube 上
```
#### 构造器

```
	CubeCamera(near: Number, far: Number, cubeResolution: Number)

		near —— 远剪切面的距离
		far —— 近剪切面的距离
		cubeResolution —— 设置立方体边缘的长度

		说明： 构造一个包含6个PerspectiveCameras（透视摄像机）的立方摄像机，并将其拍摄的场景渲染到一个WebGLRenderTargetCube上。
```

#### 属性

	* .renderTarget: WebGLRenderTargetCube
		> 生成的立方体纹理保存在其中的.texture对象中，可作为贴图赋值给其他材质

#### 方法

	* .update(renderer: WebGLRenderer, scene: Scene): null
		> renderer —— 当前的webGL渲染器
		> scene —— 当前的场景
		> 这个方法用来更新 renderTarget (渲染目标对象)

	* clear(renderer: WebGLRenderer, color: Boolean, depth: Boolean, stencil: Boolean): null
		> 这个方法用来清除 renderTarget 的颜色、深度或模板缓冲区。 颜色缓冲区设置为渲染器当前的“清除”色。 
		> 参数默认都是 true

#### 示例

	[CubeCamera 使用示例](http://www.yanhuangxueyuan.com/threejs/examples/#webgl_camera_array)

### OrthographicCamera - 正交相机

```
说明： 这一摄像机使用 orthographic projection (正交投影)来进行投影。
	在这种投影模式下，无论物体距离相机距离远或者近，在最终渲染的图片中物体的大小都保持不变。
	这对于渲染2D场景或者UI元素非常有用。
```

#### 构造器

```
	OrthographicCamera(left: Number, right: Number, top: Number, bottom: Number, near: Number, far: Number)

		left — 摄像机视锥体左侧面。
		right — 摄像机视锥体右侧面。
		top — 摄像机视锥体上侧面。
		bottom — 摄像机视锥体下侧面。
		near —— 远剪切面的距离
		far —— 近剪切面的距离

		说明： 这些参数一起定义了摄像机的viewing frustum（视锥体）。
```

#### 属性

	* .top: Float
		> 摄像机视锥体上侧

	* .right: Float
		> 摄像机视锥体右侧
		
	* .bottom: Float
		> 摄像机视锥体下侧
		
	* .left: Float
		> 摄像机视锥体左侧

	* .far: Float
		> 摄像机视锥体远端面，默认： 2000
		> 其取值范围： near ~ 无穷大

	* .near: Float
		> 摄像机视锥体近端面，默认： 0.1
		> 其取值范围： 0 ~ far
		> 请注意，和PerspectiveCamera不同，0对于OrthographicCamera的近端面来说是一个有效值。

	* .isOrthographicCamera: Boolean
		> 测试该类或派生类是否为 OrthographicCamera

	* .view: Object
		> 这个值是由 setViewOffset 来设置的，默认：null

	* .zoom: Number
		> 获取或者这只摄像机的缩放背书，默认：1

#### 方法

	* .setViewOffset(fullWidth: Float, fullHeight: Float, x: Float, y: Float, width: Float, height: Float): null
		> fullWidth — 多视图的全宽设置
		> fullHeight — 多视图的全高设置
		> x — 副摄像机的水平偏移
		> y — 副摄像机的垂直偏移
		> width — 副摄像机的宽度
		> height — 副摄像机的高度
		> 说明： 在较大的 viewing frustum (视锥体)中设置偏移量，对于多窗口或者多显示器的设置是很有用的。
		> [[CubeCamera 使用示例](http://www.yanhuangxueyuan.com/threejs/examples/#webgl_camera_array)](http://www.yanhuangxueyuan.com/threejs/examples/#webgl_camera_array)

	* .clearViewOffset()