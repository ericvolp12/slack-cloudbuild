import { Block, HeaderBlock, SectionBlock, DividerBlock } from '@slack/types';
import * as ejs from 'ejs';
import * as pubsub from './pubsub';

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

const DEFAULT_TITLE_TEMPLATE =
  '<%= emoji %> <%= status %> | Deploy <%= repoName %>@<%= commitSha %>';

export function createMessage(build: pubsub.Build): Block[] {
  let emoji = statusEmoji(build.status);

  let templateToRender = DEFAULT_TITLE_TEMPLATE;

  let repoName = build.substitutions.REPO_NAME;
  let commitSha = build.substitutions.SHORT_SHA;
  let branchName = build.substitutions.BRANCH_NAME;

  const headerText = ejs.render(templateToRender, {
    repoName: repoName,
    commitSha: commitSha,
    branchName: branchName,
    triggerName: build.substitutions.TRIGGER_NAME,
    status:
      build.status.charAt(0).toUpperCase() +
      build.status.substring(1).toLowerCase(),
    emoji: emoji,
  });

  let headerBlock: HeaderBlock = {
    type: 'header',
    text: {
      type: 'plain_text',
      text: headerText,
    },
  };

  let blocks: Block[] = [headerBlock];

  let dividerBlock: DividerBlock = { type: 'divider' };

  blocks.push(dividerBlock);

  let descBlock: SectionBlock = {
    type: 'section',
  };

  if (repoName && commitSha && branchName) {
    descBlock.fields = [
      {
        type: 'mrkdwn',
        text: `*Repo*: <https://github.com/MEKA-Works/${repoName}|*${repoName}*>\n*Branch*: ${branchName}\n*Commit*: ${commitSha}\n<${build.logUrl}|*Cloud Build Details*>`,
      },
    ];
  } else {
    descBlock.fields = [
      {
        type: 'mrkdwn',
        text: `<${build.logUrl}|*Details*>`,
      },
    ];
  }

  blocks.push(descBlock);

  return blocks;
}
