# Google Cloud Function for sending Cloud Cloud Build statuses to Slack written in TypeScript

Features:

- [x] send slack notifications about successful and failed builds;
- [x] link to build details in slack message;
- [x] no need in additional step in cloudbuild.yaml;
- [ ] show trigger information in slack message;
- [x] customize slack message using substitution in cloudbuild.yaml.

![Slack message](https://github.com/onsails/cloudbuild-slack/raw/master/screenshot.png "Slack message")

# Deploy

Prerequisites:

* Google Cloud Platform project with enabled Cloud Functions API;
* gcloud command-line util authorized to deploy cloud functions;
* Slack webhook url.

Deployment:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_TOKENS ./deploy.sh
```

This script will deploy cloud function `gcbSubscribeSlack` triggered by `cloud-build` PubSub topic.

Message can be customized by defining `_SLACK_MESSAGE_TEMPLATE` substitution in cloudbuild.yaml. Value should be a valid [ejs](https://ejs.co) template:

```yaml
steps:

# ... build steps ...

substitutions:
  _SLACK_MESSAGE_TEMPLATE: '<%= emoji %> *https://<%= build.substitutions._OVERLAY %>.example.com* frontend build & deploy `<%= build.id %>` <%= build.status %>'
```

`emoji` corresponds to a build status, `build` is object containing build information, it's structure is defined [here](https://github.com/onsails/cloudbuild-slack/blob/master/src/pubsub.ts).
