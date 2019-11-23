const Discord = require('discord.js');
const fs = require('fs');
const markov = require('./src/generateResponse');
const {userIds} = require('./constants/userIds');
const generateMarkovResponse = markov.generateMarkovResponse;
const {channels, dianhaoNames, emojiIds, timeBetweenMessages} = require('./constants/general');

const client = new Discord.Client();
const path = 'source.json';

let lastMessageTime = Date.now();

const throttledSend = (message, string) => {
  if (message.createdTimestamp - lastMessageTime > timeBetweenMessages) {
    message.channel.send(string);
    lastMessageTime = message.createdTimestamp;
  }
};

client.on('message', message => {
  const messageWords = message.content.split(' ');
  const emojiIndex = Math.floor(Math.random() * Math.floor(emojiIds.length));
  const emojiString = `${client.emojis.get(emojiIds[emojiIndex])}`;

  if (messageWords.some((word) => dianhaoNames.includes(word.toLowerCase()))) {
    try {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
    catch (e) {
      console.log('DEBUGGING: This error occured while responding: ', e)
    }
  }
  if (message.content.includes('<@642222539741069312>')) {
    try {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
    catch (e) {
      console.log('DEBUGGING: This error occured while responding: ', e)
    }
  }
  if (message.author.id === userIds['McStickenstein']) {
    console.log('INFO: Dianhao message content: ', message.content);

    fs.appendFile(path, '\n'+message.content, () => {});

    if (message.content.includes('friends') && !message.content.includes('"')) {
      message.channel.send('"friends"')
    }
    if (message.content.includes('http') || message.content.includes('https') && message.channel.applicationID !== channels.OG_WEABOO_CHANNEL_ID) {
      throttledSend(message, emojiString)
    }
  }
  if (message.author.id === userIds['weirong']) {
    console.log('INFO: Message content: ', message.content);
    if (message.channel.id === channels.TEST_CHANNEL) {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
  }
});

client.login('NjQyMjIyNTM5NzQxMDY5MzEy.XcT-nw.Q8H8MfzzrPVy2SPm6nG2xAiTUhM');
