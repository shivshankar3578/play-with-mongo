var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;
var groupSchema = new Schema({
		image: {
			type: String,
			required: true
		},
		name:{
			type:String,
			required:true
		},
		canInvite:{
			type:Boolean,
			default:true
		},
		canMove:{
			type:Boolean,
			default:true
		},
		invitees:[{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		}],
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
