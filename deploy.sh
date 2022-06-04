#!/bin/bash

set -euxo pipefail

NODE_ENV=production

npm run-script lint
npm run-script build

gcloud functions deploy gcbSubscribeSlack --trigger-topic cloud-builds --runtime nodejs14 --set-env-vars "ALERT_CHANNEL=${ALERT_CHANNEL},GITHUB_ORG=${GITHUB_ORG}"
