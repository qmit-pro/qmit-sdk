import yargs from "yargs";
import { context, vault, gcloud } from "../../";
import contextCommand from "./context";
const services = { vault, gcloud };

const command: yargs.CommandModule = {
  command: `login [services..]`,
  describe: `Invoke login process.`,
  async handler(args) {
    const serviceOptions = args.services as any;
    const enabled = Object.keys(services).reduce((map, service) => {
      map[service] = serviceOptions.length === 0 || serviceOptions.includes(service);
      return map;
    }, {} as {[service in string]: boolean});

    if (enabled.vault) {
      context.logger.log(`=== Login to vault service ===\nAuthenticate with Vault web server with your G-suite account.`);
      const result = await vault.login();
      context.logger.log(`Signed in as ${result.meta.email}\n`);
    }

    if (enabled.gcloud) {
      context.logger.log(`=== Login to gcloud service ===\nAuthenticate with Google Cloud web server with your G-suite account.`);
      const result = await gcloud.login() as any;
      context.logger.log(`Signed in as ${result.account}\n`);
    }

    return contextCommand.handler(args);
  },
  builder(y) {
    return y
      .positional("services", {
        describe: `A list of services to login. Omit it to login to all required services in sequence.`,
        choices: Object.keys(services),
      })
      .version(false);
  },
};

export default command;
