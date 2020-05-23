import { SDKModule } from "../common";
import { VaultReaderFactory } from "vault-sync/dist/async";
export declare class Vault extends SDKModule {
    getInstalledVersion(): Promise<string | null>;
    readonly minInstalledVersion = "v1.4.1";
    readonly installGuide = "- Install vault CLI from https://www.vaultproject.io/downloads or \"brew install vault\" for macOS\n- Add \"export VAULT_ADDR=https://vault.internal.qmit.pro\" into your login shell script for easy use of manual \"vault\" command.\n- And ask an infrastructure manager to grant Vault permission to your G-suite account.\n";
    login(): Promise<any>;
    loginStatus(): Promise<any>;
    fetch<T = any>(factory: VaultReaderFactory<T>): T;
    webInterfaceURL: string;
}
declare const singletonVault: Vault;
export default singletonVault;
