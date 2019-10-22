var express = require('express');
var router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');
const CsvWriter = require('../utils/csvWriter');
const nanoid = require('nanoid');
const scrap_reviews = require('../utils/srape_reviews');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/comments/:videoId', async (req, res, next) => {
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
    const csvWriter = CsvWriter(videoId, 'comment');
    //generate CSV
    csvWriter.writeRecords(records)       // returns a promise
    .then(() => {
      res.status(200).send('success');
    }).catch((err) => {
      console.log('error occured ', err);
    })
  } catch (error) {
    res.status(500).send({"message": "Sorry, an error occured"});
    console.log(error);
  }
});

router.get('/comment/download/:Id', (req, res) => {
  try {
    // serve comment csv file
    const { Id } = req.params;
    const file = `comments/comments-${Id}.csv`
    res.download(file); // Set disposition and send it.
  } catch (error) {
    console.log(error);
    res.status(500).send('Sorry, Unable to download Comment File');
  }
});

router.get('/review/download/:Id', (req, res) => {
  try {
    // serve review csv file
    const { Id } = req.params;
    const file = `reviews/reviews-${Id}.csv`
    res.download(file); // Set disposition and send it.
  } catch (error) {
    console.log(error);
    res.status(500).send('Sorry, Unable to download Review File');
  }
});

router.get('/reviews', (req, res) => {
  const { url } = req.body;
  if(!url) {
    return res.status(400).send({message: "URL is required"});
  }
  let records = [];
  axios(url)
      .then(async response => {
        const html = response.data;
        let $ = cheerio.load(html);
        const all_reviews_url = $('.a-link-emphasis').attr('href');
        // scrape all reviews page
        let newReviews = await scrap_reviews(`https://www.amazon.com${all_reviews_url}`);
        console.log('... first reviews ...');
        records.push(...newReviews); // add first set of reviews
        res.status(200).send('success'); // return succes message to the user while generating csv
        // check if there is a next page
          const nextPage = $('.a-form-actions').find('.a-last > a').html();
          console.log(nextPage);
          while (nextPage) {
            console.log('... subsequent reviews ...');
            newReviews = scrap_reviews(`https://www.amazon.com${nextPage}`); //scrape subsequent set of reviews
            records.push(...newReviews); // add subsequent set of reviews
          }
        // generate CSV
        const id = nanoid();
        const csvWriter = CsvWriter(id, 'review');
        csvWriter.writeRecords(records)       // returns a promise
        .then(() => {
            console.log('Reviews CSV generated')
            // send email to user
        }).catch((err) => {
            console.log('error occured ', err);
        })
      }).catch((error) => {

    })
  .catch(console.error);
})


module.exports = router;
