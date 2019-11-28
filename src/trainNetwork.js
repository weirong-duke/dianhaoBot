const brain = require('brain.js');
const fs = require('fs')
const data = fs.readFileSync('source.json', {encoding: 'utf8'});

const sortedData = data.split('\n').sort((a, b) => (a.length - b.length)).filter(string => string[0] !== '"');

const trainingData = sortedData.slice(5080,5105).map(words => words.replace(/<[^>]*>?/gm, '').replace(/[\\'"]/g, '').trim());

const networkData = JSON.parse(fs.readFileSync('messageNetwork.json', {encoding: 'utf8'}));

const network = new brain.recurrent.LSTM()
network.fromJSON(networkData)
console.log('hmm', trainingData)

network.train(trainingData, {
  iterations: 20000,
  log: true,
  logPeriod: 5
});
console.log(3)
const wordNet = network.toJSON();
fs.writeFileSync('messageNetwork.json', JSON.stringify(wordNet), () => {});
