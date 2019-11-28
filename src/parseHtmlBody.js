const request = require('request-promise');
const fs = require('fs');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const {LinkMessage, LinkMessageKeyword} = require('../models');
const links = JSON.parse(fs.readFileSync(`links.json`));

const pickBy = require('lodash/pickBy');
const sanitizeHtml = require('sanitize-html')
const {disenfect, cleanHtml, cleanHtmlBody} = require('../utils/strings');

const natural = require('natural');
const TfIdf = natural.TfIdf;
const NGrams = natural.NGrams;

const {stopwords} = require('../constants/stopwords/stopwords');
const englishStopwords = require('../constants/stopwords/english-stopwords.json');
const tfIdfStore = JSON.parse(fs.readFileSync('tdidfStore.json'));
const twitterStopwords = require('../constants/stopwords/twitter-stopwords.json');
const {normalizeScore} = require('../utils/general');
//types, youtube, twitter, streamable
const youtubeStrings = ['youtube', 'youtu.be'];
const twitterStrings = ['twitter.com'];
const Nightmare = require('nightmare')
const nightmare = Nightmare()
const cheerio = require('cheerio');
const pageLoadWaitTimes = {
  'twitch-clip': 5000
};


const additionalTextSelectors = {
  'gematsu': ['div.single_section_content'],
  'reddit': ['h1', 'h1', 'p'],
  'steam': ['div.game_area_description', 'div.apphub_AppName', 'div.apphub_AppName', 'div.apphub_AppName', 'div.apphub_AppName', 'div.game_description_snippet'],
  'twitter': ['p.TweetTextSize.js-tweet-text.tweet-text'],
  'twitch-clip': ['div.clips-sidebar'],
  'youtube': ['yt-formatted-string.ytd-video-primary-info-renderer', 'yt-formatted-string.ytd-video-secondary-info-renderer']
};


const textFromBody = (body, type) => {
  let $ = cheerio.load(body);
  const additionalTextList = []
  for (const additionalSelector of additionalTextSelectors[type]) {
    $(additionalSelector).each(function(index) {
      additionalTextList.push($(this).text())
    });
  }
  return `${additionalTextList.map(word => word.trim()).join(' ')}`;
};
const combinedStopwords = [...stopwords, ...twitterStopwords];


const removeStopwords = (body) => {
  return body.replace(/\s+/g,' ').split(' ').filter(word => !combinedStopwords.includes(word)).join(' ')
}

const generateWordScores = (wordList, tfidf) => {
  return wordList.reduce((wordScoresHash, sanitizedWord) => {
    if (combinedStopwords.includes(sanitizedWord) || parseFloat(sanitizedWord) || sanitizedWord.includes('.com')) {
      return wordScoresHash
    }
    return {
      ...wordScoresHash,
      [sanitizedWord]: parseFloat(tfidf.tfidf(sanitizedWord, 0)) || 0
    }
  }, {});
};


const fetchBodyAfterPageLoad = async (url, type) => {
  const waitTime = type ? pageLoadWaitTimes[type] : 1000;
  try {
    return await nightmare
      .goto(url)
      .wait(waitTime)
      .evaluate(() => {
        return document.body.innerHTML
      })
      .then(nightmareBody => {
        try {
          const preBody = removeStopwords(type ? textFromBody(nightmareBody, type) : cleanHtml(sanitizeHtml(nightmareBody, {allowedTags: []})))
          const cleanedBody = cleanHtmlBody(preBody);
          const bigrams = NGrams.bigrams(cleanedBody).map(bigram => bigram.join(' '));
          const trigrams = NGrams.ngrams(cleanedBody, 3).map(trigram => trigram.join(' '));
          // console.log('traisgakl', trigrams)

          // const trigrams = NGrams.trigrams(cleanedBody).map()
          const wordList = cleanedBody.split(' ')
          const tfidf = new TfIdf();
          tfidf.addDocument(cleanedBody)
          console.log('hmm', wordList)
          const singleWordScores = generateWordScores(wordList, tfidf)
          const biWordScores = generateWordScores(bigrams, tfidf);
          const triWordScores = generateWordScores(trigrams, tfidf);
          return [cleanedBody, singleWordScores, biWordScores, triWordScores]
        } catch (error) {
          console.log('ERROR: Nightmare Scrape: ', error)
        }
      })
  } catch (error) {
    return;
  }

};

const fetchKeywordsFromUrl = async (url) => {
  let responseBody = '';
  try {
    let type = null;
    if (url.includes('gematsu')) {
      type = 'gematsu'
    } else if (url.includes('reddit')) {
      type = 'reddit';
    } else if (url.includes('store.steampowered')) {
      type = 'steam'
    } else if (url.includes('clips.twitch')) {
      type = 'twitch-clip'
    } else if (url.includes('twitter')) {
      type = 'twitter'
    }  else if (url.includes('youtube') || url.includes('youtu.be')) {
      type = 'youtube'
    }
    responseBody = await fetchBodyAfterPageLoad(url, type)

  }
  catch (subError) {
    console.log(`SUPERERROR: ${url}: ${subError}`)
  }

  return responseBody;
};

