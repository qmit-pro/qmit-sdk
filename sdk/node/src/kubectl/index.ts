import kleur from "kleur";
import { exec, SDKModule } from "../common";

export class Kubectl extends SDKModule {
  public installedVersion(): Promise<string | null> {
    return exec("kubectl version -o json")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `${JSON.parse(res.stdout).clientVersion.gitVersion}`;
        } else {
          return null;
        }
      }, () => null);
  }
  public readonly minInstalledVersion = "v1.14.10";
  public readonly installGuide = `
- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
`;

  public async ensureCurrentCluster() {
    // TODO: do this... then make telepresence module, then aggregate all in CLI module
  }

  public async getCurrentCluster() {
  }

  public async getCurrentNamespace() {
    // return exec(`gcloud auth login`)
    //   .then(res => {
    //     if (res.childProcess.exitCode === 0) {
    //       return this.loginStatus();
    //     }
    //
    //     throw res.stderr;
    //   });
  }
}

const singletonKubectl = new Kubectl();

singletonKubectl.installedVersion().then(console.log);

export default singletonKubectl;
