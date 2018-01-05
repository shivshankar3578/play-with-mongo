var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;

	var commentSchema = new Schema({
		comment: {
			type: String,
			default: ''
		},
		likes:[{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		}],
		commentBy: {
			type: String,
			required: true
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
		}}
	);


	commentSchema
	 	.virtual('isLiked')
	 	.get(function() {
	 		return 0
	 });
	 	 	 	
 	commentSchema
 	 	.virtual('likesCount')
 	 	.get(function() {
 	 		return this.likes? this.likes.length: 0
 	 });



	var statusSchema = new Schema({
		// can store only checkin business name as status
			status: {
				type: String,
				required: true
			},
			statusType: {
				type: String,
				required: true,
				// default: "Checkin"
			},
			user:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			business:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},

			likes:[{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			}],
			comments:[commentSchema]
		},
		{
			discriminatorKey: 'statusType',
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

	statusSchema
	 	.virtual('checkinCommentCount')
	 	.get(function() {
	 		return this.comments?this.comments.length:0
	 });

 	statusSchema
 	 	.virtual('isLiked')
 	 	.get(function() {
 	 		return 0
 	 });

	statusSchema
	 	.virtual('checkinLikeCount')
	 	.get(function() {
	 		return this.likes?this.likes.length:0
	 });


 	var checkinSchema= new Schema({
 		//spec. in case in mongoDB [longitude, latitude]
 		geoLocation: {
 			type: [Number, Number],
 			default:[0,0]
 		},
 	})


 	const Move = mongoose.model('Status', statusSchema)
	module.exports = Move
	module.exports = mongoose.model('Comment', commentSchema)
	module.exports = Move.discriminator('Checkin',checkinSchema );