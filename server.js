var DELTA = 1000 * 60;
var STATUS_ALIVE = 'ALIVE';
var STATUS_DEAD = 'DEAD';

FREQUENCIES = {
    'low': 1000 * 60 * 30,     // 30 min
    'default': 1000 * 60 * 10, // 10 min
    'high': 1000 * 60 * 5,     //  5 min
}

var express = require('express');
var bodyParser = require('body-parser')
var mongoose = require('mongoose');

var app = express();
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname + '/public'));


db_path = process.env['db_path'] || 'mongodb://localhost/test';

mongoose.connect(db_path);

var App = mongoose.model('App', { 
    name: String, 
    email: String,
    interval: Number, 
    status: String, 
    timestamp: Date 
});

app.get('/', function(req, res) {
    res.send("It works!!\n");
});

app.post('/apps/create', function(req, res) {
    var app = new App({ 
        name: req.body.name,
        email: req.body.email || '',
        interval: FREQUENCIES[req.body.frequency || 'default'],
        status: STATUS_DEAD,
    });
    app.save(function (err) {
        if (err) {
            console.log(err);
            res.send("Something went wrong. :(\n");
        } else {
            res.send("Success. Your app_id is: " + app._id + "\n");
        }
    });
    
});

app.get('/apps/:id', function(req, res) {
    var app_id = req.params.id;
    console.log(app_id);
    App.findById(app_id, function (err, app) {
        res.send(JSON.stringify({
            'app_id': app._id,
            'name': app.name,
            'email': app.email,
            'interval': app.interval + "ms",
            'status': app.status,
        }));
    });
});

app.post('/apps/poke', function(req, res) {
    var app_id = req.body.app_id;
    App.findById(app_id, function (err, app) {
        app.timestamp = Date.now();
        app.status = STATUS_ALIVE;
        app.save();
        console.log("Updated app " + app._id + " timestamp to " + app.timestamp.getTime());
        setTimeout(function() {
            console.log("Checking " + app_id);
            App.findById(app_id, function (err, app) {
                if (Date.now() - app.timestamp.getTime() >= app.interval) {
                    console.log("Current timestamp: " + Date.now());
                    console.log("App last updated: " + app.timestamp.getTime());
                    console.log("Something is wrong with " + app_id);
                    app.status = STATUS_DEAD;
                    app.save();
                }
            });
        }, app.interval + DELTA);
    });

    res.send("Success\n");
});


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});