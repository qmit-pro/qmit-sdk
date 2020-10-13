# Infrastructure Team

## CHANGE LOGS
- 19/09/11 RBAC policy updated
- 19/09/09 CronJob deployed to dev/prod clusters to clear old telepresence deployments
    - https://github.com/qmit-pro/dockerfiles
- 19/09/05 Redis (GCP MemoryStore) instance `gke-redis-common` setup
    - Internal IP mapped to `redis.internal.qmit.pro.`
    - Used for moleculer cache and transporter
    - VPN tunnel with `telepresence --also-proxy 10.0.0.0/8` for local access 
- 19/09/02 Initial setup

## 1. Kubernetes Clusters History
1. GCP Project `qmit-pro` created

1. GCP SA `gke-default` (project-editor) created

1. GKE Cluster `dev` created
    - In `asia-northeast1-a` Zone
    - K8S API firewall enabled. (temporary: 0.0.0.0/0)
    - VPC native enabled
    - in VPC `default`
    - NetworkPolicy resource enabled
    - `gke-security-groups@qmit.kr` G-Suite Group created
    - RBAC with G-Suite Group enabled
    - Stackdriver for GKE enabled
    - Cloud TPU enabled
    - Node auto-provisioning enabled and starts with 1-2CPU/4-8GB
    - Vertical Pod auto-scaling enabled
    - `gke_usage` BitQuery dataset created
    - GKE usage tracking for resource usage enabled to `gke_usage`
    - Node pool starts with `n1-standard-2` with SA `gke-default`
    
1. GKE Cluster `dev` configured
    - Configure local environment
        - `gcloud container clusters get-credentials --project qmit-pro --zone asia-northeast1-a dev`
        - `kubectl config rename-context gke_qmit-pro_asia-northeast1-a_dev dev`
        - `kubectl config use-context dev`
    - Setup helm client (v3) locally (Package manager)
    - Setup nginx-ingress-controller (LB, IngressController)
        - `helm install stable/nginx-ingress --namespace nginx --name nginx-ingress`
        - `echo $(kubectl get svc -n nginx nginx-ingress-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')`
        - DNS record `dev.qmit.pro.	A -> [LB IP]` created
        - DNS record `*.dev.qmit.pro.	CNAME -> dev.qmit.pro.` created
        - `kubectl -n nginx patch deploy nginx-ingress-controller -p "$(cat ./base/05-nginx-ingress-controller-patch.yaml)"` for HA; initial replica: 1
        - `kubectl -n nginx patch svc nginx-ingress-controller -p '{"spec":{"externalTrafficPolicy":"Local"}}'` for client IP forwarding
        - `kubectl -n nginx patch configmap ingress-controller-leader-nginx -p '{"data":{"proxy-read-timeout": "300", "proxy-send-timeout": "300"}}'` for nginx configuration: [ref. doc](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/)
    - Setup cert-manager (ACME manager)
        - `kubectl apply --validate=false -f https://raw.githubusercontent.com/jetstack/cert-manager/release-0.12/deploy/manifests/00-crds.yaml`
        - `kubectl create ns cert-manager && kubectl label ns cert-manager certmanager.k8s.io/disable-validation=true`
        - `helm repo add jetstack https://charts.jetstack.io && helm repo update`
        - `helm install jetstack/cert-manager --name cert-manager --namespace cert-manager --version v0.12.0`
        - `kubectl apply -f ./base/10-cluster-issuers.yaml`
    - Setup ACL policies
        - `kubectl apply -f ./rbac`
    - Test
        - `kubectl apply -f ./base/15-source-ip-app.yaml && kubectl apply -f ./base/15-source-ip-app-ingress-dev.yaml`
        - Check the IP from `curl ifconfig.co` is equal to the `x-forwarded-for/x-real-ip` field from `curl https://ip.qmit.pro`
        - `kubectl delete -f ./base/15-source-ip-app.yaml && kubectl delete -f ./base/15-source-ip-app-ingress-dev.yaml`

1. GKE Cluster `prod` created
    - Cloned from `dev` cluster template

