var mongoose = require("mongoose");

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
			type: String,
			required: true
		},
});



//exporting model
module.exports = mongoose.model("schedule", scheduleSchema);