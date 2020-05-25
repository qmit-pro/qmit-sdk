import kleur from "kleur";
import path from "path";
import os from "os";
import fs from "fs";
import { exec } from "./index";
export { exec } from "child-process-promise";

export type AppEnv = "dev"|"prod";
export type ClusterName = "internal"|"dev"|"prod" /* dev2, dev3, prod2, prod3, ... later */;
export type Config = {
  context: {
    appEnv: AppEnv,
    clusterName: ClusterName,
  },
};
export type ContextChangeListener = (ctx: Partial<Config["context"]>) => Promise<void>;

export class Context {
  public async getInstalledVersion() {
    return `v${JSON.parse(fs.readFileSync(path.join(__dirname, "../../../../package.json")).toString()).version}`.trim();
  }
  public getLatestVersion(): Promise<string> {
    return exec("npm show qmit-sdk version")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `v${res.stdout.split("\n")[0]}`.trim()
        }
        return null as any;
      })
      .catch(err => {
        this.logger.debug(err);
        return null as any;
      }) as any;
  }
  public readonly envVarName = {
    debug: "QMIT_SDK_DEBUG",
    appEnv: "QMIT_APP_ENV",
    clusterName: "QMIT_CLUSTER_NAME",
  };
  public readonly VAULT_ADDRESS = "https://vault.internal.qmit.pro";
  public readonly GCP_PROJECT_ID = "qmit-pro";
  public readonly GCP_VPN_CIRD = "10.0.0.0/8";
  public readonly GCP_REDIS_REGION = "asia-northeast1";
  public readonly GKE_APP_CLUSTER_MAP: {[key in AppEnv]: ClusterName[]} = {
    dev: ["dev", /* "dev2", "dev3", ... later */],
    prod: ["prod", /* "prod2", "prod3", ... later */],
  };
  public readonly GKE_CLUSTER_ZONE_MAP: {[key in ClusterName]: string} = {
    dev: "asia-northeast1-a",
    prod: "asia-northeast1-a",
    /* dev2, dev3, prod2, prod3, ... later */
    internal: "asia-northeast1-a", // where vault and other central infra belongs to
  };

  // AppEnv means application deployment stage. It is a symbol.
  public readonly appEnvs = Object.keys(this.GKE_APP_CLUSTER_MAP) as AppEnv[];
  public appEnv: AppEnv = this.appEnvs[0];

  // ClusterName means name of real cluster among many of them. It is a real instance.
  public readonly clusterNames = Object.values(this.GKE_APP_CLUSTER_MAP).reduce((a, b) => a.concat(b), []) as ClusterName[];
  public clusterName: ClusterName = this.getClusterNamesInAppEnv(this.appEnv)[0];

  public getClusterNamesInAppEnv(appEnv: AppEnv) {
    return this.GKE_APP_CLUSTER_MAP[appEnv] || [];
  }
  public getAppEnvOfClusterName(clusterName: ClusterName) {
    return Object.keys(this.GKE_APP_CLUSTER_MAP)
      .find(appEnv => this.GKE_APP_CLUSTER_MAP[appEnv as AppEnv].includes(clusterName))! as AppEnv;
  }
  public get clusterZone() {
    return this.getClusterZone(this.clusterName);
  }
  public getClusterZone(clusterName: ClusterName) {
    return this.GKE_CLUSTER_ZONE_MAP[clusterName];
  }

  public get clusterFullName() {
    return this.getClusterFullName(this.clusterName);
  }
  public getClusterFullName(clusterName: ClusterName) {
    return `gke_${this.GCP_PROJECT_ID}_${(this.GKE_CLUSTER_ZONE_MAP as any)[clusterName]}_${clusterName}`;
  }

  private readonly debugIgnoredConsole: Console = {
    ...console,
    debug(...args: any[]) {},
  };
  public get logger(): Console {
    return process.env[this.envVarName.debug] ? console : this.debugIgnoredConsole;
  }

  constructor() {
    this.logger.debug(`Creating QMIT SDK Context...`);

    const config = this.readConfig();
    let appEnv: AppEnv;
    let clusterName: ClusterName;

    this.logger.debug(kleur.dim(`Try to read ${kleur.green(this.envVarName.appEnv)} from process environment variable.`));
    if (process.env[this.envVarName.appEnv]) {
      appEnv = process.env[this.envVarName.appEnv]! as AppEnv;
    } else {
      appEnv = config && config.context && config.context.appEnv || this.appEnvs[0];
      this.logger.debug(kleur.dim(`Failed to read environment variable, use ${kleur.blue(appEnv)} as ${this.envVarName.appEnv}`));
    }

    this.logger.debug(kleur.dim(`Try to read ${kleur.green(this.envVarName.clusterName)} from process environment variable.`));
    if (process.env[this.envVarName.clusterName]) {
      clusterName = process.env[this.envVarName.clusterName]! as ClusterName;
    } else {
      clusterName = config && config.context && config.context.clusterName || this.clusterNames[0];
      this.logger.debug(kleur.dim(`Failed to read environment variable, use ${kleur.blue(clusterName)} as ${this.envVarName.clusterName}`));
    }

    // here no need to wait for context change handlers, cause any handlers haven't registered yet
    try {
      this.setContext({ appEnv, clusterName });
    } catch (err) {
      this.logger.error(err)
      this.logger.log("Fallback to default appEnv and clusterName");
      this.setContext();
      this.writeConfig();
    }

    if (!config) {
      this.writeConfig();
    }

    this.logger.debug(kleur.dim(`QMIT SDK Context created...\n`));
  }

  public readonly configFilePath = path.join(os.homedir(), ".qmit-sdk");

  public readConfig(): Config | undefined {
    try {
      return JSON.parse(fs.readFileSync(this.configFilePath).toString("utf-8"));
    } catch {
      this.logger.log(kleur.dim(`Failed to read ${kleur.green(this.configFilePath)} file.`));
    }
  }

  public writeConfig() {
    const file: Config = {
      context: {
        appEnv: this.appEnv,
        clusterName: this.clusterName,
      },
    };
    fs.writeFileSync(this.configFilePath, JSON.stringify(file, null, 2));
    this.logger.log(kleur.dim(`Succeed to write ${kleur.green(this.configFilePath)} file.`));
  }

  public async setContext(ctx: Partial<Config["context"]> = {}) {
    let appEnv: AppEnv;
    let clusterName: ClusterName;
    let clusterNamesInAppEnv;

    if (ctx.appEnv && ctx.clusterName) {
      appEnv = ctx.appEnv;
      clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
      clusterName = ctx.clusterName;
    } else if (ctx.appEnv) {
      appEnv = ctx.appEnv;
      clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
      clusterName = clusterNamesInAppEnv[0];
    } else if (ctx.clusterName) {
      clusterName = ctx.clusterName;
      appEnv = this.getAppEnvOfClusterName(clusterName);
      clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
    } else {
      appEnv = this.appEnvs[0];
      clusterNamesInAppEnv = this.getClusterNamesInAppEnv(appEnv);
      clusterName = clusterNamesInAppEnv[0];
    }

    if (!this.clusterNames.includes(clusterName)) {
      throw new Error(`Invalid ClusterEnv: ${kleur.red(clusterName)} among ${this.clusterNames.join(", ")}`);
    }
    if (!this.appEnvs.includes(appEnv)) {
      throw new Error(`Invalid AppEnv: ${kleur.red(appEnv)} among ${this.appEnvs.join(", ")}`);
    }
    if (!clusterNamesInAppEnv.includes(clusterName)) {
      throw new Error(`Invalid ClusterEnv in ${kleur.blue(appEnv)} AppEnv: ${kleur.red(clusterName)} among ${clusterNamesInAppEnv.join(", ")}`);
    }
    this.appEnv = appEnv;
    this.clusterName = clusterName;
    this.logger.debug(`Set appEnv=${kleur.blue(`${this.appEnv}`)}, clusterName=${kleur.blue(`${this.clusterName}`)}`);

    await Promise.all(
      [...this.contextChangeListeners.values()]
        .map(listener => listener({ appEnv, clusterName }).catch(err => this.logger.error(err)))
    );
  }

  private contextChangeListeners: Set<ContextChangeListener> = new Set();
  public addContextChangeListener(listener: ContextChangeListener): void {
    this.contextChangeListeners.add(listener);
  }
  public removeContextChangeListener(listener: ContextChangeListener): void {
    this.contextChangeListeners.delete(listener);
  }
}

const context = new Context();
export { context };