1. GKE Cluster `prod` configured
    - Configure local environment
        - `gcloud container clusters get-credentials --project qmit-pro --zone asia-northeast1-a prod`
        - `kubectl config rename-context gke_qmit-pro_asia-northeast1-a_prod prod`
        - `kubectl config use-context prod`
    - Setups
        - Same steps with `dev` done
        - Exception:
            - DNS setup as `qmit.pro. A / *.qmit.pro. CNAME`
    - Test
        - `kubectl apply -f ./base/15-source-ip-app.yaml && kubectl apply -f ./base/15-source-ip-app-ingress-prod.yaml`
        - Check the IP from `curl ifconfig.co` is equal to the `x-forwarded-for/x-real-ip` field from `curl https://ip.qmit.pro`
        - `kubectl delete -f ./base/15-source-ip-app.yaml && kubectl delete -f ./base/15-source-ip-app-ingress-prod.yaml`
    - Additional
        - `kubectl apply -f ./base/20-redirection-ingresses-prod.yaml`

1. GCP SA `gke-internal` (project-editor) created

1. GKE Cluster `internal` created
    - In `asia-northeast1-a` Zone
    - K8S API firewall enabled. (temporary: 0.0.0.0/0)
    - VPC native enabled
    - in VPC `default`
    - RBAC with G-Suite Group enabled
    - Stackdriver for GKE enabled
    - Node auto-provisioning enabled and starts with 1-2CPU/2-4GB
    - Vertical Pod auto-scaling enabled
    - GKE usage tracking for resource usage enabled to `gke_usage`
    - Node pool starts with `n1-standard-1` with SA `gke-internal`

1. GKE Cluster `internal` configured
    - Configure local environment
        - `gcloud container clusters get-credentials --project qmit-pro --zone asia-northeast1-a internal`
        - `kubectl config rename-context gke_qmit-pro_asia-northeast1-a_internal internal`
        - `kubectl config use-context internal`
    - Setups
        - Same steps with `dev` done
        - Exception:
            - DNS setup as `internal.qmit.pro. A / *.internal.qmit.pro. CNAME`
            - Create firewall policy: only accept ingress from intranet CIDR

1. Setup vault in `internal` cluster

- Spec.
    - Auto Unsealing with GCP KMS
    - Google Cloud Storage backend
    
