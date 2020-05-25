"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moleculer = exports.Moleculer = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const kleur_1 = tslib_1.__importDefault(require("kleur"));
const os_1 = tslib_1.__importDefault(require("os"));
const moleculer_1 = require("moleculer");
const common_1 = require("../common");
class Moleculer extends common_1.SDKModule {
    constructor() {
        super(...arguments);
        this.minInstalledVersion = "v0.7.1";
        this.installGuide = `- (optional) Install moleculer CLI by: "yarn global add moleculer-cli"
`;
    }
    getInstalledVersion() {
        return common_1.exec("moleculer --version")
            .then(res => {
            if (res.childProcess.exitCode === 0) {
                return `v${res.stdout.trim()}`;
            }
            else {
                return null;
            }
        })
            .catch(err => {
            this.context.logger.debug(err);
            return null;
        });
    }
    createServiceBrokerOptions(override, options = {}) {
        this.context.logger[options.quiet ? "debug" : "log"](`Creating moleculer service broker options with namespace=${kleur_1.default.blue(this.context.appEnv)} ${kleur_1.default.dim("(context.appEnv)")}\n`);
        /*
         * Default Moleculer Service Broker Configuration for QMIT Inc.
         */
        const defaults = {
            namespace: this.context.appEnv,
            // nodeID: undefined,
            replDelimiter: `${this.context.appEnv}:${this.context.clusterFullName}$`,
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
                    return err && !!err.retryable;
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
                    return err && err.code && err.code >= 500;
                },
            },
            bulkhead: {
                enabled: false,
                concurrency: 10,
                maxQueueSize: 100,
            },
            transit: {
                maxQueueSize: 50 * 1000,
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
        };
        return lodash_1.default.defaultsDeep(override || {}, defaults);
    }
    runREPL() {
        const broker = new moleculer_1.ServiceBroker(this.createServiceBrokerOptions({
            nodeID: `cli-${os_1.default.hostname().toLowerCase()}-${process.pid}`,
        }));
        return broker.start().then(() => {
            broker.repl();
            return;
        });
    }
    getCurrentContext(timeout = 2500) {
        const broker = new moleculer_1.ServiceBroker(this.createServiceBrokerOptions({
            nodeID: `cli-${os_1.default.hostname().toLowerCase()}-${process.pid}-tmp`,
            logger: false,
        }, {
            quiet: true,
        }));
        const promise = broker.start()
            .then(() => {
            const thisNode = broker.getLocalNodeInfo();
            return broker.call("$node.list", { onlyAvailable: true })
                .then((nodes) => {
                const localNodes = [];
                for (const node of nodes) {
                    if (node.instanceID === thisNode.instanceID || node.id.endsWith("-tmp")) {
                        continue;
                    }
                    if (node.ipList.every((ip) => thisNode.ipList.includes(ip))) {
                        localNodes.push(node);
                    }
                }
                return {
                    namespace: this.context.appEnv,
                    nodes: localNodes,
                };
            })
                .catch(() => null);
        }, () => null);
        return Promise.race([
            new Promise(resolve => setTimeout(() => {
                this.context.logger.debug(kleur_1.default.dim(`Timeout for getting moleculer context in ${timeout}ms`));
                resolve(null);
            }, timeout)),
            promise,
        ])
            .finally(() => broker.stop());
    }
}
exports.Moleculer = Moleculer;
const moleculer = new Moleculer();
exports.moleculer = moleculer;
//# sourceMappingURL=index.js.map