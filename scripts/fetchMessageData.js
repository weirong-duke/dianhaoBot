const Discord = require('discord.js');
const fs = require('fs');
const {channels} = require('../constants/general');
const {dianhaoId} = require('../constants/userIds');

const client = new Discord.Client();
const channelList = [
  channels.OG_GENERAL_CHANNEL_ID,
  channels.OG_KRIEGER_CHANNEL_ID,
  channels.OG_ICEFROG_CHANNEL_ID,
  channels.OG_SERIOUS_CHANNEL_ID,
  channels.WILSON_GENERAL_CHANNEL_ID];
const userList = {};

const path = 'source.json';

const fetchMessagesForChannel = async (channelId) => {
  const channel = client.channels.get(channelId);
  const fetchMessagesForUser = async (userId) => {
    let lastMessageId = '';
    for (let x = 0; x<200 ; x++) {
      try {
        const options = {limit: 100, before: lastMessageId || undefined};
        const response = await channel.fetchMessages(options)
          .then(messages => {
              messages.forEach(message => {
                if (!(message.author.name in Object.keys(userList))) {
                  userList[message.author.username] = message.author.id;
                }
                if (message.author.id === userId && !message.content.includes('http')) {
                  fs.appendFile(path, '\n'+message.content, () => {})
                }
              });
              lastMessageId = messages.last().id
            }
          )
      } catch (e) {
        console.log('Errored out: ', e);
        break;
      }

    }
  };

  return fetchMessagesForUser(dianhaoId);
};


client.once('ready', async () => {
  const fetchMessagesForChannels = async () => {
    for (const channelId of channelList) {
      await fetchMessagesForChannel(channelId)
    }

  };
  fetchMessagesForChannels().then(() => {
    const userListPath = "users.json";
    fs.writeFile(userListPath, JSON.stringify(userList), () => {});
    console.log('INFO: Destroying Discord client');
    client.destroy();
  });
});

client.login('NjQyMjIyNTM5NzQxMDY5MzEy.XcT-nw.Q8H8MfzzrPVy2SPm6nG2xAiTUhM');
