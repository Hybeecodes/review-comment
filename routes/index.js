var express = require('express');
var router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');
const CsvWriter = require('../utils/csvWriter');
const nanoid = require('nanoid');

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
    const { Id } = req.params;
    const file = `comments/comments-${Id}.csv`
    res.download(file); // Set disposition and send it.
  } catch (error) {
    console.log(error);
    res.status(500).send('Sorry, Unable to download Comment File');
  }
});

router.get('/reviews', (req, res) => {
  const { url } = req.body;
  if(!url) {
    return res.status(400).send({message: "URL is required"});
  }
  let records = [];
  axios(url)
      .then(response => {
        const html = response.data;
        let $ = cheerio.load(html);
        const all_reviews_url = $('.a-link-emphasis').attr('href');
        // scrape all reviews page
        axios(`https://www.amazon.com${all_reviews_url}`)
        .then(result => {
          $ = cheerio.load(result.data);
          const reviews = $('.review-views').find('.review');
          reviews.each((i, rev) => {
            const username = $(rev).find('span.a-profile-name').text();
            const date = $(rev).find('.review-date').text();
            const star_rating = $(rev).find('.review-rating > .a-icon-alt').text();
            const review_comment = $(rev).find('.review-title > span').text();
            const link = $(rev).find('.review-title').attr('href');
            records.push(
              {
                username,
                date,
                star_rating,
                review_comment,
                link
              }
            )
      })
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
            res.status(200).send('success'); // return succes message to the user while generating csv
          });
        }).catch((error) => {

        })
      .catch(console.error);
})


module.exports = router;
