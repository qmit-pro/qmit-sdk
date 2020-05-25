import { context } from "./context";

export abstract class SDKModule {
  public readonly context = context;
  public readonly abstract installGuide: string;
  public readonly abstract minInstalledVersion: string;
  public abstract getInstalledVersion(): Promise<string | null>;
}
