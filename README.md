# QMIT-SDK

## 1. Handbook
[Handbook](./handbook) for introduction of QMIT system infrastructure

## 2. CLI
```bash
$ yarn global add qmit-sdk


$ qmit --help
qmit <command>

Commands:
  qmit context [services..]  Configure or show current context.   [aliases: ctx]
  qmit resource              Show cloud resource of current context.
                                                                  [aliases: res]
  qmit login [services..]    Invoke login process.
  qmit cluster [options..]   Create a VPN-tunnel with current cluster-alias
                             context. It will invoke telepresence command to
                             establish a VPN-tunnel with cluster.
                             It runs: telepresence --also-proxy ... [options..]
  qmit app                   Create a service broker with current app-env
                             context. It will run a REPL interface to
                             communicate with internal nodes and services. A
                             VPN-tunnel with proper cluster should be
                             established before.
                             It runs: moleculer connect redis://....
  qmit open [services..]     List or open public service endpoints. Service
                             information are derived from
                             vault:common/show/services

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

## 3. SDK
- A. [vault](https://www.vaultproject.io/) secret management
  - To read vault secrets with either local or kubernetes pod token.
- B. [moleculer](https://moleculer.services/) service broker
  - To fetch global moleculer service broker configuration for connecting QMIT micro services.
  - Support separated app environment and k8s cluster context.

### 3.1. Node.js SDK
#### A. vault
```js
import { context, vault } from "qmit-sdk";

// it resolves synchronously!
const config = vault.fetch(async (get, list) => {
    const [whatever, something] = await Promise.all([
        get("common/data/some-mysql/secrets").then(res => res.data),
        get(`${context.appEnv}/data/envDependentSecrets`).then(res => res.data),
    ]);
    
    // do whatever here

    return {
        whatever,
        something,
    }
});

// ...
```

#### B. moleculer
```js
import { ServiceBroker } from "moleculer";
import { moleculer } from "qmit-sdk";

const broker = new ServiceBroker(moleculer.createServiceBrokerOptions());
broker.start();

broker.call("other-service.some-action").then(...);
// ...
```
