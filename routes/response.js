const express = require("express");
const rateLimit = require("express-rate-limit");
const mongo = require("../mongodb/mongo.js");

const router = express.Router();

const { v4 } = require("uuid");
const openai = require("../client/openai");
const cached = require("../client/cache");
const analytics = require("../meta/analytics.json");

const limiter = rateLimit({
  windowMs: 15 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply the rate limiting middleware to all requests
router.use(limiter);

router.post("/", async (req, res) => {
  const { text, createdAt, fingerprint, stream = true } = req.body;
  if (!text || !createdAt) return res.status(400).send();

  const cache = await cached.findCached(text);
  if (cache.response) {
    res.setHeader("x-cached", true);

    if (!stream) {
      return res.json(cache);
    } else {
      res.statusCode = 200;
      res.setHeader("x-response-id", cache.id);

      // Emulate typing
      const sections = cache.response.split(" ");
      for (var section in sections) {
        const t = sections[section];
        res.write(Buffer.from(`${t} `));
        await new Promise((r) => setTimeout(r, 50));
      }

      // res.write(cache.response);
      res.end();
    }

    return;
  }

  const response = await openai.generateResponse(text, stream);
  const ip = req.headers["x-forwarded-for"];

  if (!stream) {
    const id = await cached.createCachedText(text, response, ip);
    return res.json({
      error: null,
      response,
      id,
    });
  } else {
    const id = v4();
    res.statusCode = 200;

    res.set("x-response-id", id);
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", async () => {
      const response = Buffer.concat(chunks).toString();
      await cached.createCachedText(text, response, ip, id);
    });

    response.pipe(res);
  }
});

router.get("/:id", async (req, res) => {
  const data = await cached.findCacheByID(req.params["id"]);
  if (!data.response) return res.status(404).end(`not found`);

  res.render("home", {
    meta: {},
    data,
    renderAnalytics: true,
    analytics: require("../meta/analytics.json"),
    isProduction: process.env["NODE_ENV"] == "production",
    banner: {},
  });
});

module.exports = router;
