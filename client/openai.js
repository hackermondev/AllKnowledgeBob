// import { OpenAI } from 'gpt-x';
const utils = require("./utils");

const { OpenAI } = require("openai");
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const bobPrompt = `Bob is a all-knowing bot. Answer the (prompt) in 2-3 sentences max. If the inquiry is intended at Bob, simply respond to it. Prompt: "{}"`;

/**
 * Get OpenAI's response. (Checks cached first)
 * @param { string } input
 * @returns string response
 */
const generateResponse = async (text, stream = true) => {
  text = utils.cleanInput(text);

  // Validate
  let validated = true;
  if (text.length < 0 || text.length > 50) {
    validated = false;
  }

  if (!validated) throw new Error("Invalid request.");

  const functionName = stream ? "completeAndStream" : "complete";
  const model = "text-davinci-002";
  const options = {
    prompt: bobPrompt.replace("{}", text),
    best_of: 1,
    temperature: 0.76,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0.2,
    presence_penalty: 0,
    stream,
  };

  if (stream) {
    apiCall = await openai.completionTextStream(model, options);
  } else {
    apiCall = await openai.complete(model, options);
  }

  if (!stream) {
    const response = apiCall.choices[0].text;
    return utils.cleanOutput(response);
  } else {
    return apiCall;
  }
};

module.exports = {
  openai,
  generateResponse,
};
