import { exec, SDKModule } from "../common";
import vaultSync from "vault-sync";
import { VaultReaderFactory } from "vault-sync/dist/async";

export class Vault extends SDKModule {
  public async getInstalledVersion() {
    return exec(`vault --version`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `${res.stdout.split("Vault ")[1].split(" ")[0]}`.trim();
        } else {
          return null;
        }
      })
      .catch(err => {
        this.context.logger.error(err);
        return null;
      });
  }
  public readonly minInstalledVersion = "v1.4.1";
  public readonly installGuide = `- Install vault CLI from https://www.vaultproject.io/downloads or "brew install vault" for macOS
- Add "export VAULT_ADDR=https://vault.internal.qmit.pro" into your login shell script for easy use of manual "vault" command.
- And ask an infrastructure manager to grant Vault permission to your G-suite account.
`;

  public login() {
    return exec(`vault login -address=${this.context.VAULT_ADDRESS} -method=oidc`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return this.loginStatus();
        } else {
          throw res.stderr;
        }
      });
  }

  public loginStatus() {
    return exec(`vault token lookup -format json -address=${this.context.VAULT_ADDRESS}`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout).data;
        } else {
          throw res.stderr;
        }
      })
      .catch(err => {
        this.context.logger.error(err);
        return null;
      });
  }

  // Use this API for fetch secrets in application
  public fetch<T = any>(factory: VaultReaderFactory<T>) {
    return vaultSync(factory, {
      // vault connection setting
      uri: this.context.VAULT_ADDRESS,
      debug: false,

      // alternative auth method for kubernetes pod
      method: `k8s/${this.context.clusterName}`,
      role: "default",
    });
  }

  public webInterfaceURL = `${this.context.VAULT_ADDRESS}/ui/vault/auth?with=oidc`;
}

const singletonVault = new Vault();

// console.log(
//   singletonVault.fetch(async (get, list) => {
//     return get("common/data/services");
//   })
// );

// singletonVault.loginStatus().then(console.log);

// singletonVault.login().then(console.log);

// singletonVault.getInstalledVersion().then(console.log);

// singletonVault.openWebInterface().then(console.log);

export default singletonVault;
