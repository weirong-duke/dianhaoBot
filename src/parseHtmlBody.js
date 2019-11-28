const cheerio = require('cheerio');
const natural = require('natural');
const Nightmare = require('nightmare');
const sanitizeHtml = require('sanitize-html');

const nightmare = Nightmare();
const TfIdf = natural.TfIdf;
const NGrams = natural.NGrams;

const {cleanHtml, cleanHtmlBody} = require('../utils/strings');
const {removeStopwords} = require('../utils/stopwords');

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

          const wordList = cleanedBody.split(' ');
          const tfidf = new TfIdf();
          tfidf.addDocument(cleanedBody);

          const singleWordScores = generateWordScores(wordList, tfidf);
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


const topWordScores = (scores, number) => {
  return Object.keys(scores).sort((gramA, gramB) => scores[gramB] - scores[gramA]).slice(0, number);
};

exports.fetchKeywordsFromUrl = fetchKeywordsFromUrl;
exports.topWordScores = topWordScores;
