"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gcloud = exports.GoogleCloud = void 0;
const tslib_1 = require("tslib");
const kleur_1 = tslib_1.__importDefault(require("kleur"));
const common_1 = require("../common");
class GoogleCloud extends common_1.SDKModule {
    constructor() {
        super();
        this.minInstalledVersion = "v292.0.0";
        this.installGuide = `- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)
- Add "export PROJECT_ID=qmit-pro" into your login shell script for easy use of manual "gcloud" command.
- And ask an infrastructure manager to grant GKE and required resources permission to your G-suite account.
`;
        this.context.addContextChangeListener(async () => {
            await this.ensureClusterCredentials();
        });
    }
    getInstalledVersion() {
        return common_1.exec("gcloud --version")
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `v${res.stdout.split("\n")[0].split("SDK ")[1]}`;
            }
            else {
                return null;
            }
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
    async login() {
        return common_1.exec(`gcloud auth login`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return this.loginStatus();
            }
            throw res.stderr;
        });
    }
    async loginStatus() {
        return common_1.exec("gcloud config get-value account")
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return common_1.exec("gcloud auth print-access-token")
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
    async listClusters() {
        return common_1.exec(`gcloud container clusters list --project ${this.context.GCP_PROJECT_ID} --format json`)
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
    async listSQLInstances() {
        return common_1.exec(`gcloud sql instances list --project ${this.context.GCP_PROJECT_ID} --format json`)
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
    async listRedisInstances() {
        return common_1.exec(`gcloud redis instances list --project ${this.context.GCP_PROJECT_ID} --region ${this.context.GCP_REDIS_REGION} --format json`)
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
    async ensureClusterCredentials() {
        const clusterName = this.context.clusterName;
        const clusterZone = this.context.clusterZone;
        this.context.logger.log(`Fetching GKE cluster credentials for cluster=${kleur_1.default.blue(clusterName)} ${kleur_1.default.dim("(context.clusterName)")}\n`);
        return common_1.exec(`gcloud container clusters get-credentials --project ${this.context.GCP_PROJECT_ID} --zone ${clusterZone} ${clusterName}`)
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                this.context.logger.error(kleur_1.default.dim(res.stderr));
                return { cluster: clusterName, zone: clusterZone };
            }
            throw res.stderr;
        });
    }
}
exports.GoogleCloud = GoogleCloud;
const gcloud = new GoogleCloud();
exports.gcloud = gcloud;
//# sourceMappingURL=index.js.map