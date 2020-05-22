import yargs from "yargs";

const command: yargs.CommandModule = {
  command: `login [services..]`,
  describe: `Invoke login process.`,
  handler(args) {
    console.log(args);
    // TODO: implement
  },
  builder(y) {
    const services = ["vault", "gcloud", "kubectl"];
    return y
      .positional("services", {
        describe: `A list of services to login. Omit it to login to all required services in sequence.`,
        choices: services,
      })
      .version(false);
  },
};

export default command;
