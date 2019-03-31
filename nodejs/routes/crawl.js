const axios = require("axios");
const express = require('express');
const router = express.Router();

const newsURL = 'http://c.m.163.com/nc/article/headline/T1348647853363/0-100.html';

const fetchNews = async url => {
    try{
        const response = await axios.get(url);
        const json = response.data;
        console.log(json);
        return json;
    }catch (e) {
        console.log(e);
    }
};

/* GET crawl page. */
router.get('/', function(req, res, next) {
    let promise = fetchNews(newsURL);
    promise.then(json=>{
        res.render('crawl', { title: 'Crawl', json:json });
    })


});

module.exports = router;
