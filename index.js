const express = require("express");
const fetch = require("node-fetch");

const winston = require("winston");
const PORT = process.env.PORT || 3000;
const path = require("path");

const expressMinifyHTML = require("express-minify-html");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const minify = require("./middleware/minify");

const fs = require("fs");

const response = require("./routes/response");

const helmet = require("helmet");
const bodyParser = require("body-parser");
const limit = require("express-limit").limit;

let meta = {
  analytics: require("./meta/analytics.json"),
  isProduction: process.env["NODE_ENV"] == "production",
  meta: require("./meta/meta.json"),
  offline: false,
  banner: {
    smallTitle: `Check out our post on Replit Community`,
    bigTitle: `Be sure to check out our post on Replit Community`,
    buttonName: "Replit",
    buttonURL: "https://replit.com/@HackermonDev/AllKnowledgeBob?v=1",
  },
};

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, `logs/error.log`),
      level: "error",
    }),

    new winston.transports.File({
      filename: path.join(__dirname, `logs/combined.log`),
    }),

    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

let app = express();

app.use((req, res, next) => {
  if (req.headers["host"] != "bobbot.ml") {
    return res.redirect(`https://bobbot.ml${req.url}`);
  }

  next();
});

// Security & Improvment Middleware

if (process.env["NODE_ENV"] == "production") {
  app.use(
    expressMinifyHTML({
      override: true,
      exception_url: false,
      htmlMinifier: {
        removeComments: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        minifyJS: true,
      },
    })
  );
  app.use(compression());

  // app.use(
  // helmet({
  //  contentSecurityPolicy: false,
  //  })
  // );
}

app.use("/static", express.static("static"));
app.use(express.static("static"));

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use((req, res, next) => {
  if (
    req.path.search("static") == -1 &&
    req.path.search("scripts") == -1 &&
    req.path.search("arc-sw.js") == -1
  ) {
    logger.log(
      "info",
      `${req.method} ${req.path}. ua: ${req.headers["user-agent"]} ip: ${
        req.headers["x-forwarded-for"]
      }. data: ${JSON.stringify(req.body)}`
    );
  }

  next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

if (meta.offline) {
  app.use((req, res) => {
    const metaForPage = JSON.parse(JSON.stringify(meta));
    metaForPage["data"] = {};
    metaForPage["meta"] = meta["meta"][req.path];
    metaForPage["renderAnalytics"] = false;

    if (req.header("dnt") == 1) {
      metaForPage["renderAnalytics"] = false;
    }

    if (meta.isProduction == true) {
      metaForPage["cache"] = true;
    }

    res.render("offline", metaForPage);
  });
}

// Routes
app.use("/response", response);

app.get("/", async (req, res) => {
  // copy json
  const metaForPage = JSON.parse(JSON.stringify(meta));
  metaForPage["data"] = {};
  metaForPage["meta"] = meta["meta"][req.path];

  if (
    meta["isProduction"] == true &&
    req.cookies["disable_analytics"] == undefined
  ) {
    metaForPage["renderAnalytics"] = true;
  } else {
    metaForPage["renderAnalytics"] = false;
  }

  if (req.header("dnt") == 1) {
    metaForPage["renderAnalytics"] = false;
  }

  if (meta.isProduction == true) {
    metaForPage["cache"] = true;
  }

  res.render(`home`, metaForPage);
});

// app.get("/analytics", (req, res) => {
//   res.redirect(`https://ackee-production-yukv.up.railway.app/`);
// });

// app.get("/scripts/science.js", async (req, res) => {
//   try {
//     var fetchRes = await fetch(
//       `https://${meta.analytics.AckeeHost}/tracker.js`
//     );

//     var text = await fetchRes.text();

//     res.set(`content-type`, `text/javascript`);
//     res.end(text);
//   } catch (err) {
//     logger.log(`error`, `Failed to load analytics ${err}`);

//     res.end(`alert('failed to load analytics');`);
//   }
// });

app.get("*", (req, res) => {
  res.status(404).render(`404`, {
    meta: {
      Name: "404 Not Found",
      Description: "The page you were looking for was not found!",
    },
  });
});

app.listen(PORT, () => {
  logger.log(
    `info`,
    `Starting app as (${process.env.NODE_ENV}) ${new Date().toString()}`
  );
});
