import kleur from "kleur";
import yargs from "yargs";
import { context, gcloud, telepresence } from "../../";

const describe = `Create a VPN-tunnel with current cluster-alias context. It will invoke telepresence command to establish a VPN-tunnel with cluster.\nIt runs: ${kleur.dim(`telepresence --also-proxy ... [options..]`)}`;

const command: yargs.CommandModule = {
  command: `cluster [options..]`,
  describe,
  async handler(args) {
    const argsOptions = args.options as string[];
    const result = await gcloud.ensureClusterCredentials();
    context.logger.log(`Connecting to cluster ${kleur.blue(result.cluster)} ${kleur.dim(`(${result.zone})`)} with args: ${argsOptions.join(" ") || "-"}`);
    return telepresence.runCommand(argsOptions);
  },
  builder(y) {
    const prefix = `$0 cluster`;
    return y
      .parserConfiguration({
        'unknown-options-as-args': true,
        "parse-numbers": false,
        "boolean-negation": false,
      })
      .version(false)
      .usage(`${prefix} [options..]

${describe}
And below is original telepresence ${telepresence.minInstalledVersion} usage guide from: ${kleur.dim("telepresence --help")}

Usage: ${prefix} ${kleur.dim("[-h] [--version]")} [--verbose] [--logfile LOGFILE]
                    ${kleur.dim("[--method {inject-tcp,vpn-tcp,container}]")}
                    [--new-deployment DEPLOYMENT_NAME | --swap-deployment DEPLOYMENT_NAME[:CONTAINER]
                    | --deployment EXISTING_DEPLOYMENT_NAME]
                    ${kleur.dim("[--context CONTEXT]")} [--namespace NAMESPACE]
                    [--serviceaccount SERVICE_ACCOUNT]
                    [--expose PORT[:REMOTE_PORT]] [--to-pod PORT]
                    [--from-pod PORT]
                    [--container-to-host CONTAINER_PORT[:HOST_PORT]]
                    ${kleur.dim("[--also-proxy CLOUD_HOSTNAME]")} [--local-cluster]
                    [--docker-mount PATH | --mount PATH_OR_BOOLEAN]
                    [--env-json FILENAME] [--env-file FILENAME]
                    [--run-shell | --run ... | --docker-run ...]

Telepresence: local development proxied to a remote Kubernetes cluster.

Documentation: https://telepresence.io
Real-time help: https://d6e.co/slack
Issue tracker: https://github.com/datawire/telepresence/issues

== Examples ==

Send a HTTP query to Kubernetes Service called 'myservice' listening on port 8080:

$ ${prefix} --run curl http://myservice:8080/

Replace an existing Deployment 'myserver' listening on port 9090 with a local process listening on port 9090:

$ ${prefix} --swap-deployment myserver --expose 9090   --run python3 -m http.server 9090

Use a different local port than the remote port:

$ ${prefix} --swap-deployment myserver --expose 9090:80   --run python3 -m http.server 9090

Run a Docker container instead of a local process:

$ ${prefix} --swap-deployment myserver --expose 80   --docker-run -i -t nginx:latest

== Detailed usage ==

optional arguments:
  ${kleur.dim(`-h, --help            show this help message and exit
  --version             show program's version number and exit`)}
  --verbose             Enables verbose logging for troubleshooting.
  --logfile LOGFILE     The path to write logs to. '-' means stdout, default
                        is './telepresence.log'.
  ${kleur.dim(`--method {inject-tcp,vpn-tcp,container}, -m {inject-tcp,vpn-tcp,container}
                        'inject-tcp': inject process-specific shared library
                        that proxies TCP to the remote cluster. 'vpn-tcp': all
                        local processes can route TCP traffic to the remote
                        cluster. Requires root. 'container': used with
                        --docker-run. Default is 'vpn-tcp', or 'container'
                        when --docker-run is used. For more details see
                        https://telepresence.io/reference/methods.html`)}
  --new-deployment DEPLOYMENT_NAME, -n DEPLOYMENT_NAME
                        Create a new Deployment in Kubernetes where the
                        datawire/telepresence-k8s image will run. It will be
                        deleted on exit. If no deployment option is specified
                        this will be used by default, with a randomly
                        generated name.
  --swap-deployment DEPLOYMENT_NAME[:CONTAINER], -s DEPLOYMENT_NAME[:CONTAINER]
                        Swap out an existing deployment with the Telepresence
                        proxy, swap back on exit. If there are multiple
                        containers in the pod then add the optional container
                        name to indicate which container to use.
  --deployment EXISTING_DEPLOYMENT_NAME, -d EXISTING_DEPLOYMENT_NAME
                        The name of an existing Kubernetes Deployment where
                        the datawire/telepresence-k8s image is already
                        running.
  ${kleur.dim(`--context CONTEXT     The Kubernetes context to use. Defaults to current
                        kubectl context.`)}
  --namespace NAMESPACE
                        The Kubernetes namespace to use. Defaults to kubectl's
                        default for the current context, which is usually
                        'default'.
  --serviceaccount SERVICE_ACCOUNT
                        The Kubernetes service account to use. Sets the value
                        for a new deployment or overrides the value for a
                        swapped deployment.
  --expose PORT[:REMOTE_PORT]
                        Port number that will be exposed to Kubernetes in the
                        Deployment. Should match port exposed in the existing
                        Deployment if using --deployment or --swap-deployment.
                        By default local port and remote port are the same; if
                        you want to listen on port 8080 locally but be exposed
                        as port 80 in Kubernetes you can do '--expose
                        8080:80'.
  --to-pod PORT         Access localhost:PORT on other containers in the
                        swapped deployment's pod from your host or local
                        container. For example, use this to reach proxy/helper
                        containers in the pod with --swap-deployment.
  --from-pod PORT       Allow access to localhost:PORT on your host or local
                        container from other containers in the swapped
                        deployment's pod. For example, use this to let an
                        adapter container forward requests to your swapped
                        deployment.
  --container-to-host CONTAINER_PORT[:HOST_PORT]
                        For the container method, listen on
                        localhost:CONTAINER_PORT in the container and forward
                        connections to localhost:HOST_PORT on the host running
                        Telepresence. Useful for allowing code running in the
                        container to connect to an IDE or debugger running on
                        the host.
  ${kleur.dim(`--also-proxy CLOUD_HOSTNAME
                        If you are using --method=vpn-tcp, use this to add
                        additional remote IPs, IP ranges, or hostnames to
                        proxy. Kubernetes service and pods are proxied
                        automatically, so you only need to list cloud
                        resources, e.g. the hostname of a AWS RDS. When using
                        --method=inject-tcp this option is unnecessary as all
                        outgoing communication in the run subprocess will be
                        proxied.`)}
  --local-cluster       If you are using --method=vpn-tcp with a local cluster
                        (one that is running on the same computer as
                        Telepresence) and you experience DNS loops or loss of
                        Internet connectivity while Telepresence is running,
                        use this flag to enable an internal workaround that
                        may help.
  --docker-mount PATH   The absolute path for the root directory where volumes
                        will be mounted, $TELEPRESENCE_ROOT. Requires --method
                        container.
  --mount PATH_OR_BOOLEAN
                        The absolute path for the root directory where volumes
                        will be mounted, $TELEPRESENCE_ROOT. Use "true" to
                        have Telepresence pick a random mount point under /tmp
                        (default). Use "false" to disable filesystem mounting
                        entirely.
  --env-json FILENAME   Also emit the remote environment to a file as a JSON
                        blob.
  --env-file FILENAME   Also emit the remote environment to an env file in
                        Docker Compose format. See
                        https://docs.docker.com/compose/env-file/ for more
                        information on the limitations of this format.
  --run-shell           Run a local shell that will be proxied to/from
                        Kubernetes.
  --run ...             Run the specified command arguments, e.g. '--run
                        python myapp.py'.
  --docker-run ...      Run a Docker container, by passing the arguments to
                        'docker run', e.g. '--docker-run -i -t ubuntu:16.04
                        /bin/bash'. Requires --method container.`);
  },
};

export default command;
