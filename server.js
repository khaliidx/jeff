
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const request = require('request-promise')
var mongoose = require("mongoose");
const moment = require("moment")
//const private = require("./private")
const Schedule = require('./models/schedule')
const User= require("./models/user")
const CronJob = require('cron').CronJob;
const ontime = require("ontime")
const _ = require("underscore")

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



//  CRON JOB EVERY TUESDAY AND FRIDAY
const job = new CronJob('00 36 09 * * 2,3,5', function() {
    notify()
  }, function () {},
  false /* Don't Start the job right now */
);




app.post('/webhook', (req, res) => {


    let output = ""
    let username= ""
    let user = req.body.originalRequest.data.event['user']
    let token = "xoxb-218970247330-inG9RMvQhjzITgUEV9ZU9vGf"//private.token
    let host = "https://slack.com/api/users.info?token="+token+"&user="+user



//////////////////////////////////////////////////////////////////////////////////////////
// if(user != "U665532RZ"){
//   output = "I'm just here so I won't get fined."
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
// }
//////////////////////////////////////////////////////////////////////////////////////////






// Intents : ScheduleTalk, ScheduleTalk-change

if( (req.body.result.metadata['intentName'] == "scheduleTalk-yes") || (req.body.result.metadata['intentName'] == "scheduleTalk-change") ){

  console.log(req.body.result.metadata['intentName'])


  var title = req.body.result.parameters['title'];
  console.log("title: "+title)
  
  let date = req.body.result.parameters['date'];
  date = moment(date).format()
  console.log('Date: ' + date);

  let now = moment().format()

  Schedule.findOne({date: date}, (err,s)=>{
    if(err) return res.send(err)

    console.log(date +" and "+now)
    if( moment(now).isAfter(date, 'day') ){
        output = "You can't schedule in the past (*"+moment(date).format('ddd MMM Do YYYY')+"*). Try again with a valid date."
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
        return;
    }

    if(!s){

      request.get(host).then( result => {

        username = JSON.parse(result).user.name
        let avatar = JSON.parse(result).user.profile['image_original']

///////////////////////////////////////////////////////////////////////////////
         User.findOne({username: username}).then( u => {
             
             if(!u) User.create({username: username, avatar: avatar, nbrOfTalks: 1}).then( (newUser) => {
                console.log("user created!")
              }).catch( (err) => { return res.send(err)})
             else User.update({username: username},{nbrOfTalks: u.nbrOfTalks+1}).then( (updatedUser) => {
                console.log("user updated!")
              }).catch( (err) => { return res.send(err)})
         })
         .catch( (err) => { return res.send(err)})
/////////////////////////////////////////////////////////////////////////////////

        Schedule.create({speaker: username, date: date, title: title, avatar: avatar},(err,schedule) => {
          if(err) return res.send(err)
          
          output = "Talk scheduled successfully! cya on "+schedule.dateForm()+"."
          
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
        })

      }).catch( (err) => { return res.send(err)})//end of request

    }
    else{
        output = "The date "+moment(date).format('ddd MMM Do YYYY')+" is already reserved for another talk.\nCheck the list of scheduled talks and change the date again, or cancel."
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }

  })

}////// END IF








// EDIT INTENT

else if( req.body.result.metadata['intentName'] == "editSchedule-yes" ){


  let oldTitle = req.body.result.parameters['title'],
   newTitle = req.body.result.parameters['newTitle'],
   newDate = req.body.result.parameters['newDate']
   newDate = moment(newDate).format()

  if( moment().format() >= newDate){
      output = "You can't schedule in the past (*"+moment(newDate).format('ddd MMM Do YYYY')+"*). Try again with a valid date."
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
      return;
  }


  Schedule.findOne({date: newDate}).then( (schedule) => {

    if(schedule){
      output = "The date *"+moment(newDate).format('ddd MMM Do YYYY')+"* already reserved. Try again with a valid date."
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
      return;
    }
    else{

      request.get(host).then( result => {

         user = JSON.parse(result).user.name

    // CAN JUST USE findOneAndUpdate
         Schedule.findOne({title: oldTitle, speaker: user}).then( (s) => {

            if(!s){
                output = "You don't have any talk scheduled with the title *"+oldTitle+"*, or the talk is not yours."
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
            
            }
            else{

              Schedule.update({title: oldTitle, speaker: user}, {title: newTitle,date: newDate})
              .then( () => {
                output = "talk updated!"
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
              }).catch( (err) => { return res.send(err)})
            }


         }).catch( (err) => { return res.send(err)})
      }) 
    }

  }).catch( (err) => { return res.send(err)})

}// END IF












// Delete Intent

else if( req.body.result.metadata['intentName'] == "deleteSchedule-yes" ){


  let title = req.body.result.parameters['title']
  let user = req.body.originalRequest.data.event['user']


  request.get(host).then( result => {

    user = JSON.parse(result).user.name



  Schedule.findOne({title: title, speaker: user}).then( (s) =>{

    if(!s){
      output = "You don't have any talk scheduled with the title *"+title+"*, or the talk is not yours."
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    } 

    if(s){
          Schedule.remove({title: title,speaker: user})
          .then( () => {
            output = "Tech talk canceled!"
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
          })
          .catch( (err) => { return res.send(err)})      
    }
  }) 
})
}// END IF




// Intent : reservedDates

else if( req.body.result.metadata['intentName'] == "reservedDates"){

  Schedule.find().exec( (err,schedules) => {
    if(err) res.send(err)

      if(req.body.result.parameters['date-period']){
        let period = req.body.result.parameters['date-period']
        p1 = period.substring(0,10)
        p2 = period.substring(11,21)

        let d1 = moment(p1).format()
        let d2 = moment(p2).format()

        schedules = _.reject(schedules, (s)=>{ 
          let sd = moment(s.date).format()
          return ( sd > d2 || sd < d1) // 
        })

      }
      else{ // filter expired dates
        schedules = _.reject(schedules, (s)=>{
          let d = moment(s.date).format()
          let now = moment().format()
          return (now > d)
        })
      }

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
                      "value": s.dateForm(),
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
    date = moment(date).format()
  }
  else if(req.body.result.parameters['date-period']){
    let week = req.body.result.parameters['date-period']
    date = week.substring(0,10)
    date = moment(date).day(5).format()
  }
  else{
    date = moment().day(5).format("YYYY-MM-DD")
    date = moment(date).format()
  }



  Schedule.findOne({date: date}, (err, s) => {
    if(err) res.send(err)

    let slack_message = { 
      "attachments": []
    } 

    if(!s) slack_message.attachments.push({ "text": "No schedules found for "+moment(date).format("ddd MMM Do YYYY")+"." })
      //output += 'The date *'+moment(date).format("ddd MMM Do YYYY")+'* has *no talks* scheduled.'
  
    else {//output += "On *"+date+"*, we will have <@"+s.speaker+"> talk about *"+s.title+"* !"
  
      slack_message = { 
      "attachments": [
      {
                "title": "Title : "+s.title,
                "fields": [
                  {
                      "title": "Date",
                      "value": s.dateForm(),
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
        }]
    }
  }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'data': {"slack": slack_message }  }));
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

} // END IF







// topSpeakers Intent

else if( req.body.result.metadata['intentName'] == "topSpeakers" ){
  
  let slack_message = { 
      "attachments": [{
        "title": "Top Speakers of all Time :", // top speakers of the month
      }]
  }
let stars = [":star::star2::star:", ":star::star:",":star:"]
let colors = ["good","warning","danger"]
let i= 0

  User.find().sort('-nbrOfTalks').limit(3).exec()
  .then( (users) => {
    for(u of users){
      slack_message.attachments.push({
                  "thumb_url": u.avatar,
                  "color": colors[i],
                  "fields": [
                    {
                        "title": "Score",
                        "value": u.nbrOfTalks +"                     "+stars[i],
                        "short": true 
                    },
                    {
                        "title": "Username",
                        "value": u.username,
                        "short": true
                    }
                ],
          })
      i++
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'data': {"slack": slack_message } }));


  }).catch( (err) => { return res.send(err)})

} // END IF






// details Intent
if( req.body.result.metadata['intentName'] == "details" ){

  output += "I am a chatbot that can help you :\n- *Schedule*, *Edit* or *Cancel* tech talks.\n- *Show* the available talks for a specific date or period of time.\n- *Notify* the team about the upcoming talks."

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ 'speech': output, 'displayText': output }));

} // END IF




});




