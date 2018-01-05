var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;
require('./message');
const Chat = mongoose.model("Chat");

var inviteeSchema = new Schema({
	user_id: {
			type:mongoose.Schema.Types.ObjectId,
			ref:'User',
			required:true
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



var groupSchema = new Schema({
		picture: {
			type: String,
			required: false
		},
		name:{
			type: String,
			required: true,
			// set: function(str) {
		 // 				return str.replace(/\w\S*/g, (txt)=>{return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
			// 	}
		},
		lastCheckin: { 
			type: Schema.Types.Mixed, 
			// default: null 
		},
		currentMove: { 
			type: Schema.Types.Mixed, 
			// default: null 
		},
		insensitiveName: {
			type: String,
			required: true
		},
		leader:{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		},
		coleader:[{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		}],
		moves:[{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		}],
		currentMove:{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		},
		canInvite:{
			type:Boolean,
			default:true
		},
		isBusiness:{
			type:Boolean,
			default:false
		},
		invitee:[inviteeSchema],
		canMove:{
			type:Boolean,
			default:true
		},
		moveCount:{
			type:Number,
			default:0
		},


	},
	{
		// minimize: false ,
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


	groupSchema.pre("validate", function(next, cb) {
				var self = this;
				self.insensitiveName = self.name.toLowerCase()
				next();
	});
	
	
	 groupSchema
		.virtual('group_id')
		.get(function() {
			return this._id
	 });



	groupSchema
	 .path('picture')
	 .get(function(val) {
		 return val ? IMAGE_BASE + 'users/' + val : ""
	 });



module.exports =  Chat.discriminator('Group',groupSchema );
module.exports = mongoose.model('Invitee', inviteeSchema)
