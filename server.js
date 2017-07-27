const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const request = require('request')
var mongoose = require("mongoose");

const Schedule = require('./models/schedule')

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var connectionString = 'mongodb://user1:pass@ds163020.mlab.com:63020/moviesdb';
const port = 3000

mongoose.connect(connectionString, {
	useMongoClient: true,
}).then( () => {
	app.listen(port, () => {
		console.log('Magic happening on port '+port+'...');
	})
});




app.post('/webhook', (req, res) => {


    let output = ""
    let username= ""
    let user = req.body.originalRequest.data.event['user']
    let token = "xoxb-217397050229-sJ66P72Xk3KDdqfydvii2TZP"// bot auth token

    let host = "https://slack.com/api/users.info?token="+token+"&user="+user






if(req.body.result.metadata['intentName'] == "scheduleTalk"){

  var title = req.body.result.parameters['title'];
  console.log("title: "+title)
  
  let date = req.body.result.parameters['date'];
  console.log('Date: ' + date);


  Schedule.findOne({date: date}, (err,s)=>{
    if(err) return res.send(err)

    if(!s){

      request.get(host, (err, result) => {
        if(err) return res.send(err)

        username = JSON.parse(result.body).user.name
        console.log(username)
        Schedule.create({speaker: username, date: date, title: title},(err,schedule) => {
          if(err) return res.send(err)
          
          output = "Talk scheduled successfully! cya on "+date+"."
          
          res.setHeader('Content-Type', 'application/json');
          return res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
        })

      })//end of request

    }
    else{
      output = "the date "+date+" is already reserved for another talk. Would you like to see a list of reserved dates?"
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }

  })

////// END IF

}


else if( (req.body.result.metadata['intentName'] == "scheduleTalk-yes") || (req.body.result.metadata['intentName'] == "reservedDates") ){

  Schedule.find().exec( (err,schedules) => {
    if(err) res.send(err)

    output = "Here you go: \n\n";
    for(s of schedules){
      output += "\n- Talk about *"+s.title+"* Scheduled for "+s.date+"\n"
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': output, 'displayText': output }));


  })

}

  
  

});




//  schedule dates for meetings/talks