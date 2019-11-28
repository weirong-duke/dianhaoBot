const {stopwords} = require('../constants/stopwords/stopwords');
const twitterStopwords = require('../constants/stopwords/twitter-stopwords.json');
const combinedStopwords = [...stopwords, ...twitterStopwords];

const removeStopwords = (body) => {
  return body.replace(/\s+/g,' ').split(' ').filter(word => !combinedStopwords.includes(word)).join(' ')
};

exports.removeStopwords = removeStopwords;
