'use strict';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports = (videoId) => {
    const csvWriter = createCsvWriter({
        path: `comments/comments-${videoId}.csv`,
        header: [
            {id: 'username', title: 'UserName'},
            {id: 'date', title: 'Date'},
            {id: 'star_rating', title: 'Start rating'},
            {id: 'review_comment', title: 'Review or Comment'},
            {id: 'link', title: 'Link'}
        ]
      });
      return csvWriter;
}