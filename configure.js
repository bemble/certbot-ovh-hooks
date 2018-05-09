#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const opn = require('opn');
const fs = require('fs');

const cohCommon = require('./common');

const shouldRunConfigure = async () => {
    if (!cohCommon.isAlreadyConfigured()) {
        return true;
    }

    let {runConfigure} = await inquirer.prompt([{
        type: 'confirm',
        name: 'runConfigure',
        message: 'certbot-ovh-hooks already configured, re-run configuration',
        default: false
    }]);
    return runConfigure;
};

const createApiAccess = async () => {
    const {hasAlreadyCredentials} = await inquirer.prompt([{
        type: 'confirm',
        name: 'hasAlreadyCredentials',
        message: 'Do you already have OVH API access?',
        default: true
    }]);

    if (!hasAlreadyCredentials) {
        const createTokenUrl = 'https://api.ovh.com/createToken/';
        console.log(chalk.blue('In the window that will open in 5 seconds, create {GET,POST,PUT,DELETE} for "/domain" and "/domain/*" with an unlimited validity.'));
        console.log(chalk.yellow(`If your on a headless server, just go to "${createTokenUrl}".`));
        setTimeout(() => opn(createTokenUrl, {wait: false}), 5000);
    }
};

const apiDetails = async () => {
    const questions = [
        {
            type: 'input',
            name: 'OVH_ENDPOINT',
            message: "API endpoint",
            default: process.env.OVH_ENDPOINT || 'ovh-eu',
            validate: (value) => !!value.length || 'Please enter the API endpoint'
        },
        {
            type: 'input',
            name: 'OVH_APPLICATION_KEY',
            message: "Application key",
            default: process.env.OVH_APPLICATION_KEY,
            validate: (value) => !!value.length || 'Please enter the application key'
        },
        {
            type: 'input',
            name: 'OVH_APPLICATION_SECRET',
            message: "Application secret",
            default: process.env.OVH_APPLICATION_SECRET,
            validate: (value) => !!value.length || 'Please enter the application secret'
        },
        {
            type: 'input',
            name: 'OVH_CONSUMER_KEY',
            message: "Consumer key",
            default: process.env.OVH_CONSUMER_KEY,
            validate: (value) => !!value.length || 'Please enter the consumer key'
        },
        {
            type: 'input',
            name: 'DNS_TIMEOUT',
            message: "DNS timeout",
            default: process.env.DNS_TIMEOUT || 60,
            validate: (value) => !isNaN(parseInt(value)) || 'Please enter a number',
            filter: Number
        },

    ];

    const answers = await inquirer.prompt(questions);
    const conf = Object.entries(answers).map(e => `${e[0]}=${e[1]}`).join('\n');
    fs.writeFileSync(cohCommon.getConfigFilePath(), conf, 'utf8');
};

// main
(async () => {
    let runConfigure = await shouldRunConfigure();
    if (runConfigure) {
        await createApiAccess();
        await apiDetails();
    }

    console.log(chalk.green(`Configured! Run "coh-about" for more information.`));
})();