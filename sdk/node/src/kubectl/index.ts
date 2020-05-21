// import kleur from "kleur";
import { exec, SDKModule } from "../common";

export class Kubectl extends SDKModule {
  public getInstalledVersion(): Promise<string | null> {
    return exec("kubectl version -o json")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `${JSON.parse(res.stdout).clientVersion.gitVersion}`;
        } else {
          return null;
        }
      })
      .catch(err => {
        this.context.logger.error(err);
        return null;
      });
  }
  public readonly minInstalledVersion = "v1.14.10";
  public readonly installGuide = `- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
- Auto-completion: kubectl completion [your shell: zsh, bash, ...]
- Krew; kubectl plugin manager from: https://krew.sigs.k8s.io
`;

  public async getCurrentContext() {
    return exec(`kubectl config view -o json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          const doc = JSON.parse(res.stdout);
          const item = doc.contexts.find((c: any) => c.name === doc["current-context"]);
          if (item) {
            if (!item.context.namespace) {
              item.context.namespace = null;
            }
            return {
              ...item.context,
            };
          }
        }

        return null;
      })
      .catch(err => {
        this.context.logger.error(err);
        return null;
      });
  }
}

const singletonKubectl = new Kubectl();

// singletonKubectl.getInstalledVersion().then(console.log);
// singletonKubectl.getCurrentContext().then(console.log);

export default singletonKubectl;
