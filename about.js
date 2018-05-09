#!/usr/bin/env node

const cohCommon = require('./common');
const chalk = require('chalk');

const {ovh} = cohCommon;

const config = async () => {
    if (cohCommon.isAlreadyConfigured()) {
        console.log('Configured, retrieving your domains list...');
        try {
            const domains = await ovh.requestPromised('GET', '/domain');
            console.log(`Your domains: ${chalk.green(domains.join(', '))}`);
        } catch (e) {
            console.log(chalk.red(`Failed to retrieve your domains: [${e.error}] - ${e.message}`));
        }
    }
    else {
        console.log(chalk.red('Not yet configured, run "coh-configure".'));
    }
};

// main
(async () => {
    console.log(chalk.blue("- Configuration:"));
    await config();
    console.log();

    console.log(chalk.blue("- Certificate query:"));
    console.log(`certbot certonly --manual --preferred-challenges=dns --manual-auth-hook ${chalk.blue('coh-auth')} --manual-cleanup-hook ${chalk.blue('coh-cleanup')} -d example.com -d www.example.com`);
    console.log();

    console.log(chalk.blue("- Certificate renewal query:"));
    console.log(`certbot renew --quiet`);
    console.log();

    console.log(chalk.blue("- Cron sample, with nginx:"));
    console.log(`@weekly certbot renew --quiet --deploy-hook "service nginx restart"`);
    console.log();
})();