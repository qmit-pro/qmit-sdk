import kleur from "kleur";
export type AppEnv = string;
export type AppKubernetesCluster = string;

export class Context {
  public appEnv: AppEnv = "dev"; // it means application build flavor.
  public appKubernetesCluster: AppKubernetesCluster = "dev"; // it is not current state of kubernetes cluster connection, it means sdk context want to connect to dev cluster of k8s.

  constructor(appEnv?: AppEnv, appKubernetesCluster?: AppKubernetesCluster) {
    console.log(`Creating QMIT SDK Context...`);

    if (!appEnv) {
      console.log(kleur.dim(`Try to read ${kleur.green("APP_ENV")} from process environment variable.`));
      if (!process.env.APP_ENV) {
        console.log(kleur.dim(`Failed to read, use ${kleur.blue("dev")} as APP_ENV`));
      }
    }
    this.setAppEnv(appEnv || process.env.APP_ENV || "dev");

    if (!appKubernetesCluster) {
      console.log(kleur.dim(`Try to read ${kleur.green("APP_K8S_CLUSTER")} from process environment variable.`));
      if (!process.env.APP_K8S_CLUSTER) {
        console.log(kleur.dim(`Failed to read, use ${kleur.blue(this.appEnv)} as APP_K8S_CLUSTER`));
      }
    }
    this.setAppKubernetesCluster(appKubernetesCluster || process.env.APP_K8S_CLUSTER || this.appEnv);

    console.log(`QMIT SDK Context created...\n`);
  }

  public setAppEnv(appEnv: AppEnv) {
    this.appEnv = appEnv;
    console.log(`Set context.appEnv=${kleur.blue(`${this.appEnv}`)}`);
  }

  public setAppKubernetesCluster(appKubernetesCluster: AppKubernetesCluster) {
    this.appKubernetesCluster = appKubernetesCluster;
    console.log(`Set context.appKubernetesCluster=${kleur.blue(`${this.appKubernetesCluster}`)}`);
  }
}

const globalContext = new Context();
export default globalContext;
