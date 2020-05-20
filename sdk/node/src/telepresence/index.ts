import kleur from "kleur";
import path from "path";
import fs from "fs";
import { exec, spawn, SDKModule } from "../common";

export class Telepresence extends SDKModule {
  public getInstalledVersion(): Promise<string | null> {
    return exec("telepresence --version")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `v${res.stdout.trim()}`;
        } else {
          return null;
        }
      }, () => null);
  }
  public readonly minInstalledVersion = "v0.105";
  public readonly installGuide = `
- Install telepresence CLI from: https://www.telepresence.io (brew install telepresence for macOS)
`;

  public async getCurrentContext() {
    const tmpPath = "/tmp";
    const filePaths = fs.readdirSync(tmpPath);
    let sessionId: string | undefined;
    for (const filePath of filePaths) {
      if (!filePath.startsWith("tel-")) continue;
      try {
        const sid = fs.readFileSync(path.join(tmpPath, filePath, "session_id.txt")).toString().trim();
        try {
          const mountPath = path.join(tmpPath, filePath, "fs");
          fs.statSync(mountPath);
          if (fs.readdirSync(mountPath).length > 0) {
            sessionId = sid;
          } else {
            throw new Error();
          }
        } catch (err) {
          // remove dead telepresence session garbage
          console.log(kleur.dim(`Deleting dead telepresence session: ${kleur.red(sid)}`));
          fs.rmdirSync(path.join(tmpPath, filePath), { recursive: true });
        }
      } catch {
      }
    }

    if (!sessionId) {
      return null;
    }

    return exec(`kubectl get deployment --selector=telepresence=${sessionId} -o json --all-namespaces`)
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          const doc = JSON.parse(res.stdout);
          const item = doc.items[0];

          return {
            sessionId,
            deployment: item || null,
          };
        }

        return null;
      }, () => {
        return {
          sessionId,
          deployment: null,
        };
      });
  }

  public async runCommand(args: string = "") {
    const oldSession = await this.getCurrentContext();
    if (oldSession) {
      const err = new Error("telepresence session already exists");
      (err as any).data = oldSession;
      throw err;
    }

    const { childProcess } = await spawn(
      `telepresence`,
      `--logfile - --also-proxy ${this.context.GCP_VPN_CIRD} ${args}`.split(" ").map(arg => arg.trim()).filter(arg => !!arg),
      {
        detached: false,
        shell: false,
        stdio: [process.stdin, process.stdout, process.stderr],
      });
    process.once("beforeExit", () => childProcess.kill("SIGTERM"));
  }
}

const singletonTelepresence = new Telepresence();

// singletonTelepresence.getInstalledVersion().then(console.log);
// singletonTelepresence.getCurrentContext().then(console.log);
// singletonTelepresence.runCommand();

export default singletonTelepresence;
