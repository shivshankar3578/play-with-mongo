var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;

	var activitySchema = new Schema({
			activityType: {
				type: String,
				required: true
			},
			activityBy:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			activityOn:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			business_id:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			group_id:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"Group"
			},
			status:{
				type: Boolean,
				default:false
			},
			hide:{
				type: Boolean,
				default:false
			}
		},
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

	module.exports = mongoose.model('Activity', activitySchema)
