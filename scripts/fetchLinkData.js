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
const linkResponses = {};

const path = 'links.json';
const ignoredLinks = ['.gif', '.jpg', '.jpeg', '.png', 'gfycat', 'tenor', 'pixiv', 'imgur']
let parsedMessages = 0;

const Sequelize = require('sequelize')

const {LinkMessage} = require('../models');
const REGEX_URL = new RegExp(`.*(https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)).*`)


const fetchLinksForChannel = async (channelId) => {
  const channel = client.channels.get(channelId);
  const fetchLinksForUser = async (userId) => {
    let lastMessageId = '';
    for (let x = 0; x<200 ; x++) {
      try {
        const options = {limit: 100, before: lastMessageId || undefined};
        await channel.fetchMessages(options)
          .then(messages => {
              messages.forEach(async message => {
                parsedMessages += 1;
                console.log('INFO: Parsed messages: ', parsedMessages);
                let subsequentMessageCount = 0;
                const urlMatch = message.content.match(REGEX_URL)

                if (message.author.id === userId && urlMatch && !ignoredLinks.some(fileType => message.content.includes(fileType))) {
                  console.log('INFO: Here is a DLO Link message: ', message.content)
                  const subsequentDianhaoMessages = [];
                  const newOptions = {
                    limit: 20, after: message.id
                  };
                  try {
                    await channel.fetchMessages(newOptions).then(subsequentMessages => {
                      const filteredMessages = subsequentMessages.array().filter(subMessage => (subMessage.createdTimestamp - message.createdTimestamp < 300000))
                      filteredMessages.forEach(subMessage => {
                        if (subMessage.author.id === dianhaoId) {
                          subsequentDianhaoMessages.push(subMessage.content.replace(/[\n"\r]/g, ""));
                        }
                      });
                      linkResponses[urlMatch[1]] = subsequentDianhaoMessages;
                      subsequentMessageCount = filteredMessages.filter(subMessage => subMessage.author.id !== dianhaoId).length;
                      console.log('message.reacts', message.reactions.array(), filteredMessages.length, subsequentMessageCount)
                    });
                    console.log('message id', message.id)
                    LinkMessage.create({
                      createdDate: message.createdAt,
                      messageId: message.id,
                      reactionCount: message.reactions.array().length,
                      subsequentMessageCount,
                      url: urlMatch[1]
                    });
                    console.log('BREAKLINE ==================================================')
                  } catch (e) {
                    console.log('Big Error: e', e)
                  }

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

  return fetchLinksForUser(dianhaoId);
};


client.once('ready', async () => {
  const fetchLinksForChannels = async () => {
    for (const channelId of channelList) {
      await fetchLinksForChannel(channelId)
    }

  };
  fetchLinksForChannels().then(() => {
    for (const key of Object.keys(linkResponses)) {
      if (!linkResponses[key].length) {
        delete linkResponses[key]
      }
    }
    fs.writeFile(path, JSON.stringify(linkResponses), () => {});
    client.destroy();
  });
});

client.login('NjQyMjIyNTM5NzQxMDY5MzEy.XcT-nw.Q8H8MfzzrPVy2SPm6nG2xAiTUhM');
