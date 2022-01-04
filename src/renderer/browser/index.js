let nWs = new WebSocket('ws://localhost:12122/');
let workTypes = { "流程图": "flow", "思维导图": "mind", "思维笔记": "outline", "从模板新建": "template" };
let homeWeb = false;
let tabGroup = false;
let tabGroupExtend = false;
let maxTab = 100;
let tabTimeoutMin = 1000;
let tabTimeoutMax = 60000;
let httpUrl = `http://91porn.com/v.php?next=watch&min_duration=5`;

// 标签翻页功能
let tabTurning = {
    // 中间显示的 tab 个数
    center: 10,
    $con: null,
    left: {},
    right: {},
    removeTabedDetectionTime: null,
    init: function() {
        this.$con = $(".etabs-tabs");
        this.left = {show: false, $dom: $(".tab_turn.left")};
        this.right = {show: false, $dom: $(".tab_turn.right")};

        // 向左翻页
        tabTurning.left.$dom.off().on("click", function(e) {
            e.stopPropagation();
            tabTurning.rightHide();
            tabTurning.leftShow();
        });
        // 向右翻页
        tabTurning.right.$dom.off().on("click", function(e) {
            e.stopPropagation();
            tabTurning.leftHide();
            tabTurning.rightShow();
        });
    },
    // left、right 定位
    location: function() {
        if(!homeWeb) return;
        let homeLeft = $(homeWeb.tab).offset().left;
        let homeWidth = $(homeWeb.tab).outerWidth();
        let addBtnLeft = $(".etabs-buttons").offset().left;

        tabTurning.left.$dom.css({left: `${homeLeft + homeWidth}px`});
        // tabTurning.right.$dom.css({left: `${addBtnLeft}px`});
    },
    // 加入标签后检测
    addTabedDetection: function(tab) {
        let tabsLen = tabTurning.$con.find(".etabs-tab.visible:not(.homeTab)").length;
        let tabsShowLen = tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab)").length;
        let leftHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length;
        let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

        // 首次、左侧没有隐藏：tabsLen > center -> leftHide
        // tabsLen 已经大于 center：tabsLen:not(.hide) > center -> leftHide
        // tabsRight > 0: tab 插入到中间的最后一个位置，并且 leftHide
        if(tabsShowLen > tabTurning.center) {
            tabTurning.leftHide();
        }
        if(rightHideLen) tabTurning.repositionCenterLast(tab);

        tabTurning.location();
        tabTurning.directionIconDetection();
    },
    // 删除标签后检测
    removeTabedDetection: function() {
        let tabsLen = tabTurning.$con.find(".etabs-tab.visible:not(.homeTab)").length;
        let tabsShowLen = tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab)").length;
        let leftHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length;
        let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

        // 首次、左侧没有隐藏：tabsLen > center -> leftHide
        // tabsLen 已经大于 center：tabsLen:not(.hide) > center -> leftHide
        // tabsRight > 0: tab 插入到中间的最后一个位置，并且 leftHide
        if(leftHideLen) tabTurning.leftShow();
        else if(rightHideLen) tabTurning.rightShow();

        tabTurning.directionIconDetection();
    },
    // 加入标签后检测
    addTabedDetection_: function(tab) {
        let tabsLen = tabTurning.$con.find(".etabs-tab.visible:not(.homeTab)").length;
        // let tabsShowLen = tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab)").length;
        let tabsShowLen = tabTurning.$con.find(".etabs-tab:not(.hide):not(.homeTab)").length;
        let leftHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length;
        let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

        // 首次、左侧没有隐藏：tabsLen > center -> leftHide
        // tabsLen 已经大于 center：tabsLen:not(.hide) > center -> leftHide
        // tabsRight > 0: tab 插入到中间的最后一个位置，并且 leftHide
        if(tabsShowLen > tabTurning.center) {
            if(rightHideLen) tabTurning.repositionCenterLast(tab);
            if(tabTurning.removeTabedDetectionTime) {
                clearTimeout(tabTurning.removeTabedDetectionTime);
                tabTurning.removeTabedDetectionTime = null;
            }
            else if(!window.aa) {
                console.log("leftHide")
                tabTurning.leftHide();
            }
        }

        console.log("新增", new Date().getTime())
        tabTurning.location();
        tabTurning.directionIconDetection();
    },
    // 删除标签后检测
    removeTabedDetection_: function() {
        tabTurning.removeTabedDetectionTime = setTimeout(() => {
            let tabsLen = tabTurning.$con.find(".etabs-tab.visible:not(.homeTab)").length;
            let tabsShowLen = tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab)").length;
            let leftHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length;
            let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

            // 首次、左侧没有隐藏：tabsLen > center -> leftHide
            // tabsLen 已经大于 center：tabsLen:not(.hide) > center -> leftHide
            // tabsRight > 0: tab 插入到中间的最后一个位置，并且 leftHide
            if(leftHideLen) tabTurning.leftShow();
            else if(rightHideLen) tabTurning.rightShow();
            console.log("删除", new Date().getTime())

            tabTurning.directionIconDetection();

            tabTurning.removeTabedDetectionTime = null;
        }, 100);
    },
    // 把新添加的 tab 标签定位到 center 区域最后位置
    repositionCenterLast: function(tab) {
        let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

        rightHideLen += 1;
        tab.setPosition(-rightHideLen);
    },
    // 检测方向按钮显示
    directionIconDetection: function() {
        let leftHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length;
        let rightHideLen = tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length;

        if(leftHideLen) tabTurning.left.$dom.show();
        else tabTurning.left.$dom.hide();

        if(rightHideLen) tabTurning.right.$dom.show();
        else tabTurning.right.$dom.hide();
    },
    // 左侧隐藏一个tab
    leftHide: function() {
        tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab):first")
            .removeClass("show").addClass("hide").attr("data-d", "left");
        tabTurning.directionIconDetection();
    },
    // 左侧显示一个tab
    leftShow: function() {
        if(tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]").length <= 0) return;

        tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=left]:last")
            .removeClass("hide").addClass("show").removeAttr("data-d");
        tabTurning.directionIconDetection();
    },
    // 右侧隐藏一个tab
    rightHide: function() {
        tabTurning.$con.find(".etabs-tab.visible:not(.hide):not(.homeTab):last")
            .removeClass("show").addClass("hide").attr("data-d", "right");
        tabTurning.directionIconDetection();
    },
    // 右侧显示一个tab
    rightShow: function() {
        if(tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]").length <= 0) return;

        tabTurning.$con.find(".etabs-tab.visible.hide:not(.homeTab)[data-d=right]:first")
            .removeClass("hide").addClass("show").removeAttr("data-d");
        tabTurning.directionIconDetection();
    }
};

