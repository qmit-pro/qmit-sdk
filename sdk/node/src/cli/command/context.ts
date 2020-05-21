import kleur from "kleur";
import yargs from "yargs";
import { table } from "table";
import { context, vault, gcloud, kubectl, telepresence, moleculer } from "../../";

const services = ["vault", "gcloud", "kubectl", "telepresence", "moleculer"];

const command: yargs.CommandModule = {
  command: `context [services..]`,
  describe: `Configure or show current context.`,
  async handler(args) {
    // set context if has optional args
    if (args.appEnv || args.clusterName) {
      context.setContext({ appEnv: args.appEnv as any, clusterName: args.clusterName as any });
      context.writeConfig();
    }

    // show context, login status and other possible information
    const serviceOptions = args.services as any;
    const enabled = services.reduce((map, service) => {
      map[service] = serviceOptions.length === 0 || serviceOptions.include(service);
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

    tableRows.push([
      `qmit`,
      `app-env: ${kleur.blue(context.appEnv)}\ncluster-name: ${kleur.blue(context.clusterName)}\ncluster-zone: ${context.clusterZone}\nkubectl-context: ${enabled.kubectl && data.kubectl.currentContext && data.kubectl.currentContext.cluster === context.clusterFullName ? kleur.blue(context.clusterFullName) : kleur.red(context.clusterFullName)}`,
      `${context.version}`,
    ]);

    // vault
    if (enabled.vault) {
      tableRows.push([
        `vault`,
        (loginStatus => {
          if (!loginStatus) return "-";
          return `email: ${kleur.blue(loginStatus.meta.email)}\nname: ${loginStatus.meta.name}\nrole: ${loginStatus.meta.role}\npolicies: ${kleur.blue(loginStatus.identity_policies.join(", "))}\ntoken: ${loginStatus.id}\nexpires at: ${loginStatus.expire_time.split(".")[0]}Z\nissued at: ${loginStatus.issue_time.split(".")[0]}Z`;
        })(data.vault.loginStatus),
        (installedVersion => {
          return installedVersion ? `${installedVersion}${kleur.dim(`/${vault.minInstalledVersion}`)}` : `-${kleur.dim(`/${vault.minInstalledVersion}`)}\n\n${kleur.dim(vault.installGuide)}`;
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
          return installedVersion ? `${installedVersion}${kleur.dim(`/${gcloud.minInstalledVersion}`)}` : `-${kleur.dim(`/${gcloud.minInstalledVersion}`)}\n\n${kleur.dim(gcloud.installGuide)}`;
        })(data.gcloud.installedVersion),
      ]);

      context.logger.log(`=== Google Cloud Resource (Project: ${kleur.blue(context.GCP_PROJECT_ID)}) ===\n${
        table([
          [
            `Clusters ${kleur.dim(`(GKE; Kubernetes)`)}`,
            `SQL Instances`,
            `Redis Instances`,
          ],
          [
            (items => {
              if (items.length === 0) return "-";
              return items.map((item: any) => {
                return `name: ${item.name === context.clusterName ? kleur.blue(item.name) : item.name} ${kleur.dim(`(cluster-name)`)}\nzones: ${item.locations.join(", ")}\nnetwork: ${item.network}\ncidr: ${item.clusterIpv4Cidr}\nstate: ${item.status}\nmaster endpoint: ${item.endpoint}\nmaster version: ${item.currentMasterVersion}\nnode version: ${item.currentNodeVersion}\nnode #: ${item.currentNodeCount}`;
              }).join("\n-----\n");
            })(data.gcloud.clustersList),
            (items => {
              if (items.length === 0) return "-";
              return items.map((item: any) => {
                return `name: ${item.name}\nhost: ${item.ipAddresses.map((ip: any) => `${ip.ipAddress} (${ip.type})`).join(", ")}\nport: ${item.port || "-"}\nversion: ${item.databaseVersion}\nzone: ${item.gceZone}\nstate: ${item.state}\ntier: ${item.settings.tier}`;
              }).join("\n-----\n");
            })(data.gcloud.sqlInstancesList),
            (items => {
              if (items.length === 0) return "-";
              return items.map((item: any) => {
                return `name: ${item.displayName}\nhost: ${item.host} (${item.reservedIpRange})}\nport: ${item.port}\nversion: ${item.redisVersion}\nzone: ${item.locationId}\nstate: ${item.state}\ntier: ${item.tier}`;
              }).join("\n-----\n");
            })(data.gcloud.redisInstancesList),
          ],
        ], {
          columnDefault: {
            alignment: "left",
            wrapWord: true,
          },
          columns: {
            0: {width: 35},
            1: {width: 35},
            2: {width: 35},
          },
        })
      }`);
    }

    // kubectl
    if (enabled.kubectl) {
      tableRows.push([
        `kubectl`,
        (ctx => {
          if (!ctx) return "-";
          return `cluster: ${(ctx.cluster === context.clusterFullName ? kleur.blue : kleur.red)(ctx.cluster)}\nuser: ${ctx.user}\nnamespace: ${ctx.namespace || kleur.dim("default")}`;
        })(data.kubectl.currentContext),
        (installedVersion => {
          return installedVersion ? `${installedVersion}${kleur.dim(`/${kubectl.minInstalledVersion}`)}` : `-${kleur.dim(`/${kubectl.minInstalledVersion}`)}\n\n${kleur.dim(kubectl.installGuide)}`;
        })(data.kubectl.installedVersion),
      ]);
    }

    // telepresence
    if (enabled.telepresence) {
      tableRows.push([
        `telepresence`,
        (ctx => {
          if (!ctx) return "-";
          return `session: ${ctx.sessionId}\ndeployment: ${kleur.blue(ctx.deployment.metadata.name)}\nnamespace: ${enabled.kubectl && data.kubectl.currentContext && ((data.kubectl.currentContext.namespace || "default") === ctx.deployment.metadata.namespace) ? kleur.blue(ctx.deployment.metadata.namespace) : ctx.deployment.metadata.namespace}\nimages: ${ctx.deployment.spec.template.spec.containers.map((c: any) => c.image).join(", ")}\ncreated at: ${ctx.deployment.metadata.creationTimestamp}`;
        })(data.telepresence.currentContext),
        (installedVersion => {
          return installedVersion ? `${installedVersion}${kleur.dim(`/${telepresence.minInstalledVersion}`)}` : `-${kleur.dim(`/${telepresence.minInstalledVersion}`)}\n\n${kleur.dim(telepresence.installGuide)}`;
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
          return installedVersion ? `${installedVersion}${kleur.dim(`/${moleculer.minInstalledVersion}`)}` : `-${kleur.dim(`/${moleculer.minInstalledVersion}`)}\n\n${kleur.dim(moleculer.installGuide)}`;
        })(data.moleculer.installedVersion),
      ]);
    }

    // print
    context.logger.log(`${table(tableRows, {
      columnDefault: {
        alignment: "left",
      },
    })}`);

    // force quit
    process.exit(0);
  },
  builder(y) {
    return y
      .positional("services", {
        describe: `A list of services to show current context. Omit it to show all the information.`,
        choices: services,
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
      .version(false);
  },
};

export default command;
