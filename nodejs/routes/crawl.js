const mongo = require('mongodb');
const axios = require("axios");
const express = require('express');
const router = express.Router();

const NEWS_URL = 'http://c.m.163.com/nc/article/headline/T1348647853363/0-100.html';

const fetchNews = async url => {
    try {
        const response = await axios.get(url);
        const json = response.data;
        console.log(json);
        return json;
    } catch (e) {
        console.log(e);
    }
};

const MongoClient = require('mongodb').MongoClient;
const DATABASE_URL = "mongodb://localhost:27017/news";

const insertToDB = async (json) => {
    let db, client;
    let newsList = json['T1348647853363'];
    newsList.forEach(doc => {
        doc['_id'] = doc['docid'];
    });
    try {
        client = await MongoClient.connect(DATABASE_URL, {useNewUrlParser: true});
        db = client.db('news');
        try {
            const result = await db.collection('headlines').insertMany(newsList, {ordered: false});
            return result;
        } catch (e) {
            if (e.result.result.nInserted > 0) {
                return e.result.insertedIds;
            }
            return null;
        }
    } finally {
        client.close();
    }
};


const render = async (req, res) => {
    const json = await fetchNews(NEWS_URL);
    const dbResult = await insertToDB(json);
    let newsList = json['T1348647853363'];
    let insertedArticles = [];
    let abandonedArticleCount = newsList.length;
    if (dbResult && (dbResult.nInserted > 0 || dbResult.insertedCount > 0)) {
        const insertedCount = dbResult.insertedCount > 0 ? dbResult.insertedCount : dbResult.nInserted;
        // make a map from array
        let articleMap = {};
        newsList.forEach(news => {
            articleMap[news['docid']] = news;
        });
        for (let i in dbResult.insertedIds) {
            let id = dbResult.insertedIds[i];
            insertedArticles.push(articleMap[id]);
        }
        abandonedArticleCount = newsList.length - insertedCount;
    }
    res.render('crawl', {title: 'Crawl', articles: insertedArticles, abandoned: abandonedArticleCount});
};

/* GET crawl page. */
router.get('/', async function (req, res, next) {
    try {
        render(req, res);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