```bash
### 1. Deployment and unsealing ###
export PROJECT_ID="qmit-pro"
export COMPUTE_ZONE="asia-northeast1-a"
export GCS_BUCKET_NAME="${PROJECT_ID}_vault"
export KMS_KEY_ID="projects/${PROJECT_ID}/locations/global/keyRings/vault/cryptoKeys/vault-init"
export VAULT_SA_NAME="gke-internal"
export VAULT_SA_EMAIL="${VAULT_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create vault keyring in GCP KMS 
gcloud kms keyrings create vault --location global --project ${PROJECT_ID}

# Create the vault-init encryption key
gcloud kms keys create vault-init --location global --keyring vault --purpose encryption --project ${PROJECT_ID}

# Create a GCS bucket
gsutil mb -p ${PROJECT_ID} gs://${GCS_BUCKET_NAME}

# Grant access to the vault storage bucket
gsutil iam ch ${VAULT_SA_EMAIL}:objectAdmin gs://${GCS_BUCKET_NAME}
gsutil iam ch ${VAULT_SA_EMAIL}:legacyBucketReader gs://${GCS_BUCKET_NAME}

# Grant access to the vault-init KMS encryption key
gcloud kms keys add-iam-policy-binding vault-init --location global --keyring vault --member ${VAULT_SA_EMAIL} --role roles/cloudkms.cryptoKeyEncrypterDecrypter --project ${PROJECT_ID} 

# Deploy vault StatefulSet (v1.2.2)
kubectl apply -f ./internal/00-vault.yaml --context internal

# Check vault cluster status
export VAULT_ADDR="https://vault.internal.qmit.pro"
brew install vault
vault status

# Fetch token, Never store below token for any usage, just use for vault management (like policies)
export VAULT_TOKEN=$(gsutil cat gs://${GCS_BUCKET_NAME}/root-token.enc | \
  base64 --decode | \
  gcloud kms decrypt \
    --project ${PROJECT_ID} \
    --location global \
    --keyring vault \
    --key vault-init \
    --ciphertext-file - \
    --plaintext-file - 
)

# Login with root token
vault login $VAULT_TOKEN

# Check UI
open $VAULT_ADDR

### 2. G-Suite Members ###
# Setup Google OAuth2 for vault: https://github.com/hashicorp/vault-guides/tree/master/identity/oidc-auth#configure-google
# Don't forget to add http://localhost:8250/oidc/callback in allowed callback list for vault CLI login
# ... then add OIDC auth configuration
export GOOGLE_API_CLIENT_ID=877700236778-bu3fs6j4qflhhdung6m9dvq41us5gt72.apps.googleusercontent.com
export GOOGLE_API_CLIENT_SECRET=<REDACTED>

vault auth enable oidc

vault write auth/oidc/config \
    oidc_discovery_url="https://accounts.google.com" \
    oidc_client_id="$GOOGLE_API_CLIENT_ID" \
    oidc_client_secret="$GOOGLE_API_CLIENT_SECRET" \
    default_role="default"

# then create roles
# - hd claim will be matched for permit only g-suite members
# Google OAuth2 currently not support groups claims for ID token
cat << EOF | vault write -format=json auth/oidc/role/default -
{
    "oidc_scopes": [
        "email",
        "profile"        
    ],
    "bound_claims": {
        "hd": "qmit.kr"
    },
    "user_claim": "email",
    "groups_claim": "",
    "claim_mappings": {
        "name": "name",
        "email": "email"
    },
    "bound_audiences": [
        "$GOOGLE_API_CLIENT_ID"
    ],
    "allowed_redirect_uris": [
        "${VAULT_ADDR}/ui/vault/auth/oidc/oidc/callback",
        "http://localhost:8250/oidc/callback"
    ],
    "policies": [
        "default"
    ],
    "ttl": "168h"
}
EOF

# Check Google Login from UI
open $VAULT_ADDR

# Check Google login from CLI
vault login -method=oidc

# Enable kv engine
vault secrets enable -version=2 -path=common kv
vault kv enable-versioning common
vault kv put common/test hello=world

# Enable other paths for each stages
vault secrets enable -version=2 -path=dev kv
vault kv enable-versioning dev
vault secrets enable -version=2 -path=prod kv
vault kv enable-versioning prod
vault secrets enable -version=2 -path=prod kv
vault kv enable-versioning prod-readonly
vault secrets enable -version=2 -path=admin kv
vault kv enable-versioning admin

# Create group and policy: admin, developer, k8s, k8s-dev, k8s-prod
# admin:
# developer: can CRUD /common
# developer.readonly: can R /common
# Later, for each developer and teams, shall be granted to concrete policies.

### 3. Kubernetes ###
# Prepare Kubernetes auth method
#
# Use k8s/gke-cluster-name for kubernetes.default.svc as method name
#
kubectl config use-context dev
GKE_CLUSTER_NAME=dev

kubectl apply -f ./base/30-vault-auth-service-account.yaml
K8S_HOST=$(gcloud container clusters describe $GKE_CLUSTER_NAME --zone=asia-northeast1-a --format=json | jq ".endpoint" -r)
VAULT_SA_NAME=$(kubectl get sa vault-auth -n kube-system -o jsonpath="{.secrets[*]['name']}")
SA_JWT_TOKEN=$(kubectl get secret -n kube-system $VAULT_SA_NAME -o jsonpath="{.data.token}" | base64 --decode; echo)
SA_CA_CRT=$(kubectl get secret -n kube-system $VAULT_SA_NAME -o jsonpath="{.data['ca\.crt']}" | base64 --decode; echo)

# Setup Kubernetes auth config
vault auth enable -path="k8s/${GKE_CLUSTER_NAME}" kubernetes
vault write "auth/k8s/${GKE_CLUSTER_NAME}/config" \
        token_reviewer_jwt="$SA_JWT_TOKEN" \
        kubernetes_host="https://${K8S_HOST}" \
        kubernetes_ca_cert="$SA_CA_CRT"

# Setup Kubernetes role
# Currently grant all 'default' service accounts in all namespaces to 'default', 'kubernetes' policies 
vault write auth/k8s/${GKE_CLUSTER_NAME}/role/default \
        bound_service_account_names=default \
        bound_service_account_namespaces="*" \
        policies=default,k8s,k8s-${GKE_CLUSTER_NAME}

# Again for prod cluster
kubectl config use-context prod
GKE_CLUSTER_NAME=prod

... repeat above process

### Test in a Pod
kubectl run --generator=run-pod/v1 tmp --rm -i --tty --image alpine --context dev 
apk update && apk add curl jq
VAULT_ADDR="https://vault.internal.qmit.pro"
KUBE_TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
VAULT_TOKEN=$(curl -X POST -s -d '{"jwt": "'"$KUBE_TOKEN"'", "role": "default"}' ${VAULT_ADDR}/v1/auth/k8s/dev/login | jq '.auth.client_token' -r)
curl -X GET -s -H "X-Vault-Token: ${VAULT_TOKEN}" $VAULT_ADDR/v1/common/data/test | jq '.data.data'

# Get { "hello" : "world" }

### Now can login and fetch secrets with kubernetes service account (default.*) and G-Suite account
```

