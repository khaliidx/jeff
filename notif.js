
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise')
var http = require('http');
var mongoose = require("mongoose");
const moment = require("moment")
const Schedule = require('./models/schedule')

mongoose.Promise = global.Promise;/////////////////// plug bluebird for better performance?

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));







module.exports = () => {


  let text = ""
  let d = moment()

// FOR TUESDAY (CHECKING NEXT FRIDAY)
  if(d.day() == 2){

    let date = moment().day(12).format("ddd MMM Do YYYY") // 12 means next friday

    Schedule.findOne({ date: date }, (err,schedule) => {
      if(err) console.log(err)

      if(!schedule) text = "*Reminder*: there is no talk scheduled for next friday.\n If no one schedules a talk today someone will get picked randomly"

      // else text = "*Reminder*: Don't forget to join us in the kitchen this friday as <@"+schedule.speaker+"> will be talking about "+schedule.title
    
      let data = {
        "text": text,
        "username": "Jeff",
        //"channel": "@ahai"
      }
      data = JSON.stringify(data)

      const options = {
        method: 'POST',
        uri : 'https://hooks.slack.com/services/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',
        body: data
      }

      request(options)  


    })
  }/////// END IF




// FOR FRIDAY
  if(d.day() == 4){ // should be 5 for friday
    d = moment().day(5).format("ddd MMM Do YYYY") // actually moment(d) but i forced friday for testing ofc

    Schedule.findOne({ date: d }, (err,schedule) => {
      if(err) console.log(err)

      if(!schedule) text = "*Notification*: there is no talk scheduled for this friday :("

      else text = "*Reminder*: Don't forget to join us today in the kitchen as <@"+schedule.speaker+"> will be talking about "+schedule.title
    
      let data = {
        "text": text,
        "username": "Jeff",
        //"channel": "@ahai or whatever channel i want"
      }
      data = JSON.stringify(data)

      const options = {
        method: 'POST',
        uri : 'https://hooks.slack.com/services/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',
        body: data
      }

      request(options)  

    })
  }

}




