import { VaultReaderFactory, VaultReaderOptions } from "vault-sync/dist/async";
import { SDKModule } from "../common";
export declare class Vault extends SDKModule {
    getInstalledVersion(): Promise<any>;
    readonly minInstalledVersion = "v1.4.1";
    readonly installGuide = "- Install vault CLI from https://www.vaultproject.io/downloads or \"brew install vault\" for macOS\n- Add \"export VAULT_ADDR=https://vault.internal.qmit.pro\" into your login shell script for easy use of manual \"vault\" command.\n- And ask an infrastructure manager to grant Vault permission to your G-suite account.\n";
    login(): Promise<any>;
    loginStatus(): Promise<any>;
    fetch<T, S>(factory: VaultReaderFactory<T, Omit<{
        appEnv: string;
        clusterName: string;
    }, keyof S> & S>, opts?: Partial<VaultReaderOptions<S>>): T;
    readonly webInterfaceURL: string;
}
declare const vault: Vault;
export { vault };