exports.fetchKeywordsFromUrl = fetchKeywordsFromUrl;
//
// const generateTfIdf = async () => {
//   const tfidf = new TfIdf();
//
//   const useableLinkMessages = []
//   await LinkMessage.findAll().then(async (linkMessages) => {
//     for (const linkMessageInstance of linkMessages) {
//       const {url} = linkMessageInstance
//       console.log('Parsing Link:', url);
//       try {
//         const [body] = await fetchKeywordsFromUrl(url)
//         useableLinkMessages.push({
//           instance: linkMessageInstance,
//           body
//         })
//       } catch (error) {
//         console.log('EERROR: some error occured on url ', url, ': ', error)
//       }
//     }
//   })
//
//   for (const [index, {instance, body}] of Object.entries(useableLinkMessages)) {
//     const {url} = instance
//     console.log('Adding Link to tfidf:', url);
//     console.log('Index', index)
//     try {
//       tfidf.addDocument(body)
//       await instance.update({
//         tfIdfIndex: parseInt(index)
//       })
//     } catch (error) {
//       console.log('EERROR: some error occured on url ', url, ': ', error)
//     }
//   }
//   const result = JSON.stringify(tfidf);
//   fs.writeFileSync('tdidfStore.json', result, () => {})
// };

const topWordScores = (scores, number) => {
  return Object.keys(scores).sort((gramA, gramB) => scores[gramB] - scores[gramA]).slice(0, number);
}

exports.topWordScores = topWordScores


const run = async () => {
  // const [body, topList] = await fetchKeywordsFromUrl('https://kotaku.com/sources-the-last-of-us-2-delayed-to-spring-1839322915')
  // const headingSentiment = sentiment.analyze(body || '').score
  // const strongKeywords = topList.slice(0, 5).filter(keyword => !!keyword);
  // await LinkMessage.update({
  //   linkBody: body,
  //   sentiment: headingSentiment
  // }, {
  //   where: {
  //     url: 'https://kotaku.com/sources-the-last-of-us-2-delayed-to-spring-1839322915'
  //   }
  // })
  // await LinkMessage.findAll({
  //   where: {
  //     url: 'https://kotaku.com/sources-the-last-of-us-2-delayed-to-spring-1839322915'
  //   }
  // }).then(async messages => {
  //   for (const message of messages) {
  //     for (const keyword of strongKeywords) {
  //       await LinkMessageKeyword.create({
  //         keyword,
  //         messageId: message.messageId
  //       })
  //     }
  //   }
  // });
  // for (const keyword of strongKeywords) {
  //   const bulkCreateData = strongKeywords.map(keyword => ({keyword, messageId: LinkMessage.})
  // }
  // console.log('hmm', body)


  await LinkMessage.findAll().then(async (linkMessages) => {
    for (const linkMessageInstance of linkMessages) {
      const {url} = linkMessageInstance
    // const url = 'https://www.reddit.com/r/Games/comments/dpoxo4/little_witch_academia_chamber_of_time_no_longer/'
      console.log('Parsing Link:', url);
      try {
        const [body, singleWordScores, biWordScores, triWordScores] = await fetchKeywordsFromUrl(url)
        // console.log(await fetchKeywordsFromUrl(url))
        const strongKeywords = {
          ...topWordScores(singleWordScores, 3).reduce((scores, gram) => ({...scores, [gram]: singleWordScores[gram]}), {}),
          ...topWordScores(biWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: biWordScores[gram]}), {}),
          ...topWordScores(triWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: triWordScores[gram]}), {})
        }
        const headingSentiment = sentiment.analyze(body || '').score
        // const strongKeywords = pickBy(wordScores, (value, key) => {
        //   return parseFloat(value) && (parseFloat(value) > breakpoint)
        // })
        console.log('Strong Keywords: ', strongKeywords)
        await LinkMessage.update({
          linkBody: body,
          sentiment: headingSentiment
        }, {
          where: {
            url
          }
        })
        await LinkMessage.findAll({
          where: {
            url
          }
        }).then(async messages => {
          for (const message of messages) {
            for (const keyword of Object.keys(strongKeywords)) {
              console.log('Value after activation', strongKeywords[keyword], normalizeScore(strongKeywords[keyword]))

              await LinkMessageKeyword.create({
                keyword,
                messageId: message.messageId,
                weight: normalizeScore(strongKeywords[keyword])
              })
            }
          }
        });
      } catch (error) {
        console.log('EERROR: some error occured on url ', url, ': ', error)
      }

    }
  })


}
// run()
// generateTfIdf()
//
// fetchKeywordsFromUrl('https://www.polygon.com/2019/11/20/20972925/legends-of-runeterra-beta-preview-riot-games')
