'use strict';

const cheerio = require('cheerio');

module.exports = (url) => {
    let records = [];
    axios(url)
    .then(result => {
        const $ = cheerio.load(result.data);
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
    });
    return records;
}