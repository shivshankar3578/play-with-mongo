var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;
	var User = require('./user');
	require('./group');
	const Invitee = mongoose.model("Invitee");
	const Group = mongoose.model("Group");

	var menuImageSchema = new Schema({	
		caption: {
			type: String,
			default: ''
		},
		filename: {
			type: String,
			required: true
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

	menuImageSchema
		.virtual('file_url')
		.get(function() {
			return this.filename ? IMAGE_BASE + 'menuImages/' + this.filename : ""
		});


	var businessImageSchema = new Schema({
		filename: {
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
		}
	});

	businessImageSchema
		.virtual('file_url')
		.get(function() {
			return this.filename ? IMAGE_BASE + 'businessImages/' + this.filename : ""
	});

	var businessSchema= new Schema({
		scene: {
			type: Array,
			default: []
		},
		info: {
			type: String,
			default: ""
		},
		charges: {
			type: String,
			default: ""
		},
		dressCode: {
			type: String,
			default: ""
		},
		occupancy: {
			type: Number,
			default: 0
		},
		menuImages:{
			type: [menuImageSchema],
			defaultValue: []
		},
		businessImages:{
			type:[businessImageSchema],
			default:[]
		},
		businessGroup: { type:mongoose.Schema.Types.ObjectId, ref:"Group" },
		contact: {
			type: String,
			default: ""
		},
		coverPicture: {
			type: String,
			required: false,
			default:"default.png"
		},
		attendee: [{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
		moves: [{
			type:mongoose.Schema.Types.ObjectId,
			ref:'User'
		}],
		attended	: {
			type: Number,
			default:0
		},
		waitingTime: {
			//in minute
			default:0,
			type: Number,
		},
		// status: {
		// 	type:String,
		// 	default: ""
		// },
		//spec. in case in mongoDB [longitude, latitude]
		geoLocation: {
			type: [Number, Number],
				default:[0,0],
			 	required: true
		},
		about: {
			type: String,
			default: ""
		},
		location: {
			type: String,
			default: ""
		},
		open: {
			type: String,
			default: ""
		}
	});


	businessSchema.post("save",function(user, cb) {
		console.log("post save hook called");
		var self = this;
		var group = new Group({
			name       : self.name,
			picture    : self.picture.slice(self.picture.lastIndexOf('/')+1, self.picture.length),
			isBusiness : true,
			canMove    : true,
			canInvite  : true,
			leader     : user._id,
			coleader   : user._id,
			invitee    : new Invitee({user_id: user._id})
		})
		group.save((err, results)=>{
			if(err)	return cb(err);
			return cb();
		});
	});



businessSchema
	.path('coverPicture')
	.get(function(val) {
		return val ? IMAGE_BASE + 'users/' + val : ""
	});


		
module.exports =  User.discriminator('Business',businessSchema );
module.exports =  mongoose.model('BusinessImage', businessImageSchema);
module.exports =  mongoose.model('MenuImage', menuImageSchema);
