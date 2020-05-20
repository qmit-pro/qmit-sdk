import { SDKModule } from "../common";
export declare class Kubectl extends SDKModule {
    getInstalledVersion(): Promise<string | null>;
    readonly minInstalledVersion = "v1.14.10";
    readonly installGuide = "\n- Install gcloud CLI from: https://cloud.google.com/sdk/install (Can install kubectl CLI together)\n- Auto-completion: kubectl completion [your shell: zsh, bash, ...]\n- Krew; kubectl plugin manager from: https://krew.sigs.k8s.io\n";
    getCurrentContext(): Promise<any>;
}
declare const singletonKubectl: Kubectl;
export default singletonKubectl;
