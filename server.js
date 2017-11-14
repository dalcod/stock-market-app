var express = require("express");
var app = express();
var server = require('http').Server(app);
var path = require("path");
var mongoose = require("mongoose");
var bodyParser = require('body-parser');

var io = require('socket.io')(server);

var routes = require("./routes");

// quì è impostato il socket dal lato server, il quale smisterà i dati ricevuti in base al tipo di evento e ne emetterà allo stesso tempo uno nuovo con all'interno un nuovo oggetto contenente il tipo di oggetto "type:" e i dati ricevuti dalla 'view' o lato client: "json: obj", "name: name".
io.on('connection', function (socket) {
    console.log('A user connected');
    socket.on('add-obj', (obj) => {
        io.emit('new-obj', {type: 'post', json: obj});
    });
    socket.on('delete-stockName', (name) => {
        io.emit('remove-stockName', {type: 'delete', name: name});
    });
});

// connettiti al database se si è in "localhost".
var mongoUrl = "mongodb://sulphurv:3MorsKomWin@ds159670.mlab.com:59670/thearchive";
// connettiti al database se si è lanciato l'app su heroku.
// var mongoUrl = process.env.MONGODB_URI;
mongoose.connect(mongoUrl);
mongoose.connection.on("error", console.error.bind(console, "Unable to connect to MongoDB."));

app.use(express.static(path.join(__dirname, "/dist")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(routes);

server.listen(process.env.PORT || 3000, function(){
    console.log("Successfully connected on port: 3000");
});