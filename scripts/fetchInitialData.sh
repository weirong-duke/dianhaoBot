mkdir -p beginnings
mkdir -p ngrams
touch source.json
node scripts/fetchMessageData.js
node scripts/generateMarkovData.js
