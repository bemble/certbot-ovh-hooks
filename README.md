# certbot-ovh-hooks
> Hooks, in NodeJS, to handle manual certbot queries with domains registred at OVH.

It requires **Node 8+**.

## Install

```bash
npm i -g certbot-ovh-hooks
```

## Update

```bash
cp -p `npm root -g`/certbot-ovh-hooks/.env /tmp/coh_env_bu && \
  npm i -g certbot-ovh-hooks && \
  mv /tmp/coh_env_bu `npm root -g`/certbot-ovh-hooks/.env
```

## Configure

Simply run the following command:
```bash
coh-configure
```
Or copy `.env.sample` to `.env` and edit manually.

## Some checks

This will check if the configuration is done, your domains list and a reminder on request/renew certs etc.
```bash
coh-about
```

## Query a certificate

```bash
certbot certonly --manual --preferred-challenges=dns --manual-auth-hook coh-auth --manual-cleanup-hook coh-cleanup -d example.com -d www.example.com
```

## Renew certificates

**If you have certificates queried without hooks, you must re-query these certificate to be able to renew them.**

### Standard
```bash
certbot renew --quiet
```

### When using Nginx
```bash
certbot renew --quiet --deploy-hook "service nginx reload"
```