## 2. RBAC Policy

### 2.1. Status
1. Kubernetes
    - Members do `gcloud container clusters get-credentials --project qmit-pro --zone asia-northeast1-a dev`
    - G-Suite account token -> GKE G-Suite Group Binding
        - Groups under `gke-security-groups@qmit.kr` group will be automatically evaluated with `./rbac/...yaml`
        - `dev`, `prod`, ... further later `prod-2`, `prod-3` will have same policies derived from `./rbac/...yaml`.
1. Vault
    - `token` method never used.
    - Members do `vault login -method=oidc` and login from `https://vault.internal.qmit.pro`
        - G-Suite OIDC method has been integrated except group binding.
            - Account entities should be bound to each groups properly in hand.
    - Kubernetes Pods should do `vault login -method=k8s/${CLUSTER-ALIAS}` programmatically.
        - `k8s/dev`, `k8s/prod`, ... further later, `k8s/prod-2`, `k8s-prod-3`
1. Github
    - Members need permission to `https://github.com/qmit-pro` org.
1. Docker Registry
    - Currently using Google Cloud Registry.
    - Members do `gcloud auth configure-docker`
    - G-Suite account token -> GCR
        - Google Storage IAM configured to grant all `qmit.kr` members to `gcr.io/qmit-pro` bucket. 
1. Google Cloud Platform
    - Members do not need GCP permissions explicitly.
        - Above mandatory services have been integrated with G-Suite groups and domain.

### 2.2. New Member
- Create new G-Suite account and assign to proper groups.
- Assign seat to GitHub org to new member's personal Github account.

### 2.3. New Policy/Namespace
- Create new namespace/policy and record to `./rbac/...yaml`
- Associate to member's account or new G-Suite groups.
- Test with `kubectl rbac-lookup qmit -o wide --context dev`
- Also with `kubectl auth can-i create pods -n new-ns --context dev`
- Confirm symmetry between replicated clusters.

```bash
$ kubectl rbac-lookup qmit -o wide --context dev
SUBJECT                        SCOPE          ROLE                            SOURCE
Group/gke-admin@qmit.kr        cluster-wide   ClusterRole/system:basic-user   ClusterRoleBinding/basic-user-binding
Group/gke-admin@qmit.kr        cluster-wide   ClusterRole/cluster-admin       ClusterRoleBinding/cluster-admin-binding
Group/gke-biz@qmit.kr          biz            ClusterRole/edit                RoleBinding/edit-binding
Group/gke-developer@qmit.kr    playground     ClusterRole/edit                RoleBinding/edit-binding
Group/gke-developer@qmit.kr    cluster-wide   ClusterRole/system:basic-user   ClusterRoleBinding/basic-user-binding
Group/gke-developer@qmit.kr    cluster-wide   ClusterRole/view                ClusterRoleBinding/view-binding
Group/gke-util@qmit.kr         util           ClusterRole/edit                RoleBinding/edit-binding

$ kubectl rbac-lookup qmit -o wide --context prod
SUBJECT                        SCOPE          ROLE                            SOURCE
Group/gke-admin@qmit.kr        cluster-wide   ClusterRole/system:basic-user   ClusterRoleBinding/basic-user-binding
Group/gke-admin@qmit.kr        cluster-wide   ClusterRole/cluster-admin       ClusterRoleBinding/cluster-admin-binding
Group/gke-biz@qmit.kr          biz            ClusterRole/edit                RoleBinding/edit-binding
Group/gke-developer@qmit.kr    playground     ClusterRole/edit                RoleBinding/edit-binding
Group/gke-developer@qmit.kr    cluster-wide   ClusterRole/system:basic-user   ClusterRoleBinding/basic-user-binding
Group/gke-developer@qmit.kr    cluster-wide   ClusterRole/view                ClusterRoleBinding/view-binding
Group/gke-util@qmit.kr         util           ClusterRole/edit                RoleBinding/edit-binding
```

### 2.4. New Cluster
- Setup Vault auth k8s method config and role, policies for Vault access from K8S Pod SA.
- Setup and apply `./rbac/...yaml` for K8S API access from members.
- Later consideration:
    - `kubefed`: [cluster federation](https://github.com/kubernetes-sigs/kubefed)
    - `kubemci`: [multi cluster ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-ingress)

## 3. CI/CD tools
- Github + GCP Cloud Build
- Github + AppCenter
- miscellanea for open-source projects.
    - Travis
    - Synk
    - CoverAlls
