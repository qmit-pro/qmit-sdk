import globalContext from "./context";

export abstract class SDKModule {
  public readonly context = globalContext;
  public readonly abstract installGuide: string;
  public readonly abstract minInstalledVersion: string;
  public abstract installedVersion(): Promise<string | null>;
}
