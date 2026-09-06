const memes = require('./memes.json');

function pickRandomMeme() {
  return memes[Math.floor(Math.random() * memes.length)];
}

module.exports = { pickRandomMeme };
