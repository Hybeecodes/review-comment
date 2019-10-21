'use strict';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

module.exports = (videoId, type) => {
    let path;
    if(type === 'review'){
        path = `reviews/reviews-${videoId}.csv`
    }else{
        path = `comments/comments-${videoId}.csv`;
    }
    const csvWriter = createCsvWriter({
        path,
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