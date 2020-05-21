// process.env.QMIT_SDK_DEBUG = "1";

import yargs from "yargs";
import context from "./command/context";
import login from "./command/login";
import cluster from "./command/cluster";
import app from "./command/app";
import open from "./command/open";

export default yargs
  .command(context)
  .command(login)
  .command(cluster)
  .command(app)
  .command(open)
  .help()
  .version()
  .showHelpOnFail(true)
  .demandCommand()
  .argv;
