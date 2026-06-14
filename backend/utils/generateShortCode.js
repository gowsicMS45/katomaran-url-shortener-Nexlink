const { customAlphabet } = require('nanoid');

// Alphanumeric alphabet (62 characters) to generate 6-character unique codes
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nanoid = customAlphabet(alphabet, 6);

const generateShortCode = () => {
  return nanoid();
};

module.exports = generateShortCode;
