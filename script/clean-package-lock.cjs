/**
 * clean-package-lock.cjs: This script removes the 'package-lock.json' file
 * and the 'node_modules' directory.
 */
const fs = require('node:fs');
const path = require('node:path');

console.log(`Running ${__filename} ...`);
console.log('Removing package-lock.json file and node_modules directory ...');
try {
    const dirPath = path.resolve(__dirname, '..', 'node_modules');
    fs.rmSync(dirPath, { recursive: true, force: true });
} catch (err) {
    console.error(`Error removing ${dirPath} : ${err.message}`);
}
const filePath = path.resolve(__dirname, '..', 'package-lock.json');
try {
    fs.accessSync(filePath, fs.constants.W_OK);
    fs.unlinkSync(filePath);
    console.log(`${filePath} removed.`);
} catch (err) {
    console.error(`Error removing ${filePath} : ${err.message}`);
}
console.log('Removing package-lock.json file and node_modules directory done.');
console.log(`Running ${__filename} done.`);
