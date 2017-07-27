var mongoose = require("mongoose");

var weatherSchema = mongoose.Schema({

		city: { 
			type: String,
		},
		date: {
			type: Date,  //   TODO LATER
		},
});



//exporting model
module.exports = mongoose.model("weather", weatherSchema);