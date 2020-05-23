import kleur from "kleur";
import yargs from "yargs";
import { table } from "table";
import { context, vault } from "../../";
import { open } from "../../common";

const command: yargs.CommandModule = {
  command: `open [services..]`,
  describe: `List or open public service endpoints. Service information are derived from ${kleur.dim(`vault: /data/common/services`)}`,
  async handler(args) {
    const serviceOptions = args.services as string[];

    const data = await vault.fetch(async (get, list) => {
      const [
        services,
        serviceKeysWithCredentials,
      ] = await Promise.all([
        get("common/data/services").then(res => res.data) as unknown as {
          groups: {
            desc: string;
            items: {
              key: string;
              desc: string;
              uri: string;
              deprecated?: boolean;
            }[]
          }[];
        },
        list("common/metadata/services/credentials").then(res => res.keys) as unknown as string[],
      ]);
      return {
        services,
        serviceKeysWithCredentials,
        serviceKeys: services.groups.reduce((names, g) => names.concat(g.items.map((i) => i.key)), [] as string[]),
      };
    });

    const filter = (args.filter as string || "").toLowerCase();
    const openURIs: {key:string, uri:string}[] = [];
    let found = false;
    for (const { desc: groupDesc, items } of data.services.groups) {
      const rows = items.map(({ desc, key, uri }) => {
        // filter item with options
        if (serviceOptions.length > 0 && !serviceOptions.includes(key)) {
          return null;
        }

        // filter item with keyword
        if (filter && !key.toLowerCase().includes(filter) && !desc.toLowerCase().includes(filter)) {
          return null;
        }

        // add uri to open later
        const toOpen = serviceOptions.includes(key);
        const willOpen = toOpen && uri;
        if (willOpen) {
          openURIs.push({ key, uri });
        }

        const hasCredentials = data.serviceKeysWithCredentials.includes(key);
        return [
          toOpen ? kleur.green(key) : key,
          `${desc}\n${kleur.dim(uri)}${hasCredentials ? "\n" + kleur.dim().red(`vault kv get common/services/credentials/${key}`) : ""}`,
        ];
      }).filter(row => !!row);
      if (rows.length === 0) continue;
      found = true;

      context.logger.log(`=== ${groupDesc} ===`);
      context.logger.log(`${table(rows, {
        columnDefault: {
          alignment: "left",
        },
      })}`);
    }

    if (!found) {
      context.logger.log(`There is no service item related to keyword: ${filter}`);
    } else if (openURIs.length > 0) {
      if (openURIs.length > 3) {
        context.logger.error(`Too many services to open at once, for sure?`)
      } else {
        for (const { uri } of openURIs) {
          open(uri);
        }
      }
    }
  },
  builder(y) {
    return y
      // TODO: support auto-completion for too many services...
      .positional("services", {
        describe: `A list of services to open. Omit it just to show service list.`,
        type: "string",
      })
      .options("filter", {
        alias: "f",
        describe: "Filter the list of services",
        type: "string",
      })
      .version(false);
  },
};

export default command;
