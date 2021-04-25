import { consoleInner } from './util.js';

// os 模块，获取操作系统信息
const os = require('os');
// 网络信息
const networkInterfaces = os.networkInterfaces();
// CPU信息
const cpus = os.cpus();
// os临时文件夹
const tmpDir = os.tmpDir();
// OS体系结构
const arch = os.arch();
// 从操作系统中检索总内存量(以字节为单位)
const totalmem = os.totalmem();
// 操作系统名称
const sysType = os.type();
const sysPlatform = os.platform();

consoleInner({ '网络信息': networkInterfaces }, 10);
consoleInner({ 'CPU信息': cpus }, 11);
consoleInner({ 'os临时文件夹': tmpDir }, 12);
consoleInner({ 'OS体系结构': arch }, 13);
consoleInner({ '从操作系统中检索总内存量': totalmem/1048576+' mb' }, 14);
