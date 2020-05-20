import kleur from "kleur";
import { exec, SDKModule } from "../common";

export class GoogleCloud extends SDKModule {
  public getInstalledVersion(): Promise<string | null> {
    return exec("gcloud --version")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `v${res.stdout.split("\n")[0].split("SDK ")[1]}`;
        } else {
          return null;
        }
      }, () => null);
  }
  public readonly minInstalledVersion = "v292.0.0";
  public readonly installGuide = `
- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
`;

  public async login() {
    return exec(`gcloud auth login`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return this.loginStatus();
        }

        throw res.stderr;
      });
  }

  public async loginStatus() {
    return exec("gcloud config get-value account")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return exec("gcloud auth print-access-token")
            .then(res2 => {
              if (res2.childProcess.exitCode !== 0) {
                return null;
              }

              return {
                account: res.stdout.trim(),
              };
            }, () => null);
        }

        return null;
      }, () => null);
  }

  public async listClusters() {
    return exec(`gcloud container clusters list --project ${this.context.GCP_PROJECT_ID} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      });
  }

  public async listSQLInstances() {
    return exec(`gcloud sql instances list --project ${this.context.GCP_PROJECT_ID} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      });
  }

  public async listRedisInstances() {
    return exec(`gcloud redis instances list --project ${this.context.GCP_PROJECT_ID} --region ${this.context.GCP_REDIS_REGION} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      });
  }

  public async ensureClusterCredentials() {
    const clusterName = this.context.appKubernetesCluster;
    const clusterZone = (this.context.GKE_CLUSTER_ZONE_MAP as any)[clusterName];
    console.log(`Fetching GKE cluster credentials for cluster=${kleur.blue(clusterName)} ${kleur.dim("(context.appKubernetesCluster)")}\n`);
    return exec(`gcloud container clusters get-credentials --project ${this.context.GCP_PROJECT_ID} --zone ${clusterZone} ${clusterName}`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          console.log(kleur.dim(res.stderr));
          return { cluster: clusterName, zone: clusterZone };
        }

        throw res.stderr;
      });
  }
}

const singletonGoogleCloud = new GoogleCloud();

// singletonGoogleCloud.getInstalledVersion().then(console.log);
//
// singletonGoogleCloud.login().then(console.log);
//
// singletonGoogleCloud.loginStatus().then(console.log);
//
// singletonGoogleCloud.listClusters().then(console.log);
//
// singletonGoogleCloud.ensureClusterCredentials().then(console.log);
//
// singletonGoogleCloud.listSQLInstances().then(console.log);
//
// singletonGoogleCloud.listRedisInstances().then(console.log);

export default singletonGoogleCloud;
