### 项目结构

	+ build: 第三方js依赖
	+ css: css文件
		+ index: 主要样式
	+ js: js文件
		+ index: 主代码
		+ os: 系统os模块相关
		+ scene: 创建模型相关
	+ lib_exe: 第三方exe依赖
	+ markdown: 描述相关的md文件
	+ model: 3D模型
	+ personate: 拟人相关
		+ body: 身体相关（体力、饱食度...）
		+ character: 性格相关
			+ calc: 性格计算
			+ mold: 性格相关因素文件，组件性
				+ xx.js: 显性属性模块
				+ _xx.js: 隐性属性模块
			+ index.md: 
		+ emotion: 情绪相关
		+ hobby: 爱好相关
		+ need: 需求相关
		+ emotion.md: 拟人相关思路
	+ util: 工具类js

### 模拟器

	+ 每个情绪、性格等都是一个可拆装的“属性模块”

### 名词

	+ 模拟器：整体的拟人功能，也可以理解为就是一个虚拟的整体的人。
	+ 属性模块控制器：情绪、性格等拟人功能的算法js，就是calc.js，负责把该类别下的所有属性模块添加到算法中，并根据需要修改属性模块内的属性值，并等处相应的计算结果，比如：情绪中的calc.js，负责将mold下的所有js文件整合计算，并且重新赋值。
	+ 属性模块：情绪、性格等拟人算法中的一个具体的属性js，主要存储：该属性的value、该属性可以影响的其他属性、可以影响该属性的属性、影响规则等，比如：情绪中的“高兴”，就是一个模拟模块。
	+ 显性属性模块：mold下文件名不带有“_”前缀的属性模块。
	+ 隐性属性模块：mold下文件名带有“_”前缀的属性模块。
	+ 显性属性：模拟器最常表现出来的，明显的属性，比如：“开朗”、“幽默”。显性属性的特点：
		+ 反应强度高
		+ 反应速度快
		+ 影响时间较短
		+ 显性属性容易发生变化
		+ 对原始属性影响小
	+ 隐性属性：模拟器不经常表现出来的，显性属性部分受隐形属性影响，比如：“胆小”。隐性属性的特点：
		+ 反应强度低
		+ 反应速度慢
		+ 影响时间长
		+ 不容易发生变化
		+ 对原始属性影响大
	+ 原始属性值：模拟器初始带有的标签属性，原始属性是模拟器的根本属性，会影响模拟器所有的计算结果，不易改变，需要长时间或者较大刺激。
	+ 属性：模拟器固定的几个大模块，目前包含：
		+ 身体：相等于人的躯体
		+ 性格：就是人的性格，“开朗”、“幽默”等
		+ 情绪：“高兴”、“悲伤”等
		+ 需求：“吃饭”、“喝水”、“休息”等
		+ 爱好：“游戏”、“唱歌”等