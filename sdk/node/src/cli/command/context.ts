import kleur from "kleur";
import yargs from "yargs";
import { table } from "table";
import { context, vault, gcloud, kubectl, telepresence, moleculer } from "../../";

const services = {
  vault,
  gcloud,
  kubectl,
  telepresence,
  moleculer,
};

const command: yargs.CommandModule = {
  command: `context [services..]`,
  aliases: "ctx",
  describe: `Configure or show current context.`,
  async handler(args) {
    // just print install guides
    if (args.installGuide) {
      for (const [serviceName, service] of Object.entries(services)) {
        context.logger.log(`=== Install ${serviceName} CLI ===\n${service.installGuide}\n`);
      }
      return;
    }

    // set context if has optional args
    if (args.appEnv || args.clusterName) {
      await context.setContext({ appEnv: args.appEnv as any, clusterName: args.clusterName as any });
      context.writeConfig();
    }

    // show context, login status and other possible information
    const serviceOptions = args.services as any;
    const enabled = Object.keys(services).reduce((map, service) => {
      map[service] = serviceOptions.length === 0 || serviceOptions.includes(service);
      return map;
    }, {} as {[service in string]: boolean});

    // collect data
    const data = await Promise.all([
      enabled.vault ? vault.getInstalledVersion() : Promise.resolve(),
      enabled.vault ? vault.loginStatus() : Promise.resolve(),
      enabled.gcloud ? gcloud.getInstalledVersion() : Promise.resolve(),
      enabled.gcloud ? gcloud.loginStatus() : Promise.resolve(),
      enabled.gcloud ? gcloud.listClusters() : Promise.resolve(),
      enabled.gcloud ? gcloud.listSQLInstances() : Promise.resolve(),
      enabled.gcloud ? gcloud.listRedisInstances() : Promise.resolve(),
      enabled.kubectl ? kubectl.getInstalledVersion() : Promise.resolve(),
      enabled.kubectl ? kubectl.getCurrentContext() : Promise.resolve(),
      enabled.telepresence ? telepresence.getInstalledVersion() : Promise.resolve(),
      enabled.telepresence ? telepresence.getCurrentContext() : Promise.resolve(),
      enabled.moleculer ? moleculer.getInstalledVersion() : Promise.resolve(),
      enabled.moleculer ? moleculer.getCurrentContext() : Promise.resolve(),
      context.getInstalledVersion(),
      context.getLatestVersion(),
    ])
      .then(res => {
          return {
            vault: {
              installedVersion: res[0],
              loginStatus: res[1],
            },
            gcloud: {
              installedVersion: res[2],
              loginStatus: res[3],
              clustersList: res[4],
              sqlInstancesList: res[5],
              redisInstancesList: res[6],
            },
            kubectl: {
              installedVersion: res[7],
              currentContext: res[8],
            },
            telepresence: {
              installedVersion: res[9],
              currentContext: res[10],
            },
            moleculer: {
              installedVersion: res[11],
              currentContext: res[12],
            },
            context: {
              installedVersion: res[13],
              latestVersion: res[14],
            },
          };
      });

    // cli context
    const tableRows = [
      [
        "Service",
        "Current Context",
        "Installed CLI",
      ],
    ];
    const installGuides: {[service: string]: string} = {};

    tableRows.push([
      `qmit`,
      `app-env: ${kleur.blue(context.appEnv)}\ncluster-name: ${kleur.blue(context.clusterName)}\ncluster-zone: ${context.clusterZone}\nkubectl-context: ${context.clusterFullName}`,
      `${data.context.installedVersion !== data.context.latestVersion ? kleur.red(data.context.installedVersion) : data.context.installedVersion}${kleur.dim(`/${data.context.latestVersion}`)}`,
    ]);

    // vault
    if (enabled.vault) {
      tableRows.push([
        `vault`,
        (loginStatus => {
          if (!loginStatus) return "-";
          return `email: ${kleur.blue(loginStatus.meta.email)}\nname: ${loginStatus.meta.name}\nrole: ${loginStatus.meta.role}\npolicies: ${kleur.blue(loginStatus.identity_policies.join(", "))}`;
        })(data.vault.loginStatus),
        (installedVersion => {
          if (!installedVersion) {
            installGuides.vault = vault.installGuide;
          }
          return `${installedVersion || "-"}${kleur.dim(`/${vault.minInstalledVersion}`)}`;
        })(data.vault.installedVersion),
      ]);
    }

    // gcloud
    if (enabled.gcloud) {
      tableRows.push([
        `gcloud`,
        (loginStatus => {
          if (!loginStatus) return "-";
          return `account: ${kleur.blue(loginStatus.account)}`;
        })(data.gcloud.loginStatus),
        (installedVersion => {
          if (!installedVersion) {
            installGuides.gcloud = gcloud.installGuide;
          }
          return `${installedVersion || "-"}${kleur.dim(`/${gcloud.minInstalledVersion}`)}`;
        })(data.gcloud.installedVersion),
      ]);
    }

    // kubectl
    if (enabled.kubectl) {
      tableRows.push([
        `kubectl`,
        (ctx => {
          if (!ctx) return "-";
          return `cluster: ${(ctx.cluster === context.clusterFullName ? kleur.blue : kleur.red)(ctx.cluster)}\nuser: ${(ctx.user === context.clusterFullName ? kleur.blue : kleur.red)(ctx.user)}\nnamespace: ${ctx.namespace || kleur.dim("default")}`;
        })(data.kubectl.currentContext),
        (installedVersion => {
          if (!installedVersion) {
            installGuides.kubectl = kubectl.installGuide;
          }
          return `${installedVersion || "-"}${kleur.dim(`/${kubectl.minInstalledVersion}`)}`;
        })(data.kubectl.installedVersion),
      ]);
    }

    // telepresence
    if (enabled.telepresence) {
      tableRows.push([
        `telepresence`,
        (ctx => {
          if (!ctx || !ctx.deployment) return "-";
          return `session: ${ctx.sessionId}\ndeployment: ${kleur.blue(ctx.deployment.metadata.name)}\nnamespace: ${enabled.kubectl && data.kubectl.currentContext && ((data.kubectl.currentContext.namespace || "default") === ctx.deployment.metadata.namespace) ? kleur.blue(ctx.deployment.metadata.namespace) : ctx.deployment.metadata.namespace}\nimages: ${ctx.deployment.spec.template.spec.containers.map((c: any) => c.image).join(", ")}\ncreated at: ${ctx.deployment.metadata.creationTimestamp}`;
        })(data.telepresence.currentContext),
        (installedVersion => {
          if (!installedVersion) {
            installGuides.telepresence = telepresence.installGuide;
          }
          return `${installedVersion || "-"}${kleur.dim(`/${telepresence.minInstalledVersion}`)}`;
        })(data.telepresence.installedVersion),
      ]);
    }

    // moleculer
    if (enabled.moleculer) {
      tableRows.push([
        `moleculer`,
        (ctx => {
          if (!ctx) return "-";
          return `namespace: ${ctx.namespace === context.appEnv ? kleur.blue(ctx.namespace) : kleur.red(ctx.namespace)} ${kleur.dim(`(app-env)`)}\n${ctx.nodes.map((n: any) => {
            return `node: ${n.id}\nclient: moleculer ${n.client.type} v${n.client.version}\nhost: ${n.ipList.join(", ")}`;
          }).join("-----\n")}`;
        })(data.moleculer.currentContext),
        (installedVersion => {
          // if (!installedVersion) {
          //   installGuides.moleculer = moleculer.installGuide;
          // }
          return `${installedVersion || "-"}${kleur.dim(`/${moleculer.minInstalledVersion}`)}`;
        })(data.moleculer.installedVersion),
      ]);
    }

    // print context
    context.logger.log(`=== QMIT CLI Context ===\n${table(tableRows, {
      columnDefault: {
        alignment: "left",
      },
    })}`);

    // print install guides
    if (Object.keys(installGuides).length > 0) {
      for (const [service, installGuide] of Object.entries(installGuides)) {
        context.logger.log(`=== Install ${service} CLI ===\n${installGuide}\n`);
      }
    }

    // force quit for the redis connection handler hanging bug from moleculer
    process.exit(0);
    // require("wtfnode").dump();
  },
  builder(y) {
    return y
      .positional("services", {
        describe: `A list of services to show current context. Omit it to show all the information.`,
        choices: Object.keys(services),
      })
      .options("app-env", {
        alias: "a",
        describe: `Set app-env context ${kleur.dim(`(${context.envVarName.appEnv})`)}`,
        choices: context.appEnvs,
      })
      .options("cluster-name", {
        alias: "c",
        describe: `Set cluster-name context ${kleur.dim(`(${context.envVarName.clusterName})`)}`,
        choices: context.clusterNames,
      })
      .options("install-guide", {
        alias: "i",
        describe: `Show prerequisite CLIs install guides.`,
        type: "boolean",
        conflicts: ["cluster-name", "app-env"],
      })
      .version(false);
  },
};

export default command;
