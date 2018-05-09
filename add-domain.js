#!/usr/bin/env node

const os = require('os');
const inquirer = require('inquirer');
const parseDomain = require('parse-domain');
const chalk = require('chalk');

const cohCommon = require('./common');
const {ovh} = cohCommon;

cohCommon.checkConfig();

const searchIps = () => {
    const ifaces = os.networkInterfaces();

    return Object.keys(ifaces).filter(ifname => !ifaces[ifname].every(iface => iface.internal)).map(ifname => {
        let ips = {};
        ifaces[ifname].forEach((iface) => ips[iface.family.toLowerCase()] = iface.address);
        return ips;
    });
};

const getIps = async () => {
    const foundIps = searchIps();
    let ips = null;

    if (foundIps.length) {
        let ipsChoices = foundIps.map(ip => Object.entries(ip).map(i => i.join(': ')).join(', '));
        ipsChoices.push('Others (manual)');

        const {selectedIpsText} = await inquirer.prompt({
            type: 'rawlist',
            name: 'selectedIpsText',
            message: 'Which IPS do you want to use?',
            choices: ipsChoices,
            pageSize: ipsChoices.length + 1,
        });
        const selectedIpsIndex = ipsChoices.indexOf(selectedIpsText);
        if (selectedIpsIndex < foundIps.length) {
            ips = foundIps[selectedIpsIndex];
        }
    }

    if (!ips) {
        ips = await inquirer.prompt([{
            type: 'input',
            name: 'ipv4',
            message: 'IPv4',
            validate: (val) => !val.length || /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(val) || 'Please enter a valid IPv4'
        }, {
            type: 'input',
            name: 'ipv6',
            message: 'IPv6',
            validate: (val) => !val.length || /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(val) || 'Please enter a valid IPv6'
        }]);
    }

    return ips;
};

const getDomain = async () => {
    const {rawDomain} = await inquirer.prompt([{
        type: 'input',
        name: 'rawDomain',
        message: 'Domain',
        validate: (val) => !!val.length || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(val) || 'Please enter a valid domain name'
    }]);
    let dom = parseDomain(rawDomain);
    try {
        // Check if domain owner
        await ovh.requestPromised('GET', `/domain/zone/${dom.domain}.${dom.tld}`);
    }
    catch (e) {
        console.error(chalk.red(`An error occured while checking domain: [${e.error}] ${e.message}`));
        process.exit(0);
    }

    return rawDomain;
};

const setAAndAAAA = async (rawDomain, ipv4, ipv6) => {
    try {
        const ttl = await getTtl();
        await setAOrAAAA(rawDomain, ipv4, 'A', ttl);
        await setAOrAAAA(rawDomain, ipv6, 'AAAA', ttl);
    }
    catch (e) {
        console.error(chalk.red(`An error occured while checking domain: [${e.error}] ${e.message}`));
        process.exit(0);
    }
};

const setAOrAAAA = async (rawDomain, ip, fieldType, ttl) => {
    let dom = parseDomain(rawDomain);
    if (ip) {
        const records = await ovh.requestPromised('GET', `/domain/zone/${dom.domain}.${dom.tld}/record`, {
            fieldType, subDomain: dom.subdomain
        });
        const isIpEdit = !!records.length;

        let processIpChange = true;
        if (isIpEdit) {
            console.log(chalk.yellow(`An ${fieldType} (IPv${fieldType === 'A' ? 4 : 6}) DNS record has been found for "${rawDomain}".`));
            processIpChange = (await inquirer.prompt([{
                type: 'confirm',
                name: 'processIpChange',
                message: 'Overwrite it?',
                default: false,
            }])).processIpChange
        }

        if (processIpChange) {
            await ovh.requestPromised(isIpEdit ? 'PUT' : 'POST', `/domain/zone/${dom.domain}.${dom.tld}/record${isIpEdit ? `/${records[0]}` : ''}`, {
                fieldType, subDomain: dom.subdomain,
                target: ip, ttl
            });
            if (isIpEdit) {
                await ovh.requestPromised('POST', `/domain/zone/${dom.domain}.${dom.tld}/refresh`);
            }
        }
    }
};

const getTtl = async () => {
    return (await inquirer.prompt([{
        type: 'input',
        name: 'ttl',
        message: 'Entry TTL',
        default: 600,
        validate: (value) => !isNaN(parseInt(value)) || 'Please enter a number',
        filter: Number
    }])).ttl;
};

// Main
(async () => {
    const domain = await getDomain();

    let {ipv4, ipv6} = await getIps();
    if (!(ipv4.length + ipv6.length)) {
        process.exit(0);
    }


    await setAAndAAAA(domain, ipv4, ipv6);
})();
