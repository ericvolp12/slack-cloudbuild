import { Block, SectionBlock, ContextBlock } from '@slack/types';
import { render } from 'ejs';
// eslint-disable-next-line import/no-unresolved
import { Build } from './pubsub.js';

export function statusEmoji(status: string): string {
  switch (status) {
    case 'QUEUED':
      return ':clock1:';
    case 'CANCELLED':
      return ':grey_exclamation:';
    case 'WORKING':
      return ':hourglass_flowing_sand:';
    case 'SUCCESS':
      return ':white_check_mark:';
    case 'FAILURE':
      return ':heavy_exclamation_mark:';
    case 'INTERNAL_ERROR':
      return ':bangbang:';
    case 'TIMEOUT':
      return ':alarm_clock:';
    default:
      return ':question:';
  }
}

const DEFAULT_TITLE_TEMPLATE = '<%= emoji %> <%= status %> | <%= message %>';

export function createMessage(
  build: Build,
  githubOrg: string
): [Block, Block[]] {
  const emoji = statusEmoji(build.status);

  const templateToRender = DEFAULT_TITLE_TEMPLATE;

  const repoName = build.substitutions.REPO_NAME;
  const commitSha = build.substitutions.SHORT_SHA;
  const branchName = build.substitutions.BRANCH_NAME;
  const triggerName = build.substitutions.TRIGGER_NAME;
  // eslint-disable-next-line no-underscore-dangle
  const functionTarget = build.substitutions._GOOGLE_FUNCTION_TARGET;
  let message = 'Running Unknown Build';

  if (repoName && commitSha) {
    message = `Deploying Project ${repoName} @ \`${commitSha}\``;
  } else if (functionTarget) {
    message = `Deploying Function ${functionTarget}`;
  } else if (triggerName) {
    message = `Deploying from Trigger ${triggerName}`;
  }

  const headerText = render(templateToRender, {
    message,
    status:
      build.status.charAt(0).toUpperCase() +
      build.status.substring(1).toLowerCase(),
    emoji,
  });

  const headerBlock: SectionBlock = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: headerText,
    },
  };

  const attachmentBlocks: Block[] = [];

  const descBlock: SectionBlock = {
    type: 'section',
  };

  if (repoName && commitSha && branchName) {
    descBlock.fields = [
      {
        type: 'mrkdwn',
        text: `*Repo*: <https://github.com/${githubOrg}/${repoName}|${repoName}>`,
      },
      {
        type: 'mrkdwn',
        text: `*Branch*: <https://github.com/${githubOrg}/${repoName}/tree/${branchName}|${branchName}>`,
      },
      {
        type: 'mrkdwn',
        text: `*Details*: <${build.logUrl}|Cloud Build>`,
      },
      {
        type: 'mrkdwn',
        text: `*Commit*: <https://github.com/${githubOrg}/${repoName}/commit/${build.substitutions.COMMIT_SHA}|${commitSha}>`,
      },
    ];
  } else {
    descBlock.fields = [
      {
        type: 'mrkdwn',
        text: `*Details*: <${build.logUrl}|Cloud Build>`,
      },
    ];
  }

  attachmentBlocks.push(descBlock);

  const contextBlock: ContextBlock = {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Build ID: *${build.id}*`,
      },
    ],
  };

  attachmentBlocks.push(contextBlock);

  return [headerBlock, attachmentBlocks];
}
