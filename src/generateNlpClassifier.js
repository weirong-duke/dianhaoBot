const fs = require('fs')
const data = JSON.parse(fs.readFileSync('nlpHeadingsToKeywords.json', {encoding: 'utf8'}));
const {LinkMessage} = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op

const natural = require('natural');
const classifier = new natural.BayesClassifier();

for (const input of Object.keys(data)) {
  const output = data[input];
  console.log('input', input, ' output ', output)
  classifier.addDocument(input, output);
}

classifier.train();
const raw = JSON.stringify(classifier);
fs.writeFileSync('brain_classifier.json', raw, () =>{});

console.log(classifier.classify('Valve confirms Half-Life: Alyx, full reveal coming later this week')); // -> software
console.log(classifier.classify('Star Wars Jedi: Fallen Order')); // -> hardware
console.log(classifier.classify('apex apex apex apex')); // -> hardware
console.log(classifier.classify('what are my favorite games ')); // -> meeting


LinkMessage.findAll({
  where: {
    linkHeading: {
      [Op.not]: null
    }
  }
}).then(messages => {
  for (const message of messages) {
    console.log(`${message.url} - ${message.linkHeading}`)
    message.update({
      classification: classifier.classify(`${message.url} - ${message.linkHeading}`)
    })
  }
})
;
