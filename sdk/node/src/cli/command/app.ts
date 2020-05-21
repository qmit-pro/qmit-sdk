import kleur from "kleur";
import yargs from "yargs";
import { moleculer } from "../../";

const command: yargs.CommandModule = {
  command: `app`,
  describe: `Create a service broker with current app-env context. It will run a REPL interface to communicate with internal nodes and services. A VPN-tunnel with proper cluster should be established before.\nIt runs: ${kleur.dim(`moleculer connect redis://....`)}`,
  handler(args) {
    moleculer.runREPL();
  },
  builder(y) {
    return y
      .version(false);
  },
};

export default command;
