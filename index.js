const Discord = require('discord.js');
const fs = require('fs');
const Sentiment = require('sentiment');
const Sequelize = require('sequelize');

const {botCommandPrefix, channels, dianhaoNames, emojiIds, timeBetweenMessages} = require('./constants/general');
const {userIds} = require('./constants/userIds');
const {LinkMessage, LinkMessageKeyword} = require('./models');
const markov = require('./src/generateResponse');
const {fetchKeywordsFromUrl, topWordScores} = require('./src/parseHtmlBody')
const {normalizeScore} = require('./utils/general');

const client = new Discord.Client();
const Op = Sequelize.Op;
const sentiment = new Sentiment();
const generateMarkovResponse = markov.generateMarkovResponse;

const path = 'source.json';

let lastMessageTime = Date.now();
const REGEX_URL = new RegExp(`.*(https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)).*`)

const throttledSend = (message, string) => {
  if (message.createdTimestamp - lastMessageTime > timeBetweenMessages) {
    message.channel.send(string);
    lastMessageTime = message.createdTimestamp;
  }
};

const generateSentimentEmbed = (sentiment) => {
  const sentimentText = sentiment < -50 ? 'Very Negative' : sentiment < -10 ? 'Negative' : sentiment > 50 ? 'Very Positive' : sentiment > 10 ? 'Positive' : 'Neutral'
  const embedColor = sentiment < -10 ? 'glsl' : sentiment > 10 ? 'css' : ''

  return '```' + embedColor + '\n' + sentimentText + '```'

};

// client.on('close')

