require('dotenv').config({path: `${__dirname}/.env`});
const chalk = require('chalk');

let ovh = {requestPromised: () => Promise.reject("OVH not configured")};
try {
    ovh = require('ovh')({
        endpoint: process.env.OVH_ENDPOINT || 'ovh-eu',
        appKey: process.env.OVH_APPLICATION_KEY,
        appSecret: process.env.OVH_APPLICATION_SECRET,
        consumerKey: process.env.OVH_CONSUMER_KEY
    });
}
catch (e) {
}

const common = {
    ovh,
    getConfigFilePath: () => `${__dirname}/.env`,
    isAlreadyConfigured: () => {
        return process.env.OVH_APPLICATION_KEY && process.env.OVH_APPLICATION_SECRET && process.env.OVH_CONSUMER_KEY;
    },
    checkConfig: () => {
        if (!common.isAlreadyConfigured()) {
            console.error(chalk.red(`No configuration file found, please run "coh-configure" first.`));
            process.exit(1);
        }
    }
};

module.exports = common;