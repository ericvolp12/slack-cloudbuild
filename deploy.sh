#!/bin/bash

set -euxo pipefail

NODE_ENV=production

npm run-script lint
npm run-script build
rm -rf build

gcloud functions deploy gcbSubscribeSlack --trigger-topic cloud-builds --runtime nodejs14 --set-env-vars "ALERT_CHANNEL=${ALERT_CHANNEL}"
