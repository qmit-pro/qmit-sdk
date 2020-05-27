import { SDKModule } from "../common";
export declare class Telepresence extends SDKModule {
    getInstalledVersion(): Promise<any>;
    readonly minInstalledVersion = "v0.105";
    readonly installGuide = "- Install telepresence CLI from: https://www.telepresence.io or \"brew install telepresence\" for macOS\n";
    getCurrentContext(): Promise<any>;
    runCommand(args?: string[]): Promise<void>;
}
declare const telepresence: Telepresence;
export { telepresence };
