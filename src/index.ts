import * as pubsub from './pubsub';
import * as render from './render';
import sourceMapSupport from 'source-map-support';

import { WebClient } from '@slack/web-api';

sourceMapSupport.install();

// Initialize a User Client to allow us to Search messages
const userClient = new WebClient(process.env.USER_TOKEN);

// Initialize a Bot Client to send and update Messages
const botClient = new WebClient(process.env.BOT_TOKEN);

// Intiialize the channel name (without the leading #) to lookup
const channelName = process.env.ALERT_CHANNEL;

export async function gcbSubscribeSlack(
  pubSubEvent: pubsub.Event,
  _context: Object
) {
  console.debug(JSON.stringify(pubSubEvent));

  const build = pubsub.deserBuild(pubSubEvent);
  console.info(JSON.stringify(build));

  console.log(`Slack Web Client Status: ${await userClient.api.test()}`);

  if (!isLoudStatus(build.status)) {
    return;
  }

  const blocks = render.createMessage(build);

  const searchString = `"Build ID: *${build.id}*"`;

  const conversations = await userClient.conversations.list();

  let channelID = '';
  conversations.channels?.forEach(channel => {
    if (channel.name === channelName && channel.id) {
      channelID = channel.id;
    }
  });

  // Find a previous message if we're updating it
  const oldMessages = await userClient.search.messages({
    query: searchString,
    sort: 'timestamp',
    sort_dir: 'desc',
  });

  console.debug('Dumping Old Messages...');
  console.debug(JSON.stringify(oldMessages));

  if (oldMessages.messages && oldMessages.messages.matches) {
    try {
      const oldMessage = oldMessages.messages.matches[0];
      if (oldMessage.ts) {
        await botClient.chat.update({
          as_user: true,
          ts: oldMessage.ts,
          channel: channelID,
          blocks: blocks,
        });
        return;
      }
    } catch {
      console.error('Failed to update message, posting a new one');
    }
  }

  await botClient.chat.postMessage({
    channel: channelID,
    blocks: blocks,
  });
}

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
  } else {
    return true;
  }
}
