
var mongoose = require("mongoose");
const schedule = require("./schedule")

var userSchema = mongoose.Schema({

		
		username: {
			type: String,
			unique: true,
			required: true
		},
		avatar: {
			type: String,
			required: true
		},
		nbrOfTalks: {
			type: Number,
			required: true,
			default: 0
		},
});



//exporting model
module.exports = mongoose.model("user", userSchema);