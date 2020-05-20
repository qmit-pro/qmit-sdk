"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Context = void 0;
const tslib_1 = require("tslib");
const kleur_1 = tslib_1.__importDefault(require("kleur"));
class Context {
    constructor(appEnv, appKubernetesCluster) {
        this.VAULT_ADDRESS = "https://vault.internal.qmit.pro";
        this.GCP_PROJECT_ID = "qmit-pro";
        this.GKE_CLUSTER_ZONE_MAP = {
            dev: "asia-northeast1-a",
            internal: "asia-northeast1-a",
            prod: "asia-northeast1-a",
        };
        this.GCP_REDIS_REGION = "asia-northeast1";
        this.GCP_VPN_CIRD = "10.0.0.0/8";
        this.appEnv = "dev"; // it means application build flavor.
        this.appKubernetesCluster = "dev"; // it is not current state of kubernetes cluster connection, it means sdk context want to connect to dev cluster of k8s.
        console.log(`Creating QMIT SDK Context...`);
        if (!appEnv) {
            console.log(kleur_1.default.dim(`Try to read ${kleur_1.default.green("APP_ENV")} from process environment variable.`));
            if (!process.env.APP_ENV) {
                console.log(kleur_1.default.dim(`Failed to read, use ${kleur_1.default.blue("dev")} as APP_ENV`));
            }
        }
        this.setAppEnv(appEnv || process.env.APP_ENV || "dev");
        if (!appKubernetesCluster) {
            console.log(kleur_1.default.dim(`Try to read ${kleur_1.default.green("APP_K8S_CLUSTER")} from process environment variable.`));
            if (!process.env.APP_K8S_CLUSTER) {
                console.log(kleur_1.default.dim(`Failed to read, use ${kleur_1.default.blue(this.appEnv)} as APP_K8S_CLUSTER`));
            }
        }
        this.setAppKubernetesCluster(appKubernetesCluster || process.env.APP_K8S_CLUSTER || this.appEnv);
        console.log(`QMIT SDK Context created...\n`);
    }
    get appKubernetesClusterFullName() {
        return this.getKubernetesClusterFullName(this.appKubernetesCluster);
    }
    ;
    getKubernetesClusterFullName(alias) {
        return `gke_${this.GCP_PROJECT_ID}_${this.GKE_CLUSTER_ZONE_MAP[alias]}_${alias}`;
    }
    setAppEnv(appEnv) {
        this.appEnv = appEnv;
        console.log(`Set context.appEnv=${kleur_1.default.blue(`${this.appEnv}`)}`);
    }
    setAppKubernetesCluster(appKubernetesCluster) {
        this.appKubernetesCluster = appKubernetesCluster;
        console.log(`Set context.appKubernetesCluster=${kleur_1.default.blue(`${this.appKubernetesCluster}`)}`);
    }
}
exports.Context = Context;
const globalContext = new Context();
exports.default = globalContext;
//# sourceMappingURL=context.js.map