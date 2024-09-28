/**
 * clean-package-lock.cjs: This script removes the 'package-lock.json' file
 * and the 'node_modules' directory.
 */
const fs = require('node:fs');
const path = require('node:path');

console.log(`Running ${__filename} ...`);
console.warn('Removing package-lock.json file and node_modules directory ...');
try {
    const dirPath = path.resolve(__dirname, '..', 'node_modules');
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`${dirPath} removed.`);
} catch (err) {
    console.error(`Error removing ${dirPath} : ${err.message}`);
    console.error('ignoring...');
}
const filePath = path.resolve(__dirname, '..', 'package-lock.json');
try {
    fs.accessSync(filePath, fs.constants.W_OK);
    fs.unlinkSync(filePath);
    console.log(`${filePath} removed.`);
} catch (err) {
    console.error(`Error removing ${filePath} : ${err.message}`);
    console.error('ignoring...');
}
console.warn('Removing package-lock.json file and node_modules directory done.');
console.log(`Running ${__filename} done.\n\n`);
