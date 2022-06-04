/* eslint-disable no-console */
import sourceMapSupport from 'source-map-support';
import { WebClient } from '@slack/web-api';
// eslint-disable-next-line import/no-unresolved
import { Event, deserBuild } from './pubsub.js';
// eslint-disable-next-line import/no-unresolved
import { createMessage } from './render.js';

sourceMapSupport.install();

// Initialize a User Client to allow us to Search messages
const userClient = new WebClient(process.env.USER_TOKEN);

// Initialize a Bot Client to send and update Messages
const botClient = new WebClient(process.env.BOT_TOKEN);

// Intiialize the channel name (without the leading #) to lookup
const channelName = process.env.ALERT_CHANNEL;

const githubOrg = process.env.GITHUB_ORG || '';

const STATUSES = [
  'SUCCESS',
  'FAILURE',
  'INTERNAL_ERROR',
  'TIMEOUT',
  // 'QUEUED',
  'WORKING',
  'CANCELLED',
];

function isLoudStatus(status: string): boolean {
  if (STATUSES.indexOf(status) === -1) {
    return false;
  }
  return true;
}

// This function is the main entrypoint for our CloudFunction, we'll end up with an unused context var
// eslint-disable-next-line import/prefer-default-export
export const gcbSubscribeSlack = async (
  pubSubEvent: Event,
  // eslint-disable-next-line no-unused-vars
  _context: Object
) => {
  const build = deserBuild(pubSubEvent);

  // Determine if this is a build status we want to notify on
  if (!isLoudStatus(build.status)) {
    return;
  }

  // Find the channel we're posting to
  const conversations = await userClient.conversations.list();
  let channelID = '';
  conversations.channels?.forEach((channel) => {
    if (channel.name === channelName && channel.id) {
      channelID = channel.id;
    }
  });

  // Try to find an old message if we're updating an existing build status
  const searchString = `"Build ID: *${build.id}*"`;
  const oldMessages = await userClient.search.messages({
    query: searchString,
    sort: 'timestamp',
    sort_dir: 'desc',
  });

  // Generate the new message blocks for this event
  const [headerBlock, attachmentBlocks] = createMessage(build, githubOrg);

  let statusColor = '';
  switch (build.status) {
    case 'SUCCESS':
      statusColor = '#36a64f';
      break;
    case 'FAILURE':
      statusColor = '#cb2431';
      break;
    case 'CANCELLED':
      statusColor = '#ffaaa6';
      break;
    case 'WORKING':
      statusColor = '#7575ff';
      break;
    case 'INTERNAL_ERROR':
      statusColor = '#cb2431';
      break;
    default:
      statusColor = '#36a64f';
  }

  // If we found an old message, update it
  if (oldMessages.messages && oldMessages.messages.matches) {
    try {
      const oldMessage = oldMessages.messages.matches[0];
      if (oldMessage.ts) {
        await botClient.chat.update({
          as_user: true,
          ts: oldMessage.ts,
          channel: channelID,
          blocks: [headerBlock],
          attachments: [
            {
              color: statusColor,
              blocks: attachmentBlocks,
            },
          ],
        });
        return;
      }
    } catch {
      console.error('Failed to update message, posting a new one');
    }
  }

  // If we didn't find an old message, post a new one
  await botClient.chat.postMessage({
    channel: channelID,
    blocks: [headerBlock],
    attachments: [
      {
        color: statusColor,
        blocks: attachmentBlocks,
      },
    ],
  });
};
