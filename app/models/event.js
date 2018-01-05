var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
 	var eventSchema = new Schema({
 		title: {
 			type: String,
 			required: true
 		},
 		description: {
 			type: String,
 			required: true
 		},
 		start: {
 			type: Date,
 			required: true
 		},
		status:{
			type: String,
			default:""
		},
 		end: {
 			type: Date,
 			required: true
 		},
		business: {type: mongoose.Schema.Types.ObjectId, ref:"User"},
 		attendee: [{type:mongoose.Schema.Types.ObjectId, ref:"User"}],
		attended	: {
 			type: String,
			default:0,
 			required: false
		},
		waitingTime: {
 			type: String,
			default: "0",
 			required: false
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
 		}}
 	);

	eventSchema
	 .path('start')
	 .get(function(val) {
		 return val ? moment(val).format("DD MMM  YYYY, hh:mm A") : ""
	 });

	 eventSchema
	  .path('end')
	  .get(function(val) {
	 	 return val ? moment(val).format("DD MMM  YYYY, hh:mm A") : ""
	  });



	eventSchema
		.virtual('count')
		.get(function() {
			return this.attendee ? this.attendee.length : 0
		});

	module.exports = mongoose.model('Event', eventSchema)
