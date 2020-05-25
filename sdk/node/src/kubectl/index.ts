// import kleur from "kleur";
import { exec, SDKModule } from "../common";

export class Kubectl extends SDKModule {
  public getInstalledVersion() {
    return exec("kubectl version -o json")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `${JSON.parse(res.stdout).clientVersion.gitVersion}`;
        } else {
          return null as any;
        }
      })
      .catch(err => {
        this.context.logger.debug(err);
        return null as any;
      });
  }
  public readonly minInstalledVersion = "v1.14.10";
  public readonly installGuide = `- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
- Can enable auto-completion by: "kubectl completion <zsh, bash, ...>"
- Can install krew; kubectl plugin manager from: https://krew.sigs.k8s.io
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

        return null as any;
      })
      .catch(err => {
        this.context.logger.debug(err);
        return null as any;
      });
  }
}

const kubectl = new Kubectl();

// singletonKubectl.getInstalledVersion().then(console.log);
// singletonKubectl.getCurrentContext().then(console.log);

export { kubectl };
