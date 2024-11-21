import httpServer from 'http-server';
import {program} from 'commander';
import path from 'path';
import {readFileSync, writeFileSync} from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';

import express from 'express';
import { fileURLToPath } from 'url';

import packageJson from './package.json' with {type: "json"};

program
    .name('hawkeye')
    .description('CLI to launch the Hawkeye app')
    .version(packageJson.version)
    .argument('<string>', 'path to the stats.json file')
    .action((pathToStatsJsonFile) => {
        try {
            const statsJson = readFileSync(pathToStatsJsonFile, 'utf-8');
            writeFileSync('./client/assets/stats.json', statsJson);

            const server = httpServer.createServer({
                root: './client',
                cache: -1
            });

            const PORT = 1420; // Replace with your desired port
            server.listen(PORT, () => {
                logHawkeyeMessage(`Server is running at http://localhost:${PORT}?launchMode=cli`, 'info')
            });

            open(`http://localhost:${PORT}/?launchMode=cli`);

        } catch (error) {
            logHawkeyeMessage(error, 'error');
        }
    });

program.command('init').action(async () => {
    try {
        const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');
        const PACKAGE_JSON = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));

        const {multiProjectWorkspace} = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'multiProjectWorkspace',
                message: 'Do you have a multi-project workspace?'
            }
        ]);

        const {projectName} = await inquirer.prompt([
            {
                type: 'input',
                name: 'projectName',
                message: 'What is the name of your project?'
            }
        ]);

        if (multiProjectWorkspace) {
            const ANALYSE_SCRIPT_MULTI_PROJECT_WORKSPACE = `ng build  ${projectName} --stats-json --named-chunks && npx hawkeye analyze dist/${projectName}/stats.json`;
            PACKAGE_JSON.scripts = {
                ...PACKAGE_JSON.scripts,
                [`analyze:${projectName}`]: ANALYSE_SCRIPT_MULTI_PROJECT_WORKSPACE
            };
        } else {
            const ANALYSE_SCRIPT_SINGLE_PROJECT_WORKSPACE = `ng build --stats-json --named-chunks && npx hawkeye analyze dist/${projectName}/stats.json`;
            PACKAGE_JSON.scripts = {...PACKAGE_JSON.scripts, analyze: ANALYSE_SCRIPT_SINGLE_PROJECT_WORKSPACE};
        }

        writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(PACKAGE_JSON, null, 2));
        logHawkeyeMessage(`Analyze script successfully added to your package.json`, 'success');
    } catch (error) {
        logHawkeyeMessage(error, 'error');
    }
});
program.parse();

function logHawkeyeMessage(message, level) {
    switch(level) {
        case 'info':
            console.log(chalk.blue(`𓅃: ${message}`));
            break;
        case 'success':
            console.log(chalk.green(`𓅃: ${message}`));
            break;
        case 'warn':
            console.warn(chalk.yellow(`𓅃️ ${message}`));
            break;
        case 'error':
            console.error(chalk.red(`𓅃 ${message}`));
            break;
        default:
            console.log(`𓅃 ${message}`);
    }
}
