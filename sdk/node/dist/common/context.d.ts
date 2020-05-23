export declare type AppEnv = "dev" | "prod";
export declare type ClusterName = "internal" | "dev" | "prod";
export declare type Config = {
    context: {
        appEnv: AppEnv;
        clusterName: ClusterName;
    };
};
export declare type ContextChangeListener = (ctx: Partial<Config["context"]>) => Promise<void>;
export declare class Context {
    readonly version: string;
    readonly envVarName: {
        debug: string;
        appEnv: string;
        clusterName: string;
    };
    readonly VAULT_ADDRESS = "https://vault.internal.qmit.pro";
    readonly GCP_PROJECT_ID = "qmit-pro";
    readonly GCP_VPN_CIRD = "10.0.0.0/8";
    readonly GCP_REDIS_REGION = "asia-northeast1";
    readonly GKE_APP_CLUSTER_MAP: {
        [key in AppEnv]: ClusterName[];
    };
    readonly GKE_CLUSTER_ZONE_MAP: {
        [key in ClusterName]: string;
    };
    readonly appEnvs: AppEnv[];
    appEnv: AppEnv;
    readonly clusterNames: ClusterName[];
    clusterName: ClusterName;
    getClusterNamesInAppEnv(appEnv: AppEnv): ClusterName[];
    getAppEnvOfClusterName(clusterName: ClusterName): AppEnv;
    get clusterZone(): string;
    getClusterZone(clusterName: ClusterName): string;
    get clusterFullName(): string;
    getClusterFullName(clusterName: ClusterName): string;
    private readonly debugIgnoredConsole;
    get logger(): Console;
    constructor();
    readonly configFilePath: string;
    readConfig(): Config | undefined;
    writeConfig(): void;
    setContext(ctx?: Partial<Config["context"]>): void;
    private contextChangeListeners;
    addContextChangeListener(listener: ContextChangeListener): void;
    removeContextChangeListener(listener: ContextChangeListener): void;
}
declare const globalContext: Context;
export default globalContext;
