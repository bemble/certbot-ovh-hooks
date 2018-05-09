#!/usr/bin/env node

const util = require('util');
const dns = require('dns');
const chalk = require('chalk');
const parseDomain = require('parse-domain');

const cohCommon = require('./common');
const {ovh} = cohCommon;

const resolveNsPromised = util.promisify(dns.resolveNs);
const resolvePromised = util.promisify(dns.resolve);
const resolveTxtPromised = util.promisify(dns.resolveTxt);

cohCommon.checkConfig();

// Main
(async () => {
    const certbotDomain = process.env.CERTBOT_DOMAIN;
    const certbotValidation = process.env.CERTBOT_VALIDATION;

    const dom = parseDomain(certbotDomain);
    const domain = dom && dom.domain !== '' && dom.tld !== '' ? `${dom.domain}.${dom.tld}` : '';
    const record = dom && dom.subdomain ? `_acme-challenge.${dom.subdomain}` : '_acme-challenge';

    try {
        // Set DNS to query if TXT entry is added
        const nsServers = await resolveNsPromised(domain);
        const rawNsServersIps = (await Promise.all(nsServers.map(server => resolvePromised(server))));
        const nsServersIps = rawNsServersIps.concat.apply([], rawNsServersIps).filter(ip => !!ip);
        dns.setServers(nsServersIps);

        // Add entry itself
        await ovh.requestPromised('POST', `/domain/zone/${domain}/record`, {
            fieldType: 'TXT',
            subDomain: `${record}`,
            target: certbotValidation,
            ttl: 60,
        });

        // Check if everything is correct
        const timer = setInterval(() => {
            try {
                const records = resolveTxtPromised(`${record}.${domain}`);
                if (!!records) {
                    clearInterval(timer);
                    process.exit(0);
                }
            }
            catch (e) {
            }
        }, 5000);

        setTimeout(() => {
            clearInterval(timer);
            process.exit(0);
        }, (process.env.DNS_TIMEOUT || 60) * 1000);
    }
    catch (e) {
        console.error(chalk.red(`An error occured: ${e}`));
        process.exit(1);
    }
})();