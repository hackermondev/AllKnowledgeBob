const mongo = require("../mongodb/mongo");
const { v4 } = require("uuid");
const encoder = new TextEncoder();

// Function called textToToken
// Takes a piece of text
// Removes all quotations, spaces in the text.
// Then converts into Uint8array
function textToToken(text) {
  return encoder
    .encode(text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s/g, ""))
    .join("");
}

async function createCachedText(prompt, response, creatorIP, id) {
  const token = textToToken(prompt);
  const data = {
    id: id || v4(),
    creator: creatorIP,
    response,
    prompt,
    token,
    tokenGroup: token.substring(0, 15),
  };

  const res = new mongo.Response(data);
  await res.save();
}

async function findCached(text) {
  const token = textToToken(text);
  const tokenGroup = token.substring(0, 15);

  const responses = await mongo.Response.find({
    tokenGroup,
  }).exec();
  if (responses.length == 0)
    return {
      response: null,
    };

  const percentageOfNotCaching = 100 - responses.length * 6;
  const n = Math.floor(Math.random() * 100) + 1;

  if (n > percentageOfNotCaching) {
    const entry = responses[Math.floor(Math.random() * responses.length) + 0];

    return {
      id: entry.id,
      response: entry.response.toString(),
      date: entry.date,
      prompt: entry.prompt,
    };
  } else {
    return {
      response: null,
    };
  }

  return;
}

async function findCacheByID(id) {
  const responses = await mongo.Response.find({
    id,
  }).exec();
  if (responses.length == 0)
    return {
      response: null,
    };

  const percentageOfNotCaching = 100 - responses.length * 6;
  const n = Math.floor(Math.random() * 100) + 1;

  return responses[0];
}

module.exports = {
  findCached,
  createCachedText,
  findCacheByID,
};
