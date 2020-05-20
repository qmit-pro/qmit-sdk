import { SDKModule } from "../common";
export declare class GoogleCloud extends SDKModule {
    getInstalledVersion(): Promise<string | null>;
    readonly minInstalledVersion = "v292.0.0";
    readonly installGuide = "\n- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)\n";
    login(): Promise<{
        account: string;
    } | null>;
    loginStatus(): Promise<{
        account: string;
    } | null>;
    listClusters(): Promise<any>;
    listSQLInstances(): Promise<any>;
    listRedisInstances(): Promise<any>;
    ensureClusterCredentials(): Promise<{
        cluster: string;
        zone: any;
    }>;
}
declare const singletonGoogleCloud: GoogleCloud;
export default singletonGoogleCloud;
