'use strict';

const express = require('express');
const request = require('request');
const dotenv  = require('dotenv');
const bodyParser = require('body-parser');
//const sockio = require('socket.io');

// DataBase Config
const dbHost = process.env.DBHOST || '192.168.0.102'
const dbPort = process.env.DBPORT ||  28015
const dbName = process.env.DBNAME || 'UrlStatus'

// DataBase Connection
var r = require('rethinkdb')
var Pool = require('rethinkdb-pool')
var pool = Pool(r, {
    host: dbHost,
    port: dbPort,
    db: dbName,
});

let connection;
r.connect({host: dbHost, port: dbPort, db: dbName})
    .then(conn => {
      connection = conn;
      console.log('---- Connection Ready ---');
    });

//Env Conig
dotenv.config();

var app = express();
// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

//app port
var port = process.env.PORT || 3000;

//  Middleware to close a connection to the database
// app.use(closeConnection);


/* -------------------------- App Rotings ------------------ */

app.get('/', (req, res) => {
    console.log(new Date());
    res.send({"info":"Realtime Host Status report Service online"}); 
});

app.post('/events',jsonParser, (req,res,next)=>{  
    getAllEventsData(req,res,next); 
});
// get last event by uid
app.post('/lastevent',jsonParser,(req,res,next)=>{
    getlastEventByUid(req,res,next);
})

// TODO: Implement
app.post('/eventsrange',jsonParser, (req,res,next)=>{  
    getAllEventsData(req,res,next); 
});




/* -------------------------- App Rotings Ends ------------------ */
app.listen(port, function () {
    console.log('Server started on port: ' + port);
})
/* -----------------------Socket.io --------------------------------
// const io = sockio.listen(app.listen(port, function () {
//     console.log('Server started on port: ' + port);
// }));

// io.on('connection', function(socket){
//     socket.on('join', function (data) {
//     socket.join(data.uid); // We are using room of socket io
//     console.log('Client connected '+ uid);
// })
// })
/* -----------------------Socket.io ------------------------------------
/* ************************** Handler function ******************************  */

// Careful fully blocking call
function getAllEventsData(req,res,next){
    
    // Received uid from client and return Data
    let uid = req.body.uid;
    let limit = req.body.limit;
    
    if(uid === undefined)
    {
        res.status(200).send('Uid not supplied');
    }

    if(limit === undefined)
    {
        limit = 10;
        
    }else if(limit instanceof String ||typeof limit === 'string')
    {
        limit = parseInt(limit);

    }
   

   r.table('urlstat').orderBy({index: r.desc('timestamp')}).filter({uid:uid}).limit(limit).run(connection).then(function(cursor) {
        return cursor.toArray();
    }).then(function(result) {
        res.status(200).send(JSON.stringify(result));
    }).error(handleError(res))
    .finally(next);
}

function getlastEventByUid(req,res,next){
    let uid = req.body.uid;
    r.table('urlstat').orderBy({index: r.desc('timestamp')}).filter({uid:uid}).limit(1).run(connection).then(function(cursor) {
        return cursor.toArray();
    }).then(function(result) {
        res.status(200).send(JSON.stringify(result));
    }).error(handleError(res))
    .finally(next);
}

function getRangeEventData(req,res,next){

    // uid, start_time_stamp
    let uid = req.body.uid;
    let start_time_stamp = req.body.start_time_stamp;
    

    r.table("urlstat").filter({uid: uid}).run(connection, function(err, result) {
        if(err) {
            return next(err);
          }
      
        result.each((err,row) =>console.log(row));
        res.send("Sending...")
    });

}




/* -----------  App Specofoc Config function -------- */
/*
 * Send back a 500 error
 */
function handleError(res) {
    return function(error) {
        res.send(500, {error: error.message});
    }
}

/*
 * Close the RethinkDB connection
 */
function closeConnection(req, res, next) {
    connection.close();
}

/* TODO: NOT USING NOW
 * Create a RethinkDB connection, and save it in req._rdbConn
 */
function createConnection(req, res, next) {
    r.connect(config.rethinkdb).then(function(conn) {
        req._rdbConn = conn;
        next();
    }).error(handleError(res));
}
