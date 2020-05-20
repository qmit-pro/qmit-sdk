import { BrokerOptions } from "moleculer";
import { SDKModule } from "../common";
export declare class Moleculer extends SDKModule {
    getInstalledVersion(): Promise<string | null>;
    readonly minInstalledVersion = "v0.7.1";
    readonly installGuide = "\n- Install moleculer CLI by: yarn global add moleculer-cli\n";
    createServiceBrokerOptions(override?: Omit<BrokerOptions, "namespace" | "transporter">): BrokerOptions;
    runREPL(): Promise<void>;
    getCurrentContext(timeout?: number): Promise<unknown>;
}
declare const singletonMoleculer: Moleculer;
export default singletonMoleculer;
