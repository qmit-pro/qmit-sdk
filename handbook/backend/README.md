# QMIT Backend

TODO

## Common
- moleculer and about retry, circuit breaking, else common settings for shared library.
- about domain driven development, MSA
- distributed transaction policy
- about api.console.*
- about qmit CLI
- about Node.js/Golang, moleculer-go
- about k8s, network policy and namespaces, permissions, DNS
- about VPN / telepresence
- kubectl / krew detailed usage 
- stackdriver and metrics/tracings
- about configuration/secret mangement
- vault
    - https://learn.hashicorp.com/vault/getting-started/install
    - 

## Core
- about open source projects
- about CLI, console
- about client libraries for Flutter and JS/TS

## Business
- about each bounded contexts
- about domain knowledge
- abount event-driven way in moleculer

## Data Analysis
- pytorch
- raw data backup, migration policy
- about AI Gateway module for Admin Console (internal product)
- about gRPC to moleculer / AI Gateway
- about online learning
- about GCP TPU for k8s


# Requirements
- VPN tunneling is always required for QMIT system integration and networking while local development. Can use `telepresence`, follow QMIT Developer Wiki instruction.
- `qmit`, `gcloud`, `docker`, `telepresence`, `kubectl`, `vault` commands should be ready for whole development lifecycle.

# Deployment
- Before start, check out auto-generated kubernetes resources' spec (./k8s) and cloud build spec (./cloudbuild.yaml).
- Build and push first docker image from local.
- Deploy kubernetes resources.
- Initialize local git repository and remote Github repository.
- Activate Github - GCP Cloud Build integration.
- By default, any commit or PR, merge toward `develop` branch invokes integration test and deployment in `dev` namespace in k8s cluster after test success without human confirmation.
- By default, any commit or PR, merge toward `master` branch invokes integration test and deployment in `prod` namespace in k8s cluster after test success without human confirmation.