let oldUtil = function(tab) {
    let imgShow = localStorage.getItem("imgShow");

    pageTitle = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

    if(imgShow) {
        tab.webview.executeJavaScript(`
            const script=document.createElement("script");
            script.type="text/javascript";
            script.src="https://code.jquery.com/jquery-1.12.4.min.js";
            script.onload = function() {
                $('img').css('display', 'block');
                $('iframe').css('display', 'block');
                $('.vjs-poster').css({ 'display': 'block' });
                $('video').css({ 'visibility': 'initial' });
                $('#webview-img-show').css({ 'display': 'block' });
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        `);
    } else {
        tab.webview.executeJavaScript(`
            const script=document.createElement("script");
            script.type="text/javascript";
            script.src="https://code.jquery.com/jquery-1.12.4.min.js";
            script.onload = function() {
                $('img').css('display', 'none');
                $('iframe').css('display', 'none');
                $('.vjs-poster').css({ 'display': 'none' });
                $('video').css({ 'visibility': 'hidden' });
                $('#webview-img-show').css({ 'display': 'none' });
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        `);
    }

    var interval;
    // 访问的页面 title
    var pageTitle;
    // 等待下载的 m3u8 资源集合
    var awaitSourceId = {};

    let getStr = (str = '', start, end) => {
        let res = str.match(new RegExp(`${start}(.*?)${end}`))
        return res ? res[1] : null
    };
    let get_m3u8_responseText = function(xhr) {
        let isM3u8 = xhr.responseURL.match(/.+\.m3u8/);

        if($('html title')){
            pageTitle = $('html title').text();
        }
        else if(document.getElementById("thread_subject")) {
            pageTitle = document.getElementById("thread_subject").innerHTML;
        }
        else {
            pageTitle = new Date().getTime() + "";
        }
        pageTitle = chineseChar2englishChar(pageTitle);
        pageTitle = pageTitle.trim().replace(/[ ]|[\r\n]|-|:|\*|\?|"|\/|\\|\<|\>/g,"");

        if(isM3u8) {
            let awaitLeng = Object.keys(awaitSourceId).length;

            if(xhr.responseText.match('URI="key.key"')) {
                nWs.send(JSON.stringify({
                    id: 'source-url', url: isM3u8[0], title: pageTitle || awaitLeng, key: awaitLeng,
                    // header_url: xhr.responseURL.match
                }));
            }
            else {
                nWs.send(JSON.stringify({
                    id: 'source-str', str: xhr.responseText, title: pageTitle || awaitLeng, key: awaitLeng,
                    // header_url: xhr.responseURL.match
                }));
            }
        }
    }
    // 将中文符号转换成英文符号
    let chineseChar2englishChar = (chineseChar) => {
        // 将单引号‘’都转换成'，将双引号“”都转换成"
        var str = chineseChar.replace(/\’|\‘/g,"'").replace(/\“|\”/g,"\"");
        // 将中括号【】转换成[]，将大括号｛｝转换成{}
        str = str.replace(/\【/g,"[").replace(/\】/g,"]").replace(/\｛/g,"{").replace(/\｝/g,"}");
        // 将逗号，转换成,，将：转换成:
        str = str.replace(/，/g,",").replace(/：/g,":");
        return str;
    };
    let getSource = () => {
        let src = $('source').attr('src');
        let id = '';

        if(src && src != '') {
            src = src.match(/.+\.m3u8/);
            if(!src) return;

            id = getStr(src[0], '/m3u8/', '/');
            if(awaitSourceId[id]) return;
            awaitSourceId[id] = src[0];
        }

        Object.keys(awaitSourceId).map(k => {
            if(awaitSourceId[k] != 'false') {
                let src = awaitSourceId[k];
                let title = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

                if(nWs.readyState === 1) {
                    nWs.send(JSON.stringify({
                        id: 'source-src', src, title, key: k
                    }));
                    awaitSourceId[k] = 'false';
                }
            }
        });
    };

    interval && clearInterval(interval);
    interval = setInterval(() => {
        getSource();
    }, 1000);
};

// 初始化 tabGroup
let initTabGroup = function() {
    // 初始化 tabGroup
    tabGroup = new TabGroup({
        tabContainerSelector: ".etabs-tabs",
        ready(tabGroup) {
            // dragula([tabGroup.tabContainer], {direction: "horizontal"});
        }
    });
    // 绑定添加标签后事件
    tabGroup.on("tab-added", tabTurning.addTabedDetection);
    // 选择首页标签后重新加载列表
    tabGroup.on("tab-active", tab => {
        // if(tab.id == 1) nWs.send(JSON.stringify({ k: "sync", args: [] }));
    });
    // 绑定删除标签后事件
    // tabGroup.on("tab-removed", tabTurning.removeTabedDetection);
    $(".etabs-tabs").off("click").on("click", ".etabs-tab-button-close", tabTurning.removeTabedDetection);
    // 对 tabGroup 进行扩展
    tabGroupExtend = {
        // 修改标签页标签
        "setTitle": (id, t = "") => {
            let tab;
            if(id && id != "") tab = tabGroup.getTab(id);
            else tab = tabGroup.getActiveTab();

            tab.setTitle(t);
        },
        // 添加标签页
        "addTab": (opt = {}) => {
            let startTime = new Date().getTime();

            return new Promise((resolve, reject) => {
                if(!tabGroup) {
                    reject(`[tabGroup]实例不存在`);
                    return;
                }
                let tabLeng = tabGroup.getTabs();
                if(tabLeng.length >= (maxTab + 1)) {
                    new Toast({ msg: "标签已经达到最大数量，请关闭不需要的标签后再试", type: "error" });
                    reject(`[tabGroup]已达到最大数量`);
                    return;
                }

                let options = {
                    title: "首页", src: httpUrl, visible: true, active: true,
                    isReplace: false, type: "httpUrl",
                    webviewAttributes: { nodeintegration: true },
                    ...opt
                };
                let tab_load = false;
                let host = remote.getGlobal("host");
                let options_load = {
                    title: "载入中...", src: "./loading.html", visible: true, active: true
                };
                let loadTimeout = false;
                let presentUrl = "";

                if(options.isReplace) tabGroup.getActiveTab().close();
                tab_load = tabGroup.addTab(options_load);

                options.visible = false;
                options.active = false;
                if(opt.type == "url") {
                    options.src = `${host}${options.src}`;
                    options.webviewAttributes = { nodeintegration: false };
                }
                if(opt.type == "httpUrl") {
                    options.src = `${options.src}`;
                    options.webviewAttributes = { nodeintegration: false };
                }
                let tab = tabGroup.addTab(options);
                let wb = tab.webview;

                // 跳转加载失败标签页
                let skipFailTab = (url) => {
                    if(loadTimeout) {
                        clearTimeout(loadTimeout);
                        loadTimeout = false;
                    }
                    if(tab_load) {
                        tab_load.close(true);
                        tab_load = false;
                    };
                    tab && tab.close();
                    tabGroupExtend.addTab({title: "加载失败", src: `./fail.html?url=${encodeURIComponent(url)}`})
                };
                // 开始加载标签页前的准备
                let startLoadBeforeWork = (url) => {
                    // 给 tab 添加自定义标识
                    if(tab) {
                        $(tab.tab).attr("data-id", tab.id);
                        if(tab.id != 1) {
                            $(tab.tab).attr("data-chartid", remote.getGlobal("params").chartId);
                        }
                    }
                    if(tab && tab.id == 1) {
                        $(tab.tab).addClass("homeTab", tab.id);
                    }
                    wb.openDevTools();

                    oldUtil(tab);

                    if(opt.type == "url" || opt.type == "httpUrl") {
                        // 加载超时跳转加载失败标签页
                        loadTimeout = setTimeout(() => skipFailTab(url), tabTimeoutMax);
                    }
                };
                // 标签页加载成功后的工作
                let succeedLoadWork = () => {
                    if(loadTimeout) {
                        clearTimeout(loadTimeout);
                        loadTimeout = false;
                    }

                    let load_id = tab_load.id;
                    let isClosed = !tabGroup.getTab(load_id);
                    let endTime = new Date().getTime();
                    let timeout = tabTimeoutMin - (endTime - startTime);

                    // 为标签页 webview 添加 tab 标识
                    tab.webview.executeJavaScript(`window.TABGROUPID = ${tab.id};`);

                    if(opt.type == "url" || opt.type == "httpUrl") {
                        // 为网络页面注入 js 附加逻辑

                    }

                    // 强制标签页加载事件大于 2s
                    if(timeout < 0 || (opt.type != "url" && opt.type != "httpUrl")) timeout = 0;
                    setTimeout(() => {
                        // 在加载过程中标签页被关闭
                        if(isClosed) {
                            tab_load = false;
                            tab.close();
                        }
                        else {
                            let activeTab = tabGroup.getActiveTab();
                            let isActive = activeTab && (activeTab.id == load_id);

                            // 加载过程中没有切换标签，url页面标签直接替换load标签的默认选中状态
                            if(tab_load) {
                                tab_load.close();
                                tab_load = false;
                            }
                            tab.show(true);
                            if(isActive) {
                                tab.activate();
                                window.focus();
                            }

                            tabTurning.addTabedDetection(tab);
                        }
                    }, timeout);
                };
                // 检测连接打开方式
                let resetSkipLink = (url) => {
                    tabGroupExtend.addTab({src: url, type: "httpUrl"});
                };

                // 加载完成触发，这个包含当前文档的导航和副框架的文档加载，但是不包含异步资源加载.
                wb.addEventListener("load-commit", (e) => {
                    console.log('load-commit', e)
                });
                // 在导航加载完成时触发，也就是tab 的 spinner停止spinning，并且加载事件处理.
                wb.addEventListener("did-finish-load", (e) => {
                    succeedLoadWork();
                    console.log('did-finish-load', e)
                });
                // 在加载失败或取消是触发，例如提出 window.stop()
                wb.addEventListener("did-fail-load", (e) => {
                    console.log("did-fail-load", e)
                    if(e.errorDescription == "ERR_NAME_NOT_RESOLVED") skipFailTab(e.validatedURL);
                });
                // 当一个 frame 完成加载时触发.
                wb.addEventListener("did-frame-finish-load", (e) => {
                    console.log('did-frame-finish-load', e)
                });
                // 开始加载时触发.
                wb.addEventListener("did-start-loading", (e) => {
                    console.log('did-start-loading', e)
                });
                // 停止加载时触发.
                wb.addEventListener("did-stop-loading", (e) => {
                    console.log('did-stop-loading', e)
                });
                // 当获得返回详情的时候触发.
                wb.addEventListener("did-get-response-details", (e) => {
                    console.log('did-get-response-details', e)
                });
                // 当重定向请求资源被接收的时候触发.
                wb.addEventListener("did-get-redirect-request", (e) => {
                    console.log('did-get-redirect-request', e)
                });
                // 当指定的frame文档加载完毕时触发.
                wb.addEventListener("dom-ready", (e) => {
                    console.log('dom-ready', e)
                    // succeedLoadWork();
                });
                // 当导航中的页面title被设置时触发.在title通过文档路径异步加载时explicitSet为false.
                wb.addEventListener("page-title-updated", (e) => {
                    console.log('page-title-updated', e)
                    let title = e.title;
                    if(title && title != "") tabGroupExtend.setTitle(tab.id, title);
                });
                // 当page收到了图标url时触发.
                wb.addEventListener("page-favicon-updated", (e) => {
                    console.log('page-favicon-updated', e)
                });
                // 当通过HTML API使界面进入全屏时触发.
                wb.addEventListener("enter-html-full-screen", (e) => {
                    console.log('enter-html-full-screen', e)
                });
                // 当通过HTML API使界面退出全屏时触发.
                wb.addEventListener("leave-html-full-screen", (e) => {
                    console.log('leave-html-full-screen', e)
                });
                // 当客户端输出控制台信息的时候触发.
                wb.addEventListener("console-message", (e) => {
                    // console.log('console-message', e)
                });
                // 在请求webview.findInPage结果有效时触发.
                wb.addEventListener("found-in-page", (e) => {
                    console.log('found-in-page', e)
                });
                // 在 guest page 试图打开一个新的浏览器窗口时触发.
                wb.addEventListener("new-window", (e) => {
                    console.log('new-window', e);
                    resetSkipLink(e.url);
                });
                // 当用户或page尝试开始导航时触发.它能在 window.location 变化或者用户点击连接的时候触发.
                wb.addEventListener("will-navigate", (e) => {
                    console.log('will-navigate', e)
                    wb.stop();
                    resetSkipLink(e.url);
                });
                // 当导航结束时触发.
                wb.addEventListener("did-navigate", (e) => {
                    console.log('did-navigate', e)
                    presentUrl = e.url;
                    startLoadBeforeWork(e.url);
                });
                // 当页内导航发生时触发.当业内导航发生时，page url改变了，但是不会跳出 page . 例如在锚链接被电击或DOM hashchange 事件发生时触发.
                wb.addEventListener("did-navigate-in-page", (e) => {
                    console.log('did-navigate-in-page', e)
                });
                // 在 guest page试图关闭自己的时候触发.
                wb.addEventListener("close", (e) => {
                    console.log("close", e)
                });
                // 在 guest page 向嵌入页发送一个异步消息的时候触发.
                wb.addEventListener("ipc-message", (e) => {
                    console.log('ipc-message', e)
                    switch (e.channel) {
                        // 判断当前文件是否在标签页打开
                        case "getTabChartIds":
                            let tabs = tabGroup.getTabs();
                            let fileIds = [];

                            tabs.map(tab => fileIds.push(tab.tab.getAttribute("data-chartid")));
                            wb.send('getTabChartIds_callback', fileIds.join(","));
                            break;
                    }
                });
                // 在渲染进程崩溃的时候触发.
                wb.addEventListener("crashed", (e) => {
                    console.log('crashed', e)
                });
                // 在GPU进程崩溃的时候触发.
                wb.addEventListener("gpu-crashed", (e) => {
                    console.log('gpu-crashed', e)
                });
                // 在插件进程崩溃的时候触发.
                wb.addEventListener("plugin-crashed", (e) => {
                    console.log('plugin-crashed', e)
                });
                // 在界面内容销毁的时候触发.
                wb.addEventListener("destroyed", (e) => {
                    console.log('destroyed', e)
                });
                // 在媒体准备播放的时候触发.
                wb.addEventListener("media-started-playing", () => {
                    console.log('media-started-playing')
                });
                // 在媒体暂停播放或播放放毕的时候触发.
                wb.addEventListener("media-paused", () => {
                    console.log('media-paused')
                });
                // 在开发者工具打开的时候触发.
                wb.addEventListener("devtools-opened", () => {
                    console.log('devtools-opened')
                });
                // 在开发者工具关闭的时候触发.
                wb.addEventListener("devtools-closed", () => {
                    console.log('devtools-closed')
                });
                // 在开发者工具获取焦点的时候触发.
                wb.addEventListener("devtools-focused", () => {
                    console.log('devtools-focused')
                });

                resolve(tab);
            });
        },
        "selectTab": (id, c) => {
            let tab = tabGroup.getTab(id);
            let activeTab = tabGroup.getActiveTab();
            tab.activate();
            c && activeTab.close();
        },
        "changeTabUrl": (chartId, category, title) => {
            tabGroup.getActiveTab().close();
            console.log(chartId)
            nWs.send(JSON.stringify({ k: "editChart", args: [ chartId, category, title ] }));
        },
        "connect-success": () => {
            console.log("WS 新客户端连接成功");
        },
    };
    // 创建首页
    tabGroupExtend.addTab({ closable: false }).then(tab => homeWeb = tab);
    $(".tab_more").off().on('click', function(e) {
        e.stopPropagation();
    });
};

// 建立 tab 相关 ws 连接
let initTabWs = function() {
    nWs.on('message', msg => {
        console.log(msg)
        if(typeof msg == 'string') {
            try {
                msg = JSON.parse(msg);
                let { k, args } = msg;

                switch (k) {
                    case "max":
                    case "unmax":
                        ipc.send("win_opts", k);
                        break;
                    case "refresh":
                        tabGroup.getTab(args[0]).webview.reload();
                        break;
                    default:
                        tabGroupExtend[k] && tabGroupExtend[k](...args);
                        break
                }
            }
            catch (err) {}
        }
    })
};

// 根据运行环境设置顶部操作条
let setOptBox = function() {
    var agent = navigator.userAgent.toLowerCase();
    var isMac = /macintosh|mac os x/i.test(navigator.userAgent);

    if(agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
        isMac = false;
    }
    if(agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
        isMac = false;
    }
    if(isMac){
        isMac = true;
    }

    if(isMac) $(".etabs-tabgroup").attr("data-system", "mac");
    else $(".etabs-tabgroup").attr("data-system", "win");
};

// “新建”标签页
let newTab = function() {
    tabGroupExtend.addTab({ src: httpUrl, type: "httpUrl" });
};

// 事件绑定
let bindEvent = function() {
    // 打开新的标签页
    $(".etabs-buttons").off().on("click", newTab);

    // 展开选择框
    $(".tab_more").off().on("click", function() {
        $(".shade_box").show();
        $(".shade_bg").show();
        $(".tab_more").attr("src", "./app/assets/images/choose_up.png");
        event.stopPropagation();

        $(document).one("click", () => {
            $(".shade_box").hide();
            $(".shade_bg").hide();
            $(".tab_more").attr("src", "./app/assets/images/choose.png");
        });
        return false;
    });
    // 收起选择框
    $(".etabs-tabgroup, .shade_bg").off().on("click", function() {
        $(".shade_box").hide();
        $(".shade_bg").hide();
        $(".tab_more").attr("src", "./app/assets/images/choose.png");
    });
    // 窗口操作（最小化、最大化、关闭）
    $(".win_opts").off().on("click", function(e) {
        let id = $(e.target).attr("data-id");

        ipc.send("win_opts", id);
    });
    // 下载完成
    ipc.on("download_reply", function() {
        nWs.send(JSON.stringify({ k: "download_reply", args: ["success"] }));
    });
    // 窗口最大化、全屏回调
    ipc.on("fullScreen", function() {
        $(".win_opts .opt[data-id=fullScreen]").attr("data-id", "unFullScreen").html("&#xe780;");
    });
    // 窗口取消最大化、全屏回调
    ipc.on("unFullScreen", function() {
        nWs.send(JSON.stringify({ k: "unFullScreen", args: [] }));
        $(".win_opts .opt[data-id=unFullScreen]").attr("data-id", "fullScreen").html("&#xe77e;");
    });
    // 收到选择文件夹后的回调
    ipc.on("file_output_callback", function(e, filePaths) {
        nWs.send(JSON.stringify({ k: "file_output_callback", args: [filePaths] }));
    })
    // 图片导出的回调
    ipc.on("exportImg_callback", function(e, toLocalPath) {
        nWs.send(JSON.stringify({ k: "exportImg_callback", args: [toLocalPath] }));
    })
};

const script=document.createElement("script");
script.type="text/javascript";
script.src="https://code.jquery.com/jquery-1.12.4.min.js";
script.onload = function() {
    tabTurning.init();
    initTabGroup();
    initTabWs();
    setOptBox();
    bindEvent();
};
document.getElementsByTagName('head')[0].appendChild(script);
