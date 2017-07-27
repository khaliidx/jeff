var mongoose = require("mongoose");

var scheduleSchema = mongoose.Schema({

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



//exporting model
module.exports = mongoose.model("schedule", scheduleSchema);