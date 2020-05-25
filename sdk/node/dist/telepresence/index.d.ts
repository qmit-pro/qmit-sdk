import { SDKModule } from "../common";
export declare class Telepresence extends SDKModule {
    getInstalledVersion(): Promise<string | null>;
    readonly minInstalledVersion = "v0.105";
    readonly installGuide = "- Install telepresence CLI from: https://www.telepresence.io or \"brew install telepresence\" for macOS\n";
    getCurrentContext(): Promise<{
        sessionId: string | undefined;
        deployment: any;
    } | null>;
    runCommand(args?: string): Promise<void>;
}
declare const telepresence: Telepresence;
export { telepresence };
