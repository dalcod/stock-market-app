var express = require('express');
var request = require('request');
var stockSchema = require("./models/stock");
var path = require("path");
var router = express.Router();

router.get('/stocks', function(req, res, next){
    stockSchema.find({}, function(err, arr){
        const counter = 0;
        if (err) return res.status(500).send(err);
        return res.status(200).json(arr);
    });
});

router.post('/stock/:name', function(req, res, next){
    var name = req.params.name;
    var newStock = new stockSchema({
        name: name
    });
    newStock.save(function(err, done){
        if (err) return res.status(500).send(err);
        return res.status(200).json({'message': 'Stock saved'});
    });
});

router.delete('/stock/:name', function(req, res, next){
    var name = req.params.name;
    stockSchema.findOneAndRemove({name: name}, function(err, done){
        if (err) return res.status(500).send(err);
        return res.status(200).json({'message': 'Stock removed'}); 
    });
});

router.get('/', function(req, res, next){
    return res.status(200).sendFile('index.html', {root: path.join(__dirname, '/dist')});
});

module.exports = router;