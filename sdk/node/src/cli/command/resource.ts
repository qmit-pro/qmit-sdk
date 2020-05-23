import kleur from "kleur";
import yargs from "yargs";
import { table } from "table";
import { gcloud } from "../../";


const command: yargs.CommandModule = {
  command: `resource`,
  aliases: "res",
  describe: `Show cloud resource of current context.`,
  async handler(args) {
    // collect data
    const [clustersList, sqlInstancesList, redisInstancesList] = await Promise.all([
      gcloud.listClusters(),
      gcloud.listSQLInstances(),
      gcloud.listRedisInstances(),
    ]);

    gcloud.context.logger.log(`=== Google Cloud Resource (project: ${kleur.blue(gcloud.context.GCP_PROJECT_ID)}) ===\n${
      table([
        [
          `Clusters ${kleur.dim(`(GKE)`)}`,
          `SQL Instances`,
          `Redis Instances`,
        ],
        [
          (items => {
            if (items.length === 0) return "-";
            return items.map((item: any) => {
              return `name: ${item.name === gcloud.context.clusterName ? kleur.blue(item.name) : item.name}\nzones: ${item.locations.join(", ")}\nnetwork: ${item.network}\ncidr: ${item.clusterIpv4Cidr}\nstate: ${item.status}\nmaster endpoint: ${item.endpoint}\nmaster version: ${item.currentMasterVersion}\nnode version: ${item.currentNodeVersion}\nnode #: ${item.currentNodeCount}`;
            }).join("\n-----\n");
          })(clustersList),
          (items => {
            if (items.length === 0) return "-";
            return items.map((item: any) => {
              return `name: ${item.name}\nhost: ${item.ipAddresses.map((ip: any) => `${ip.ipAddress} (${ip.type})`).join(", ")}\nport: ${item.port || "-"}\nversion: ${item.databaseVersion}\nzone: ${item.gceZone}\nstate: ${item.state}\ntier: ${item.settings.tier}`;
            }).join("\n-----\n");
          })(sqlInstancesList),
          (items => {
            if (items.length === 0) return "-";
            return items.map((item: any) => {
              return `name: ${item.displayName}\nhost: ${item.host} (${item.reservedIpRange})}\nport: ${item.port}\nversion: ${item.redisVersion}\nzone: ${item.locationId}\nstate: ${item.state}\ntier: ${item.tier}`;
            }).join("\n-----\n");
          })(redisInstancesList),
        ],
      ], {
        columnDefault: {
          alignment: "left",
          wrapWord: true,
          width: 35,
        },
      })
    }${kleur.dim(`https://console.cloud.google.com/home/dashboard?&project=${gcloud.context.GCP_PROJECT_ID}`)}\n`);

    // force quit
    process.exit(0);
  },
  builder(y) {
    return y
      .version(false);
  },
};

export default command;
