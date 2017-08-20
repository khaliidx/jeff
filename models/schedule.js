var mongoose = require("mongoose");
const moment = require("moment")


var scheduleSchema = mongoose.Schema({

		avatar: {
			type: String
		},
		speaker: {
			type: String,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		date: {
			type: Date,
			required: true
		},
});



scheduleSchema.methods.dateForm = function dateForm(){
	return moment(this.date).format("ddd MMM Do YYYY")
}




//exporting model
module.exports = mongoose.model("schedule", scheduleSchema);