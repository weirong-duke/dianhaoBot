var natural = require('natural');
const fs = require('fs')

const classifyText = async (heading) => {
  const classifierData = JSON.parse(fs.readFileSync('brain_classifier.json'));
  const classifier = natural.BayesClassifier.restore(classifierData);
  console.log(classifier.classify(heading));
  return classifier.classify(heading);
};

exports.classifyText = classifyText;
