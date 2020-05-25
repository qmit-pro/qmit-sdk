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
      })
      .catch(err => {
        this.context.logger.debug(err);
        return null;
      });
  }
  public readonly minInstalledVersion = "v292.0.0";
  public readonly installGuide = `- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
- Add "export PROJECT_ID=qmit-pro" into your login shell script for easy use of manual "gcloud" command.
- And ask an infrastructure manager to grant GKE and required resources permission to your G-suite account.
`;

  constructor() {
    super();
    this.context.addContextChangeListener(async () => {
      await this.ensureClusterCredentials();
    });
  }

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
            });
        }

        return null;
      })
      .catch(err => {
        this.context.logger.debug(err);
        return null;
      });
  }

  public async listClusters() {
    return exec(`gcloud container clusters list --project ${this.context.GCP_PROJECT_ID} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      })
      .catch(err => {
        this.context.logger.error(err);
        return [];
      });
  }

  public async listSQLInstances() {
    return exec(`gcloud sql instances list --project ${this.context.GCP_PROJECT_ID} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      })
      .catch(err => {
        this.context.logger.error(err);
        return [];
      });
  }

  public async listRedisInstances() {
    return exec(`gcloud redis instances list --project ${this.context.GCP_PROJECT_ID} --region ${this.context.GCP_REDIS_REGION} --format json`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return JSON.parse(res.stdout);
        }

        throw res.stderr;
      })
      .catch(err => {
        this.context.logger.error(err);
        return [];
      });
  }

  public async ensureClusterCredentials() {
    const clusterName = this.context.clusterName;
    const clusterZone = this.context.clusterZone;
    this.context.logger.log(`Fetching GKE cluster credentials for cluster=${kleur.blue(clusterName)} ${kleur.dim("(context.clusterName)")}\n`);
    return exec(`gcloud container clusters get-credentials --project ${this.context.GCP_PROJECT_ID} --zone ${clusterZone} ${clusterName}`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          this.context.logger.error(kleur.dim(res.stderr));
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
