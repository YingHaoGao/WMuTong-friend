## robot官网

    1. npm install node-gyp -g
    2. cnpm install --global --production windows-build-tools
    3. 安装 Visual Studio 2019 // https://developer.microsoft.com/zh-cn/windows/downloads/windows-10-sdk/
    4. 在Visual Studio 2019 安装程序的可选组件中选择“Windows 10 SDK (10.0.19041.0)”

## iohook官网

    1. https://wilix-team.github.io/iohook/
    2. “electron-v85-win32-x64” 文件放到 “WMuTong-friend\node_modules\_iohook@0.9.0@iohook\builds\” 路径下

## 打包 exe

    1. npm run packager
    <!-- 1. https://blog.csdn.net/fukaiit/article/details/90964319 -->
    <!-- 2. "electron-packager . mutong_friend --out mutong_friend --arch=x64 --overwrite --ignore=node_modules" -->

## 打包安装程序

    1. NSIS
    2. https://www.jianshu.com/p/92b6db400933

## 运行命令-win

    1. npm i
    2. npm install -g --production windows-build-tools
    3. npm install -g node-gyp
    4. npm run rebuild
    5. “electron-v85-win32-x64” 文件放到 “WMuTong-friend\node_modules\_iohook@0.9.0@iohook\builds\” 路径下
    6. npm run rebuild
    7. npm run serve

## 运行命令-mac

    1. npm i
    2. npm install -g --production windows-build-tools
    3. npm install -g node-gyp
    4. npm run rebuild
    5. “electron-v85-win32-x64” 文件放到 “WMuTong-friend\node_modules\_iohook@0.9.0@iohook\builds\” 路径下
    6. npm run rebuild
    7. npm run serve