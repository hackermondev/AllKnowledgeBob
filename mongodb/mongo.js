const mongoose = require("mongoose");
const db = mongoose.connection;

const mongoURL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/bob?retryWrites=true&w=majority`;

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

db.on("error", console.error.bind(console, "connection error:"));

db.once("open", function () {
  console.log(`connected to mongodb`);
});

module.exports = {
  Response: require("./schemas/Response.js"),
  db: db,
};
