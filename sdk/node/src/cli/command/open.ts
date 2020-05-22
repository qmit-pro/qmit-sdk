import yargs from "yargs";

const command: yargs.CommandModule = {
  command: `open [services..]`,
  describe: `List or open public service endpoints.`,
  handler(args) {
    console.log(args);
    // TODO: implement (with recommendation)
  },
  builder(y) {
    return y
      .positional("services", {
        describe: `A list of services to open. Omit it to show possible service list.`,
        type: "string",
      })
      .version(false);
  },
};

export default command;
