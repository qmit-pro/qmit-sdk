// process.env.QMIT_SDK_DEBUG = "1";

import yargs from "yargs";
import ctx from "./command/context";
import resource from "./command/resource";
import login from "./command/login";
import cluster from "./command/cluster";
import app from "./command/app";
import open from "./command/open";
import middlewares from "./command/middleware";

export default yargs
  .middleware(middlewares)
  .command(ctx)
  .command(resource)
  .command(login)
  .command(cluster)
  .command(app)
  .command(open)
  .help()
  .version()
  .showHelpOnFail(true)
  .demandCommand()
  .argv;
