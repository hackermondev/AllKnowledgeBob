/**
 * Clean string
 * @param { string } input
 * @returns string
 */

function cleanInput(input) {
  var output = "";
  for (var i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) <= 127) {
      output += input.charAt(i);
    }
  }

  return output;
}

function cleanOutput(output) {
  return output.replace(/(\r\n|\n|\r)/gm, "");
}

module.exports = {
  cleanInput,
  cleanOutput,
};
