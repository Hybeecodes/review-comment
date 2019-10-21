var express = require('express');
var router = express.Router();

const axios = require('axios');
const config = require('../config/config');
const CsvWriter = require('../utils/csvWriter');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/comments/:videoId', async function(req, res, next) {
  try {
    const { videoId } = req.params;
    const response = await axios.
      get('https://www.googleapis.com/youtube/v3/commentThreads',
       {
        params: {
          videoId,
          part: 'snippet',
          key: config.youtube.api_key
        }
      }
    );
    const comments = response.data.items;
    let records = [];
    comments.forEach((comment) => {
      const snippet = comment.snippet.topLevelComment.snippet;
      records.push(
        {
          username: snippet.authorDisplayName,
          date: snippet.publishedAt,
          star_rating:snippet.viewerRating,
          review_comment: snippet.textOriginal,
          link: snippet.link || 'Nil'
        }
      )
    });
    const csvWriter = CsvWriter(videoId);
    csvWriter.writeRecords(records)       // returns a promise
    .then(() => {
      res.status(200).send('success');
    }).catch((err) => {
      console.log('error occured ', err);
    })
  } catch (error) {
    res.status(500).send({"message": "Sorry, an error occured"});
    console.log(error)
  }
});

router.get('/comment/download/:videoId', function(req, res){
  try {
    const { videoId } = req.params;
    const file = `comments/comments-${videoId}.csv`
    res.download(file); // Set disposition and send it.
  } catch (error) {
    res.status(500).send('Sorry, Unable to download Comment File');
  }
});

module.exports = router;
