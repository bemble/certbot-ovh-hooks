#!/usr/bin/env node

const chalk = require('chalk');
const parseDomain = require('parse-domain');

const cohCommon = require('./common');
const {ovh} = cohCommon;

cohCommon.checkConfig();

// Main
(async () => {
    const certbotDomain = process.env.CERTBOT_DOMAIN;

    const dom = parseDomain(certbotDomain);
    const record = dom.subdomain ? `_acme-challenge.${dom.subdomain}` : '_acme-challenge';
    try {
       const records = await ovh.requestPromised('GET', `/domain/zone/${dom.domain}.${dom.tld}/record`, {
            fieldType: 'TXT',
            subDomain: `${record}`,
        });
       if(records.length === 1) {
           await ovh.requestPromised('DELETE', `/domain/zone/${dom.domain}.${dom.tld}/record/${records[0]}`);
           await ovh.requestPromised('POST', `/domain/zone/${dom.domain}.${dom.tld}/refresh`);
       }
    }
    catch (e) {
        console.error(chalk.red(`An error occured: ${e}`));
        process.exit(1);
    }
})();