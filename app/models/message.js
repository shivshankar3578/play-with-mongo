var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;

	var messageSchema = new Schema({
		sender: {
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		},
		receiver: {
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		},
		message: {
			type: String,
			required: true
		},
		likes: [{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		}],
		seen: {
			type: Number,
			default: 0
		},
		skip: {
			type:mongoose.Schema.Types.ObjectId,
			ref:'User',
			default:null
		},
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


	messageSchema
		.virtual('isLiked')
		.get(function() {
			return 0
	 });


	var chatSchema = new Schema({
		// can store only checkin business name as status
			chatType: {
				type: String,
				default: "One2one"
			},
			unseenCount:{
				type: Number,
				default: 0
			},
			lastSeenBy:{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			},
			participant:[{
				type:mongoose.Schema.Types.ObjectId,
				ref:"User"
			}],
			lastMessage:messageSchema,
			messages:[messageSchema]
		},
		{
			timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
			},
			id: false,
			discriminatorKey: 'chatType',
			toJSON: {
				getters: true,
				virtuals: true
			},
			toObject: {
				getters: true,
				virtuals: true
			}
		});


	 messageSchema
		.path('sender')
		.get(function(sender) {
			if(typeof sender == 'object')
				sender.user_id = sender._id
		return sender
	 });

	messageSchema.pre('init', function (fn, doc) {
		if(doc.likes)
			userSchema
				.virtual('isLiked')
				.get(function() {
					return this.likes.length ? 1 : 0
			});

		fn()
	})
	
	 // messageSchema
		// .virtual('likesCount')
		// .get(function() {
		// 	return this.likes?this.likes.length:0
	 // });
	 
	 
	module.exports = mongoose.model('Chat', chatSchema)
	module.exports = mongoose.model('Message', messageSchema)
