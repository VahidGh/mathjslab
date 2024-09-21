import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Recursively creates the directories.
 * @param dirPath
 */
export default (...dirPath: string[]): void => {
    const directory = path.resolve(...dirPath);
    try {
        fs.accessSync(directory, fs.constants.F_OK);
    } catch {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`Creating directory ${directory} done.`);
    }
};
