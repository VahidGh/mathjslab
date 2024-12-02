/**
 * clean-package-lock.cjs: This script removes the 'package-lock.json' file
 * and the 'node_modules' directory.
 */
const fs = require('node:fs');
const path = require('node:path');

global.console.log(`Running ${__filename} ...`);
global.console.warn('Removing package-lock.json file and node_modules directory ...');
const root = process.argv.length > 2 ? path.resolve(process.argv[2]) : process.cwd();
global.console.warn('Project root:', root);
const dirPath = path.join(root, 'node_modules');
try {
    fs.accessSync(dirPath, fs.constants.W_OK);
    fs.rmSync(dirPath, { recursive: true, force: true });
    global.console.log(`${dirPath} removed.`);
} catch (err) {
    global.console.error(`Error removing ${dirPath} : ${err.message}`);
    global.console.error('ignoring...');
}
const filePath = path.join(root, 'package-lock.json');
try {
    fs.accessSync(filePath, fs.constants.W_OK);
    fs.unlinkSync(filePath);
    global.console.log(`${filePath} removed.`);
} catch (err) {
    global.console.error(`Error removing ${filePath} : ${err.message}`);
    global.console.error('ignoring...');
}
global.console.warn('Removing package-lock.json file and node_modules directory done.');
global.console.log(`Running ${__filename} done.\r\n`);