client.on('message', async message => {
  const messageWords = message.content.split(' ');
  const emojiIndex = Math.floor(Math.random() * Math.floor(emojiIds.length));
  const emojiString = `${client.emojis.get(emojiIds[emojiIndex])}`;
  const authorIsDlo = message.author.id === userIds['McStickenstein'];
  const authorIsDev = message.author.id === userIds['weirong']

  if (messageWords.some((word) => dianhaoNames.includes(word.toLowerCase()))) {
    try {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
    catch (e) {
      console.log('DEBUGGING: This error occured while responding: ', e)
    }
  } else if (message.content.includes('<@642222539741069312>')) {
    try {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
    catch (e) {
      console.log('DEBUGGING: This error occured while responding: ', e)
    }
  }
  if (authorIsDlo) {
    console.log('INFO: Dianhao message content: ', message.content);
    const urlMatch = message.content.match(REGEX_URL)

    fs.appendFile(path, '\n'+message.content, () => {});

    if (message.content.includes('friends') && !message.content.includes('"')) {
      message.channel.send('"friends"')
    }
    if (urlMatch && message.channel.applicationID !== channels.OG_WEABOO_CHANNEL_ID) {
      try {
        const url = urlMatch[1];
        const [body, singleWordScores, biWordScores, triWordScores] = await fetchKeywordsFromUrl(url)
        const strongKeywords = {
          ...topWordScores(singleWordScores, 3).reduce((scores, gram) => ({...scores, [gram]: singleWordScores[gram]}), {}),
          ...topWordScores(biWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: biWordScores[gram]}), {}),
          ...topWordScores(triWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: triWordScores[gram]}), {})
        };
        const headingSentiment = sentiment.analyze(body || '').score;
        await LinkMessage.create({
          linkBody: body,
          messageId: message.id,
          sentiment: headingSentiment,
          url
        });
        for (const keyword of Object.keys(strongKeywords)) {
          await LinkMessageKeyword.create({
            keyword,
            messageId: message.id,
            weight: normalizeScore(strongKeywords[keyword])
          })
        }
        setTimeout(async () => {
          let subsequentMessageCount = 0;
          const subsequentDianhaoMessages = [];
          const options = {
            limit: 20, after: message.id
          };
          await message.channel.fetchMessages(options).then(subsequentMessages => {
            const filteredMessages = subsequentMessages.array().filter(subMessage => (subMessage.createdTimestamp - message.createdTimestamp < 300000))
            filteredMessages.forEach(subMessage => {
              if (subMessage.author.id === userIds['McStickenstein']) {
                subsequentDianhaoMessages.push(subMessage.content.replace(/[\n"\r]/g, ""));
              }
              subsequentMessageCount = filteredMessages.filter(subMessage => subMessage.author.id !== userIds['McStickenstein']).length;
            });
            LinkMessage.update({
              reactionCount: message.reactions.array().length,
              subsequentMessageCount
            }, {
              where: {
                messageId: message.id
              }
            });
          });
        }, 5000);
      } catch (e) {
        console.log('DEBUGGING: This error occured in DLO URL match: ', e)
      }

      throttledSend(message, emojiString)
    }
  }
  if (authorIsDev) {
    const urlMatch = message.content.match(REGEX_URL)
    console.log('bot command', botCommandPrefix)
    if (message.content.startsWith(`${botCommandPrefix}analyzeLink`)) {
      console.log('hmm', )
      const mostRecentLinkMessage = await LinkMessage.findOne({
        where: {},
        order: [ [ 'createdAt', 'DESC' ]],
      });
      const relatedKeywords = await LinkMessageKeyword.findAll({
        where: {
          messageId: mostRecentLinkMessage.messageId
        }
      });
      const {sentiment, url} = mostRecentLinkMessage;
      console.log('keywords', mostRecentLinkMessage.messageId, sentiment, url)
      const sanitizedKeywords = relatedKeywords.reduce((sanitized, keyword) => {
        return (keyword.keyword in sanitized) ? sanitized : {
          ...sanitized,
          [keyword.keyword]: keyword.weight
        }
      }, {})
      console.log('sanititj', sanitizedKeywords)
      let analysisEmbed = new Discord.RichEmbed()
        .setColor('#ffffff')
        .setTitle(`Link Analysis: ${url}`)
        .setAuthor('DianhaoBot', 'https://i.imgur.com/wSTFkRM.png')
        .setDescription(`We've found the following key words and phrases from Dianhao's last post:`)
      const sortedKeywords = Object.keys(sanitizedKeywords).sort((wordA, wordB) => sanitizedKeywords[wordB] - sanitizedKeywords[wordA]);
      for (const keyword of sortedKeywords) {
        analysisEmbed = analysisEmbed.addField(`${keyword}`, `Score: ${sanitizedKeywords[keyword]}`, true)
      }

      analysisEmbed.addField('Sentiment: ', generateSentimentEmbed(sentiment));
      message.channel.send(analysisEmbed)
      const otherKeywords = await LinkMessageKeyword.findAll({
        where: {
          [Op.and]: [
            {
              messageId: {
                [Op.ne]: mostRecentLinkMessage.messageId
              }
            },
            {
              keyword: sortedKeywords
            }
          ]

        }

      })
      const relatedLinks = otherKeywords.reduce((keywordResults, keyword) => {
        if (!Object.keys(keywordResults).includes(keyword.messageId)) {
          return {
            ...keywordResults,
            [keyword.messageId]: keyword.weight
          }
        }
        return {
          ...keywordResults,
          [keyword.messageId]: keywordResults[keyword.messageId] + keyword.weight
        }

      }, {})
      const topMessageId = Object.keys(relatedLinks).sort((messageIdA, messageIdB) => relatedLinks[messageIdB] - relatedLinks[messageIdA])[0];
      console.log('messages', topMessageId)
      const lastRelatedLink = await LinkMessage.findOne({
        where: {messageId: topMessageId}
      });
      const {
        subsequentMessageCount,
        sentiment: lastSentiment,
        reactionCount,
        url: relatedUrl
      } = lastRelatedLink;

      const reactionScore = subsequentMessageCount + reactionCount;


      const lowImage = 'https://media1.tenor.com/images/0a37ef8f52e2232d85a2070d56801987/tenor.gif?itemid=5026106';
      const neutralImage = 'https://media.tenor.com/images/27b14761925248c55e630983ae08f8e5/tenor.gif';
      const goodImage = 'https://media1.tenor.com/images/515d500849f4704c9a367a7021ce180e/tenor.gif?itemid=4402281'
      const bestImage = 'https://media1.tenor.com/images/c4f89cf9e9cfd811473785f69829ea7c/tenor.gif?itemid=9864414';

      const conclusionColor = reactionScore > 6 ? '#3cff33' : reactionScore > 2 ? '#a2ff33' : reactionScore > 0 ? '#ffffff' : '#ff0000'
      const conclusionImage = reactionScore > 6 ? bestImage : reactionScore > 2 ? goodImage : reactionScore > 0 ? neutralImage : lowImage

      const conclusionText = `Last time a similar link was posted it got ${subsequentMessageCount} responses and ${reactionCount} reactions from others within 5 minutes.\n\n Is this link worth reading:`

      let conclusionEmbed = new Discord.RichEmbed()
        .setColor(conclusionColor)
        .setTitle(`Last Similar Link: ${relatedUrl}`)
        .setAuthor('DianhaoBot', 'https://i.imgur.com/wSTFkRM.png')
        .setDescription(conclusionText)
        .setImage(conclusionImage)

      // conclusionEmbed.addField('Sentiment: ', generateSentimentEmbed(lastSentiment));

      message.channel.send(conclusionEmbed)

    }
    if (urlMatch) {

    }
    console.log('INFO: Message content: ', message.content);
    if (message.channel.id === channels.TEST_CHANNEL) {
      message.channel.send(generateMarkovResponse(2,10) || emojiString);
    }
  }
});

client.login('NjQyMjIyNTM5NzQxMDY5MzEy.XcT-nw.Q8H8MfzzrPVy2SPm6nG2xAiTUhM');
