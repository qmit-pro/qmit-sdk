# QMIT-SDK

## 1. Handbook
[Handbook](./handbook) for introduction of QMIT system infrastructure

## 2. CLI
```bash
$ yarn add -g qmit-sdk

$ qmit login

$ qmit login vault

$ qmit login cloud

$ qmit moleculer

$ qmit vault

$ qmit help
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
...
```

#### B. moleculer
```js
...
```
