/** 配置文件 **/

/**
 * -start- console.log 样式配置
 * @params success 成功
 * @params error   失败
 * */
const logStyle = {
    success : 'color: green;font-weight: bold;',
    error   : 'color: red;font-weight: bold;'
};
/** -end- console.log 样式配置 */

/**
 * -start- 模块统一引入常量
 * */
const { shell, remote } = require('electron');
const electron      = require('electron');
const WebSocket     = require('ws');
const TabGroup      = require("electron-tabs");
const ipc           = electron.ipcRenderer;
const env           = process.env;
const wsPort        = 12123;
const busClient     = new WebSocket(`ws://localhost:${wsPort}/`);
const imagePath     = "";
const wx_appId      = "wxc392a1bb1ac820fe";
const wx_appSecret  = "c0ca9ba4855ceae1ed3b265edbb20da7";
const qq_clientId   = "100485241";

window.global = global;
window.zhuge = {track: function(){}};
/** -end- 模块统一引入常量 */
