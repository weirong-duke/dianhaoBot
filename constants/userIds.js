// exports.generateMarkovResponse = generateMarkovResponse;
const fs = require('fs');
const usersRaw = fs.readFileSync(`users.json`);
let userIds;
try {
  userIds = JSON.parse(fs.readFileSync(`users.json`), {encoding: 'utf8'});
} catch (e) {
  console.log('INFO: No usersIds, will generate')
}

exports.userIds = userIds;
exports.dianhaoId = "104428683283943424";
