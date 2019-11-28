const stopwords = require('stopwords-json/dist/en.json');

const allStopwords = [...stopwords, 'copy', 'disabled', 'embed', 'javascript', 'policy', 'replying', 'undo']

exports.stopwords = allStopwords
