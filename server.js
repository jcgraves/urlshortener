'use strict';

require('dotenv').config();
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var shortid = require('shortid');
const validUrl = require('valid-url')

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(cors());


app.use('/public', express.static(process.cwd() + '/public'));

const db = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch {
    console.log('err');
    process.exit(1);
  }
};

connectDB();

let urlSchema = mongoose.Schema({
  original_url: String,
  short_url: String,
});

let Url = mongoose.model('url', urlSchema);

// 
app.get("/api/shorturl/:url(*)", async (req, res) => {
  const urlCode = req.params.url;
  try {
    const longUrl = await routeToLongUrl(urlCode);
    return res.redirect(longUrl);
  } catch {
    return res.json({ error: "invalid URL" });
  }
});

async function routeToLongUrl(urlCode) {
  try {
    let urlObj = await Url.findOne({ short_url: urlCode });
    if (urlObj) {
      return urlObj.original_url;
    } else {
      return res.send({ error: "Url not found" });
    }
  } catch (e) {
    return e;
  }
}

app.post("/api/shorturl/new/:url(*)", async (req, res) => {
  // let url = req.params.url;
  // console.log("Posted");
  // console.log(url.toString());
  // const regex = /https?:\/\//
  // console.log(regex.test(url));
  // console.log("pinged");
  const longUrl = req.params.url;

  if (!validUrl.isUri(process.env.BASE_URL)) {
    console.log("invalid base url")
    res.status(401).json('Invalid base url');
  }

  const shortUrl = shortid.generate();
  
  if (validUrl.isUri(longUrl)) {
    try {
      let url = await Url.findOne({ longUrl });

      if (url) {
        res.json(url)
      } else {
        // const shortUrl = process.env.BASE_URL + '/' + urlCode;
        console.log(shortUrl);
        console.log(longUrl);
        url = new Url({
          original_url: longUrl,
          short_url: shortUrl,
        });
        try {
          await url.save();
          res.json(url)
        } catch(err) {
          console.log(err);
          res.send({"error":"invalid url"});
        }
      }
    } catch (err) {
      console.log(err);
      res.status(500).json('Server error')
    }
  } else {
    res.status(500).json('Invalid long Url')
  }
});

app.listen(port, function () {
  console.log("Node.js listening on port: " + port);
});

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
