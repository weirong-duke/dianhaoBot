const fs = require('fs');

String.prototype.tokenize = function() {
  return this.split(/\s+/);
};

Array.prototype.choice = function() {
  const i = Math.floor(Math.random() * this.length);
  return this[i];
};

const generateMarkovResponse = (order, max) => {
  const markovModel = JSON.parse(fs.readFileSync(`ngrams/markov${order}Gram.json`, {encoding: 'utf8'}));
  const beginnings = JSON.parse(fs.readFileSync(`beginnings/markovBeginnings${order}.json`), {encoding: 'utf8'});
  let current = beginnings.choice();

  const output = current.tokenize();

  // Generate a new token max number of times
  for (let i = 0; i < max; i++) {
    if (markovModel[current]) {
      const possible_next = markovModel[current];
      const next = possible_next.choice();
      output.push(next);
      current = output.slice(output.length - order, output.length).join(' ');
    } else {
      break;
    }
  }
  return output.join(' ');
};

exports.generateMarkovResponse = generateMarkovResponse;
