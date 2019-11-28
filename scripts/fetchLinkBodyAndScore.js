const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const {LinkMessage, LinkMessageKeyword} = require('../models/index');
const {normalizeScore} = require('../utils/general');

const fetchLinkBodyAndScore = async () => {
  await LinkMessage.findAll().then(async (linkMessages) => {
    for (const linkMessageInstance of linkMessages) {
      const {url} = linkMessageInstance;
      console.log('INFO: Parsing Link:', url);
      try {
        const [body, singleWordScores, biWordScores, triWordScores] = await fetchKeywordsFromUrl(url)

        const strongKeywords = {
          ...topWordScores(singleWordScores, 3).reduce((scores, gram) => ({...scores, [gram]: singleWordScores[gram]}), {}),
          ...topWordScores(biWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: biWordScores[gram]}), {}),
          ...topWordScores(triWordScores, 2).reduce((scores, gram) => ({...scores, [gram]: triWordScores[gram]}), {})
        };
        const headingSentiment = sentiment.analyze(body || '').score;
        console.log('INFO: Strong Keywords: ', strongKeywords)
        await LinkMessage.update({
          linkBody: body,
          sentiment: headingSentiment
        }, {
          where: {
            url
          }
        });
        await LinkMessage.findAll({
          where: {
            url
          }
        }).then(async messages => {
          for (const message of messages) {
            for (const keyword of Object.keys(strongKeywords)) {
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
};

fetchLinkBodyAndScore();
