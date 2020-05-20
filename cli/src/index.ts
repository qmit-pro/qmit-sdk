#!/usr/bin/env node
import kleur from "kleur";
import yargs from "yargs";
import { vault } from "../../";

yargs
  .usage("Usage: $0 <command> [options]")
  .command(`context`, 'Show current context')
  .command(`context set app <env>`, `Set APP_ENV among: ${kleur.green("dev, prod")}`)
  .command(`context set cluster <cluster>`, `Set APP_K8S_CLUSTER among: ${kleur.green("dev, prod")}`)
  .command(`vault login`, `Login into vault service and set local token`)
  .command(`vault status`, `Show vault local token status`)
  .command(`vault open`, `Open vault web interface: `)
  .help()
  .version()
  .argv;
