const {regexes} = require('../constants/general')
const disenfect = (inputString) => {
  return inputString ? inputString.trim().replace(/[\\'"]/g, '').replace(/[\n"\r]/g, "") : ''
};

const cleanHtml = (inputString) => {
  return disenfect(inputString)
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g,' ')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
};

const cleanHtmlBody = (body) => {
  return body.toLowerCase().replace(regexes.twitterPicUrl, '').replace(regexes.url, '').replace(/[^a-zA-Z0-9\s]/g, '').replace(/[\n"\r]/g, "")
};


exports.disenfect = disenfect;
exports.cleanHtml = cleanHtml;
exports.cleanHtmlBody = cleanHtmlBody;
