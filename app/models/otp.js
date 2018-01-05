var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;

	var otpSchema = new Schema({
			mobileNo: {
				type: String,
				required: true
			},
			otp:{
				type:String,
				required:true
			}},
		{
			timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
			},
			id: false,
			toJSON: {
				getters: true,
				virtuals: true
			},
			toObject: {
				getters: true,
				virtuals: true
			}
		});

		module.exports = mongoose.model('Otp', otpSchema)
