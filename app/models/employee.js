var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;
	var User = require('./user');

	var employeeSchema = 	new Schema({
			employeeRole: {
				type: String,
				default: 'Bouncer'
			},
			owner: {
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}
		})

	var Employee = User.discriminator('Employee',employeeSchema	)
	module.exports = Employee
