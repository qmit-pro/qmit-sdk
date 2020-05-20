export declare abstract class SDKModule {
    readonly context: import("./context").Context;
    abstract readonly installGuide: string;
    abstract readonly minInstalledVersion: string;
    abstract getInstalledVersion(): Promise<string | null>;
}
