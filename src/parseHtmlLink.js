const request = require('request-promise');
const fs = require('fs');
const cheerio = require('cheerio');
const links = JSON.parse(fs.readFileSync(`links.json`));
const {LinkMessage} = require('../models');
var Sentiment = require('sentiment');
var sentiment = new Sentiment();
const {disenfect, cleanHtml} = require('../utils/strings');

const HEADER_SIZE = [1, 2, 3, 4, 5];
//types, youtube, twitter, streamable
const youtubeStrings = ['youtube', 'youtu.be'];
const twitterStrings = ['twitter.com'];
const Nightmare = require('nightmare')
const nightmare = Nightmare({show: true})
const selectorDict = {
  'halowaypoint': 'div.editorial-content section h3',
  'espn': 'header.article-header',
  'ign': 'div.article-headline',
  'twitch-clip': 'p.tw-c-text-alt-2.tw-ellipsis.tw-font-size-5',
  'twitter': `p.TweetTextSize.TweetTextSize--jumbo.js-tweet-text.tweet-text`,
  'youtube': 'span#eow-title'
};

const requestHeaders = {
  Host: "www.ign.com",
  Connection: "keep-alive",
  "Cache-Control": "max-age=0",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
  "Sec-Fetch-User": "?1",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "navigate",
  "Accept-Language": "en-US,en;q=0.9"
};

const urlHeaders = {};
const parseBody = (body, type, url) => {
  const contentResults = {};

  try {
    if (type) {
      if (type === 'twitch') {
        contentResults[1] = url.split('www.twitch.tv/')[1];
      } else if (type === 'youtube-user') {
        contentResults[1] = url.split('/')[4];
      } else {
        let $ = cheerio.load(body);
        const selector = selectorDict[type];
        let title = $(selector).text();
        contentResults[1] = title.trim()
      }
    } else {
      for (const size of HEADER_SIZE) {
        const contentRegex = new RegExp(`<h${size}.*?>(.*?)<\\/h${size}>`, 'g')
        const contentMatch = contentRegex.exec(body)
        contentResults[size] = contentMatch ? cleanHtml(contentMatch[1]): '';
      }
    }
  } catch (error) {
    throw error;
  }


  return (contentResults[1] || contentResults[2] || contentResults[3] || contentResults[4] || contentResults[5])
};

const fetchBodyAfterPageLoad = async (milliseconds, url, type) => {
  return await nightmare
    .goto(url)
    .wait(milliseconds)
    .evaluate(() => {
      return document.body.innerHTML
    })
    .then(nightmareBody => {
      const nightmareHeading = parseBody(nightmareBody, type, url)
      urlHeaders[url] = disenfect(nightmareHeading);
      return [nightmareHeading, cleanHtml(nightmareBody)]
    })
};

const fetchHeadingFromUrl = async (url) => {
  let responseBody = '';
  let content = '';
  if (url.includes('clips.twitch')) {
    [content, responseBody] = await fetchBodyAfterPageLoad(5000, url, 'twitch-clip', url)
  } else {
    try {
      await request(url, async (_, __, body) => {
        let overwrittenBody = null;
        let type = null;
        if (youtubeStrings.some(string => url.includes(string))) {
          if (url.includes('/user/')) {
            type = 'youtube-user'
          } else {
            type = 'youtube';
          }
        } else if (twitterStrings.some(string => url.includes(string))) {
          type = 'twitter';
        }
        else if (url.includes('www.twitch.tv')) {
          type = 'twitch'
        } else if (url.includes('espn.com')) {
          type = 'espn'
        } else if (url.includes('halowaypoint')) {
          type = 'halowaypoint'
        }
        responseBody = body;
        content = parseBody(overwrittenBody || responseBody, type, url)
        urlHeaders[url] = disenfect(content);
      });
      // if (!content || content.length < 10) {
      //
      //   console.log('Header for ', url)
      //   console.log(content)
      //   console.log('======================================')
      // }

    } catch (error) {
      try {
        if (url.includes('clips.twitch')) {
          [content, responseBody] = await fetchBodyAfterPageLoad(5000, url, 'twitch-clip', url)
        } else if (url.includes('ign.com')) {
          [content, responseBody] = await fetchBodyAfterPageLoad(1000, url, 'ign')
        } else {
          [content, responseBody] = await fetchBodyAfterPageLoad(1000, url)
        }
      }
      catch (subError) {
        console.log(`SUPERERROR: ${url}: ${subError}`)
      }
    }
  }

  return request && [content, responseBody];
};

exports.fetchHeadingFromUrl = fetchHeadingFromUrl;

// const run = async () => {
//   // const [content, body] = await fetchHeadingFromUrl('https://twitter.com/koyoriin/status/821001822840168453')
//   console.log('hmm', content)
//   for (const url of Object.keys(links)) {
//     const [heading, body] = await fetchHeadingFromUrl(url)
//     const headingSentiment = sentiment.analyze(body || '').score
//     console.log('Sentiment', url, heading, headingSentiment)
//     const values = {
//       linkHeading: heading,
//       sentiment: headingSentiment
//     };
//     const options = {
//       where: {
//         url
//       }
//     };
//     LinkMessage.update(values, options);
//   }
//   fs.writeFileSync('urlsToHeadings.json', JSON.stringify(urlHeaders))
//
// }
//
// run();
//
// fetchHeadingFromUrl('https://www.polygon.com/2019/11/20/20972925/legends-of-runeterra-beta-preview-riot-games')
