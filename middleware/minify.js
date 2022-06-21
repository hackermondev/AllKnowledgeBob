const minify = require("minify");
const path = require("path");
const fs = require("fs");

module.exports = async (req, res, next) => {
  const { url } = req;

  const isExt = /\.(js|css|html)$/.test(url);

  const name = path.join(path.join(__dirname, `../`), url);
  var isMinify = true;

  if (!fs.existsSync(name)) {
    isMinify = false;
  }

  if (!isExt || !isMinify) return next();

  try {
    var minified = await minify(name, `name`);

    res.end(minified);
  } catch (err) {
    console.error(err);

    // return unminified version if it doesnt work
    res.end(fs.readFileSync(name));
  }
};
