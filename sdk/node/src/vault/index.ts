import { exec, SDKModule } from "../common";
import vaultSync from "vault-sync";
import { VaultReaderFactory } from "vault-sync/dist/async";

const VAULT_ADDRESS = "https://vault.internal.qmit.pro";

export class Vault extends SDKModule {
  public async installedVersion() {
    return exec(`vault --version`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `${res.stdout.split("Vault ")[1]}`.trim();
        } else {
          return null;
        }
      }, () => null);
  }
  public readonly minInstalledVersion = "v1.4.1";
  public readonly installGuide = `
- Install vault CLI from https://www.vaultproject.io/downloads or brew install vault for macOS
- Add "export VAULT_ADDR=https://vault.internal.qmit.pro" into your login shell script for easy use of "vault" command.
`;

  public login() {
    return exec(`vault login -address=${VAULT_ADDRESS} -method=oidc`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return this.loginStatus();
        } else {
          throw res.stderr;
        }
      });
  }

  public loginStatus() {
    return exec(`vault token lookup -format json -address=${VAULT_ADDRESS}`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout).data;
        } else {
          throw res.stderr;
        }
      });
  }

  public fetch<T = any>(factory: VaultReaderFactory<T>) {
    return vaultSync(factory, {
      // vault connection setting
      uri: VAULT_ADDRESS,
      debug: false,

      // alternative auth method for kubernetes pod
      method: `k8s/${this.context.appKubernetesCluster}`,
      role: "default",
    });
  }
}

const singletonVault = new Vault();

// console.log(
//   singletonVault.fetch(async (get, list) => {
//     return get("common/data/services");
//   })
// );

// singletonVault.loginStatus().then(console.log);

// singletonVault.login().then(console.log);

// singletonVault.installedVersion().then(console.log);

export default singletonVault;
