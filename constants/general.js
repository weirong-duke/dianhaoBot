
const EMOJI_IDS = ['261361566954291201', '261348483309502464', '261361559882694657', '261361577276604416', '336347732782350336'];
const DIANHAO_NAMES = ['dlo', 'dianhao', 'lolo', '<@!104428683283943424>', '<@104428683283943424>'];

const OG_GENERAL_CHANNEL_ID = "140686998498312192";
const OG_KRIEGER_CHANNEL_ID = "325734685747445761";
const OG_ICEFROG_CHANNEL_ID = "514521219635347477";
const OG_SERIOUS_CHANNEL_ID = "611711063905402904";
const OG_WEABOO_CHANNEL_ID = "412328830867603467";
const WILSON_GENERAL_CHANNEL_ID = "256941913691783168";
const TEST_CHANNEL = "642520905754607618";
const TIME_BETWEEN_MESSAGES_MILLISECONDS = 20000;

const BOT_COMMAND_PREFIX = '!'

const channels = {
  OG_GENERAL_CHANNEL_ID,
  OG_KRIEGER_CHANNEL_ID,
  OG_ICEFROG_CHANNEL_ID,
  OG_SERIOUS_CHANNEL_ID,
  OG_WEABOO_CHANNEL_ID,
  WILSON_GENERAL_CHANNEL_ID,
  TEST_CHANNEL
};

const DATA_SOURCE_PATH = "source.json";

const URL_REGEX = new RegExp(`((([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[\\-;:&=\\+\\$,\\w]+@)?[A-Za-z0-9\\.\\-]+|(?:www\\.|[\\-;:&=\\+\\$,\\w]+@)[A-Za-z0-9\\.\\-]+)((?:\\/[\\+~%\\/\\.\\w\\-_]*)?\\??(?:[\\-\\+=&;%@\\.\\w_]*)#?(?:[\\.\\!\\/\\\\\\w]*))?)`, 'g');
const TWITTER_PIC_URL_REGEX = new RegExp(`pic.twitter.com\\/[a-zA-z0-9]+`, 'g');

const regexes = {
  url: URL_REGEX,
  twitterPicUrl: TWITTER_PIC_URL_REGEX
};

exports.botCommandPrefix = BOT_COMMAND_PREFIX;
exports.channels = channels;
exports.dataSourcePath = DATA_SOURCE_PATH;
exports.dianhaoNames = DIANHAO_NAMES;
exports.emojiIds = EMOJI_IDS;
exports.regexes = regexes;
exports.timeBetweenMessages = TIME_BETWEEN_MESSAGES_MILLISECONDS;
