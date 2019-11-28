const fs = require('fs');
const linksRaw = fs.readFileSync(`links.json`);
const request = require('request-promise');


const links = JSON.parse(linksRaw);
// console.log(JSON.parse(linksRaw));

const responses = {}
let linkCount = 0;
const generateHTMLData = async () => {
  for (const url of Object.keys(links)) {
    if (linkCount < 100) {
      linkCount += 1;
      try {
        console.log(`INFO: Retriving information for url ${url}`)
        await request(url, function (error, response, body) {
          if (error) {
            console.log(`DEBUG: Request error with url ${url}: ${error}`)
          }
          responses[body.replace(/[\n"\r]/g, "")] = url;
        });
      } catch (error) {
        console.log('DEBUG: Error occured trying the following URL: ', url);
        console.log('DEBUG: Error: ', error);
        console.log(' ---------------------------------------------------------- ')
      }
    }

  }
  fs.writeFile('htmlContent.json', JSON.stringify(responses), () => {})
}

generateHTMLData();
