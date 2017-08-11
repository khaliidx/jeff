const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const request = require('request')
var mongoose = require("mongoose");
const moment = require("moment")
const private = require("./private")
const Schedule = require('./models/schedule')
const User = require('./models/user')

const CronJob = require('cron').CronJob;
const ontime = require("ontime")

const notify = require('./notif')

mongoose.Promise = global.Promise;/////////////////// plug bluebird for better performance 

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var connectionString = 'mongodb://user1:pass@ds163020.mlab.com:63020/moviesdb';
const port = 8000

mongoose.connect(connectionString, {
	useMongoClient: true,
}).then( () => {
	app.listen(port, () => {
		console.log('Magic happening on port '+port+'...');
	})
});



const job = new CronJob('00 00 10 * * 3,5', function() {
    notify()
  }, function () {},
  false /* Don't Start the job right now */
);




app.post('/webhook', (req, res) => {


    let output = ""
    let username= ""
    let user = req.body.originalRequest.data.event['user']
    let token = private.token
    let host = "https://slack.com/api/users.info?token="+token+"&user="+user



//////////////////////////////////////////////////////////////////////////////////////////
// if(user != "U665532RZ"){
//   output = "I'm just here so I won't get fined."
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
// }
//////////////////////////////////////////////////////////////////////////////////////////






// Intents : ScheduleTalk, ScheduleTalk-change

if( (req.body.result.metadata['intentName'] == "scheduleTalk") || (req.body.result.metadata['intentName'] == "scheduleTalk-change") ){

  console.log(req.body.result.metadata['intentName'])


  var title = req.body.result.parameters['title'];
  console.log("title: "+title)
  
  let date = req.body.result.parameters['date'];
  date = moment(date).format("ddd MMM Do YYYY")
  console.log('Date: ' + date);


  Schedule.findOne({date: date}, (err,s)=>{
    if(err) return res.send(err)

    if(!s){

      request.get(host, (err, result) => {
        if(err) return res.send(err)

        username = JSON.parse(result.body).user.name
        let avatar = JSON.parse(result.body).user.profile['image_original']
        console.log(username)
        Schedule.create({speaker: username, date: date, title: title, avatar: avatar},(err,schedule) => {
          if(err) return res.send(err)
          
          output = "Talk scheduled successfully! cya on "+date+"."
          
          res.setHeader('Content-Type', 'application/json');
          return res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
        })

      })//end of request

    }
    else{
        output = "The date "+date+" is already reserved for another talk.\nCheck the list of scheduled talks and change the date again, or cancel."
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }

  })

}////// END IF


// Intent : reservedDates

else if( req.body.result.metadata['intentName'] == "reservedDates"){

  Schedule.find().exec( (err,schedules) => {
    if(err) res.send(err)

      // Sorting with dates
    schedules.sort(function(a, b) {
      a = new Date(a.date);
      b = new Date(b.date);
      return a>b ? 1 : a<b ? -1 : 0;
    });  

    let slack_message = { 
      "attachments": []
    } 

    // if there is no schedules
    if(schedules.length == 0){

      slack_message.attachments.push({
        "text": "No schedules found."
      })

    }else{

      for(s of schedules){
        slack_message.attachments.push({
                "title": "Title : "+s.title,
                "fields": [
                  {
                      "title": "Date",
                      "value": s.date,
                      "short": true
                  },
                  {
                      "title": "Speaker",
                      "value": s.speaker,
                      "short": true
                  }
              ],
                "thumb_url": s.avatar,
                "color": "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);})
        })
      }  
    }
    


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'data': {"slack": slack_message }  }));
  })
}//////////  END IF





// Intent : reservedDate, reservedDate-context

else if( (req.body.result.metadata['intentName'] == "reservedDate") || (req.body.result.metadata['intentName'] == "reservedDate-context")){

  let date =""

  if(req.body.result.parameters['date']){
    date = req.body.result.parameters['date'];
    date = moment(date).format("ddd MMM Do YYYY")
  }
  else{
    let week = req.body.result.parameters['date-period']
    week = week.substring(0,10)
    date = moment(week).day(5).format("ddd MMM Do YYYY") 
  }

  Schedule.findOne({date: date}, (err, s) => {

    if(err) res.send(err)

    if(!s) output += "The date *"+date+"* has *no talks* scheduled."
    else output += "On *"+date+"*, we will have <@"+s.speaker+"> talk about *"+s.title+"* !"

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': output, 'displayText': output  }));
  })

}//////// END IF









//  Intents : notifications

else if( req.body.result.metadata['intentName'] == "notifications" ){

  job.start()

  output = "you got it! Let me know if you want to stop the notification anytime."
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ 'speech': output, 'displayText': output }));


}




// Intents : notifications-cancel

else if( req.body.result.metadata['intentName'] == "notifications-cancel" ){

  job.stop()

  output = "Alright, let me know if you need to turn the notifications on again."
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ 'speech': output, 'displayText': output }));

}










});




