export declare type AppEnv = string;
export declare type AppKubernetesCluster = string;
export declare class Context {
    readonly VAULT_ADDRESS = "https://vault.internal.qmit.pro";
    readonly GCP_PROJECT_ID = "qmit-pro";
    readonly GKE_CLUSTER_ZONE_MAP: {
        dev: string;
        internal: string;
        prod: string;
    };
    readonly GCP_REDIS_REGION = "asia-northeast1";
    readonly GCP_VPN_CIRD = "10.0.0.0/8";
    appEnv: AppEnv;
    appKubernetesCluster: AppKubernetesCluster;
    get appKubernetesClusterFullName(): string;
    getKubernetesClusterFullName(alias: AppKubernetesCluster): string;
    constructor(appEnv?: AppEnv, appKubernetesCluster?: AppKubernetesCluster);
    setAppEnv(appEnv: AppEnv): void;
    setAppKubernetesCluster(appKubernetesCluster: AppKubernetesCluster): void;
}
declare const globalContext: Context;
export default globalContext;
