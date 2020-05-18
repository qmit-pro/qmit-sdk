import _ from "lodash";
import kleur from "kleur";
import os from "os";
import { ServiceBroker, BrokerOptions } from "moleculer";
import { exec, SDKModule } from "../common";

export class Moleculer extends SDKModule {
  public installedVersion(): Promise<string | null> {
    return exec("moleculer --version")
      .then(res => {
        if (res.childProcess.exitCode === 0) {
          return `v${res.stdout.trim()}`;
        } else {
          return null;
        }
      }, () => null);
  }
  public readonly minInstalledVersion = "v0.7.1";
  public readonly installGuide = `
- Install moleculer CLI by: yarn global add moleculer-cli
`;

  public createBrokerOptions(override?: Omit<BrokerOptions, "namespace"|"transporter">): BrokerOptions {
    console.log(`Creating moleculer service broker options with namespace=${kleur.blue(this.context.appEnv)} ${kleur.dim("(context.appEnv)")}\n`);
    /*
     * Default Moleculer Service Broker Configuration for QMIT Inc.
     */
    const defaults: BrokerOptions = {
      namespace: this.context.appEnv,
      // nodeID: undefined,

      logger: true,
      // logLevel: undefined,
      // logFormatter: "default",
      // logObjectPrinter: undefined,

      transporter: "redis://redis.internal.qmit.pro:6379",

      requestTimeout: 3 * 1000,
      retryPolicy: {
        enabled: true,
        retries: 3,
        delay: 100,
        maxDelay: 1000,
        factor: 2,
        check: (err) => {
          return err && !!(err as any).retryable;
        },
      },

      contextParamsCloning: false,
      maxCallLevel: 5,
      heartbeatInterval: 5,
      heartbeatTimeout: 15,

      tracking: {
        enabled: true,
        shutdownTimeout: 5000,
      },

      disableBalancer: false,

      registry: {
        strategy: "RoundRobin",
        preferLocal: true,
      },

      circuitBreaker: {
        enabled: true,
        threshold: 0.5,
        windowTime: 60,
        minRequestCount: 20,
        halfOpenTime: 10 * 1000,
        check: (err) => {
          return err && (err as any).code && (err as any).code >= 500;
        },
      },

      bulkhead: {
        enabled: false,
        concurrency: 10,
        maxQueueSize: 100,
      },

      transit: {
        maxQueueSize: 50 * 1000, // 50k ~ 400MB,
        disableReconnect: false,
        disableVersionCheck: false,
      },

      // uidGenerator: undefined,

      // errorHandler: undefined,

      cacher: "redis://redis.internal.qmit.pro:6379",

      serializer: "JSON",

      validator: true,

      metrics: {
        enabled: true,
        reporter: [
          {
            type: "Event",
            options: {
              eventName: "$metrics.snapshot",
              broadcast: false,
              groups: null,
              onlyChanges: false,
              interval: 10 * 1000,
            },
          },
        ],
      },

      tracing: {
        enabled: true,
        // @ts-ignore: moleculer module type has not been updated yet
        events: true,
        stackTrace: true,
        exporter: [
          {
            type: "Event",
            options: {
              eventName: "$tracing.spans",
              sendStartSpan: false,
              sendFinishSpan: true,
              broadcast: false,
              groups: null,
              interval: 5,
              spanConverter: null,
              defaultTags: null,
            },
          },
        ],
      },

      internalServices: true,
      internalMiddlewares: true,

      hotReload: false,

      // middlewares: undefined,

      metadata: {},

      skipProcessEventRegistration: false,

      // ServiceFactory: null,
      // ContextFactory: null
      // Promise: null
    };

    return _.defaultsDeep(override || {}, defaults);
  }

  public repl() {
    const broker = new ServiceBroker(this.createBrokerOptions({
      nodeID: `cli-${os.hostname().toLowerCase()}-${process.pid}`,
    }));

    broker.start().then(() => broker.repl());
  }
}

const singletonMoleculer = new Moleculer();

// console.log(singletonMoleculer.createServiceBrokerOptions());
//
// singletonMoleculer.installedVersion().then(console.log);
//
// singletonMoleculer.repl();

export default singletonMoleculer;
