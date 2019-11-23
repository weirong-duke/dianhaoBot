const path = 'source.json';
const fs = require('fs');
const lineReader = require('readline').createInterface({
  input: fs.createReadStream(path)
});

MARKOV_CHAIN_ORDER = 3;
const savedMarkovModels = {1: {}, 2: {}, 3: {}};
const beginnings = {1: [], 2:[], 3: []};
console.log('INFO: Generating Markov Models');

lineReader.on('line', function (line) {
  const source = JSON.stringify(line).replace(/[\\\n"\r]/g, "").toLowerCase();

  const words = source.split(' ');
  for (let order = 1; order <= MARKOV_CHAIN_ORDER; order ++) {
    let beginning = words.slice(0, order).join(' ');
    if (!beginning.includes('http')) {
      beginnings[order].push(beginning);
    }
    const markovModel = savedMarkovModels[order];
    for (let wordIndex = 0; wordIndex < words.length ; wordIndex++) {

      const gram = words.slice(wordIndex, wordIndex + order).join(' ');
      const nextGram = wordIndex + order <= words.length ? words[wordIndex + order] : '';
      if (nextGram) {

        if (!markovModel[gram]) {
          markovModel[gram] = [nextGram]
        } else {
          markovModel[gram] = [...markovModel[gram], nextGram]
        }
      }
    }
    savedMarkovModels[order] = savedMarkovModels[order] ? {...savedMarkovModels[order], ...markovModel} : markovModel
  }

});

lineReader.on('close', () => {
  console.log('INFO: Finished generating models');
  for (let order = 1; order <= MARKOV_CHAIN_ORDER; order ++) {
    const path = `./ngrams/markov${order}gram.json`;
    fs.writeFile(path, JSON.stringify(savedMarkovModels[order]), () => {})
    const beginningsPath = `./beginnings/markovBeginnings${order}.json`;
    fs.writeFile(beginningsPath, JSON.stringify(beginnings[order]), () => {});
  }
});
