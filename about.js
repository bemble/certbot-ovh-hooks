#!/usr/bin/env node

const cohCommon = require('./common');
const chalk = require('chalk');
const inquirer = require('inquirer');

const {ovh} = cohCommon;

const config = async () => {
    if (cohCommon.isAlreadyConfigured()) {
        console.log('Configured, retrieving your domains list...');
        try {
            const domains = await ovh.requestPromised('GET', '/domain');
            console.log(`Your domains: ${chalk.green(domains.join(', '))}`);
            return true;
        } catch (e) {
            console.log(chalk.red(`Failed to retrieve your domains: [${e.error}] - ${e.message}`));
        }
    }
    else {
        console.log(chalk.red('Not yet configured, run "coh-configure".'));
    }
    return false;
};

const checkDomains = async () => {
    try {
        const domains = await ovh.requestPromised('GET', '/domain');
        let recordsPromises = domains.map(domain => ovh.requestPromised('GET', `/domain/zone/${domain}/record`, {fieldType: 'TXT'})
            .then(records => records.map(recordId => ovh.requestPromised('GET', `/domain/zone/${domain}/record/${recordId}`)))
            .then(recordsPromises => Promise.all(recordsPromises))
            .then(records => records.filter(r => r.subDomain.startsWith('_acme-challenge')))
        );
        let records = [].concat.apply([], (await Promise.all(recordsPromises)));
        if (records.length) {
            console.log(`The following acme entries has been found: ${chalk.blue(records.map(r => `${r.subDomain}.${r.zone}`).join(', '))}`);
            console.log(chalk.yellow('This can cause issues.'));
            const {deleteOldEntries} = await inquirer.prompt([{
                type: 'confirm',
                name: 'deleteOldEntries',
                message: chalk.yellow('Delete them'),
                default: true
            }]);
            if (deleteOldEntries) {
                await Promise.all(records.map(record =>
                    ovh.requestPromised('DELETE', `/domain/zone/${record.zone}/record/${record.id}`)
                        .then(() => ovh.requestPromised('POST', `/domain/zone/${record.zone}/refresh`))
                ));
            }
        }
        else {
            console.log('Everything seams right.');
        }

    } catch (e) {
        console.log(chalk.red(`Failed to check your domains: [${e.error}] - ${e.message}`));
    }
};

// main
(async () => {
    console.log(chalk.blue("- Configuration:"));
    let configured = await config();
    console.log();

    if (configured) {
        console.log(chalk.blue("- Check domains:"));
        await checkDomains();
        console.log();
    }

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