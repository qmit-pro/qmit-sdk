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
                             information are derived from vault:
                             /data/common/services

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]


$ qmit ctx
=== QMIT CLI Context ===
╔══════════════╤═════════════════════════════════════════════════════╤═══════════════════╗
║ Service      │ Current Context                                     │ Installed CLI     ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ qmit         │ app-env: dev                                        │ v1.0.16/v1.0.17   ║
║              │ cluster-name: dev                                   │                   ║
║              │ cluster-zone: asia-northeast1-a                     │                   ║
║              │ kubectl-context: gke_qmit-pro_asia-northeast1-a_dev │                   ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ vault        │ email: dw.kim@qmit.kr                               │ v1.4.1/v1.4.1     ║
║              │ name: 김동욱                                          │                   ║
║              │ role: default                                       │                   ║
║              │ policies: default, developer                        │                   ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ gcloud       │ account: dw.kim@qmit.kr                             │ v292.0.0/v292.0.0 ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ kubectl      │ cluster: gke_qmit-pro_asia-northeast1-a_dev         │ v1.14.10/v1.14.10 ║
║              │ user: gke_qmit-pro_asia-northeast1-a_dev            │                   ║
║              │ namespace: default                                  │                   ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ telepresence │ session: 913d91a533494899b25158f55124fee4           │ v0.105/v0.105     ║
║              │ deployment: telepresence-1590563677-551853-35800    │                   ║
║              │ namespace: default                                  │                   ║
║              │ images: datawire/telepresence-k8s:0.105             │                   ║
║              │ created at: 2020-05-27T07:14:47Z                    │                   ║
╟──────────────┼─────────────────────────────────────────────────────┼───────────────────╢
║ moleculer    │ namespace: dev (app-env)                            │ v0.7.1/v0.7.1     ║
║              │                                                     │                   ║
╚══════════════╧═════════════════════════════════════════════════════╧═══════════════════╝
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
import { vault } from "qmit-sdk";

// it resolves synchronously!
const config = vault.fetch(async (get, list, { appEnv, clusterName, anyVer }) => {
    const [whatever, something] = await Promise.all([
        get("common/data/some-mysql/secrets").then(res => res.data),
        get(`${appEnv}/data/envDependentSecrets`).then(res => res.data),
    ]);
    
    // do whatever here

    return {
        whatever,
        something,
    }
}, {
    sandbox: {
        anyVar: "blablabla..",
    },
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
