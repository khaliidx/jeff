
var mongoose = require("mongoose");

var userSchema = mongoose.Schema({

		
		username: {
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