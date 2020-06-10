import { BrokerOptions, Errors } from "moleculer";
import { SDKModule } from "../common";
import { ValidationErrorEntry } from "./validation";
import Validator from "fastest-validator";
export { Validator };
export declare class Moleculer extends SDKModule {
    getInstalledVersion(): Promise<any>;
    readonly minInstalledVersion = "v0.7.1";
    readonly installGuide = "- (optional) Install moleculer CLI by: \"yarn global add moleculer-cli\"\n";
    createServiceBrokerOptions(override?: Omit<BrokerOptions, "namespace" | "transporter">, options?: {
        quiet?: boolean;
    }): BrokerOptions;
    createValidationError(errors: ValidationErrorEntry[]): Errors.ValidationError;
    get validator(): Validator;
    runREPL(): Promise<void>;
    getCurrentContext(timeout?: number): Promise<unknown>;
}
declare const moleculer: Moleculer;
export { moleculer };
