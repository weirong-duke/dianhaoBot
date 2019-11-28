const fs = require('fs');
// const urlResponses = JSON.parse(fs.readFileSync('link.json'));
const readline = require('readline-sync');
const urlsToHeading = JSON.parse(fs.readFileSync('urlsToHeadings.json'));
const {LinkMessages} = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {disenfect} = require('../utils/strings');
const result = {}


const generateKeywords = async () => {
  const filteredData = Object.keys(urlsToHeading).reduce((filtered, url) => {
    const heading = urlsToHeading[url];
    return {
      ...filtered,
      ...(heading && heading.length > 10 ? {[url]: heading} : {})
    }
  }, {})
  console.log('filterd', filteredData)
  for (const [index, url] of Object.entries(Object.keys((urlsToHeading)))) {
    console.log(`Index: ${index}\n`)
    const heading = urlsToHeading[url];
    result[`${disenfect(url)} - ${disenfect(heading)}`] = disenfect(await readline.question(`${url} - ${heading}: `));
    fs.writeFileSync('nlpHeadingsToKeywords.json', JSON.stringify(result), () => {});
  }

};

generateKeywords();

