import { SDKModule } from "../common";
export declare class GoogleCloud extends SDKModule {
    getInstalledVersion(): Promise<any>;
    readonly minInstalledVersion = "v292.0.0";
    readonly installGuide = "- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)\n- Add \"export PROJECT_ID=qmit-pro\" into your login shell script for easy use of manual \"gcloud\" command.\n- And ask an infrastructure manager to grant GKE and required resources permission to your G-suite account.\n";
    constructor();
    login(): Promise<any>;
    loginStatus(): Promise<any>;
    listClusters(): Promise<any>;
    listSQLInstances(): Promise<any>;
    listRedisInstances(): Promise<any>;
    ensureClusterCredentials(): Promise<{
        cluster: import("../common/context").ClusterName;
        zone: string;
    }>;
}
declare const gcloud: GoogleCloud;
export { gcloud };
