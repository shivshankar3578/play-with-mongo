var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var validate = require('mongoose-validator');


	var emailValidator = [
		validate({
			validator: 'isLength',
			arguments: [3, 50],
			message: 'Email should be between {ARGS[0]} and {ARGS[1]} characters'
		}),
		validate({
			validator: 'isEmail',
			passIfEmpty: true,
			message: 'Please provide a valid email address.'
		})
	];



	var userSchema = new Schema({
			name: {
				type: String,
				required: true,
				message: 'Name is required',
				// set:  function(str) {
			// 			return str.replace(/\w\S*/g, (txt)=>{return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
				// }
			},
			birthdate: {
				type: String,
				// required: true,
				message: 'birthdate is required'
			},
			insensitiveName: {
				type: String,
				required: true
			},
			isProfileDone: {
				type: Boolean,
				default: false
			},
			userType: {
				type: String,
				default: "Customer"
			},
			description: {
				type: String,
				default:''
			},
			sourceType: {
				type: String,
				default: "email"
			},
			facebookId: {
				type: String,
				default: ""
			},
			username: {
				type: String,
				// required: true,
				message: 'username is required',
				// unique: true
			},
			gender: {
				type:String,
				default:"Not Specified"
			},
			isVerified: {
				type:Boolean,
				default:0
			},
			favourites: [{ type:mongoose.Schema.Types.ObjectId, ref:"User" }],
			mobileNo: {
				type: String,
				// required: true,
				message: 'mobileNo is required'
			},
			email: {
				type: String,
				required: true,
				validate:emailValidator,
				unique: true,
				message: 'Email is required'
			},
			password: {
				type: String
			},
			countryCode: {
				type: String,
				required: false
			},
			deviceToken: {
				type: String,
				required: false,
				default: ''
			},
			active: {
				type: Boolean,
				default: true
			},
			isArchive: {
						type: Boolean,
						default: false
			},
			picture: {
				type: String,
				required: false,
				default:"default.png"
			},
			// en and ar
			language: {
				type: String,
				default: "en"
			},
			osType: {
				type: String
			},
			// If this flag will be 0 user will not get any kind of push notification.
			isNotify: {
				type: Number,
				default: 1
			},
			// when user last time checked notification screen
			lastNotification:{
				type: Date,
				default: Date.now
			},
			counts: {
				type: Boolean,
				default: true
			},
			accounts: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			followers: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			likes: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			blockedUser: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			followings: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			currentMove: {
				type:mongoose.Schema.Types.Mixed,
				// default: null 
			},	
			lastCheckin: {
				type:mongoose.Schema.Types.Mixed,
				// default: null 
			},
			autoCheckOut: {
				type: Date
			},
	
			isPrivateAccount: {
				type: Boolean,
				default : false
			},
			requests: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			 friends: [{
				type:mongoose.Schema.Types.ObjectId,
				ref:'User'
			}],
			// because mongo 3.2 not allow addFields and no other good  method available to add new field 
			// isFollowed: {
			// 	type : Boolean,
			// 	default : false
			// },
			// isRequestSent:{
			// 	type :  Boolean,
			// 	default : false
			// },
			// isLiked:{
			// 	type :  Boolean,
			// 	default : false
			// },
			// totalRating: {
			// 		type: Number,
			// 		default: 0
			// },
			// ratingCount: {
			// 		type: Number,
			// 		default: 0
			// },
			resetPassword: {
			type: String
		}
	}, 
	{
		timestamps: {
			createdAt: 'created',
			updatedAt: 'updated'
		},
	 discriminatorKey: 'userType',
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


	userSchema.index({
		"geoLocation": '2dsphere'
	});


	userSchema.pre('update', function(next) {
		console.log("update hook called");
		var user = this;
		if(!user.password) return next();
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
			if(err) return next(err);
			// hash the password using our new salt
			bcrypt.hash(user.password, salt,null, (err, hash)=>{
				if(err) return next(err);
				// override the cleartext password with the hashed one
				user.password = hash;
				next();
			});
		});

	});


	// userSchema.pre("save", function(next, cb) {
	// 		var self = this;
	// 		self.insensitiveName = self.name.toLowerCase()
	// 		next();
	// });



	// userSchema.pre("save",function(next, cb) {
	// 		var self = this;
	// 		mongoose.models["User"].findOne({username : self.username},(err, results)=>{
	// 				if(err) {
	// 						cb(err);
	// 				} else if(results) { //there was a result found, so the email address exists
	// 						self.invalidate("username","username must be unique");
	// 						cb(new Error("username must be unique"));
	// 				} else {
	// 						cb();
	// 				}
	// 		});
	// 		next();
	// });


	//http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
	userSchema.pre('save', function(next) {
		console.log("pre save hook called");
		var user = this;
		// only hash the password if it has been modified (or is new)
		if(!user.isModified('password'))
			return next(new Error("New password cann't same to old "));
		// generate a salt
		console.log("here");
		bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
			if(err) return next(err);
			// hash the password using our new salt
			bcrypt.hash(user.password, salt, (err, hash)=>{
				if(err) return next(err);
				// override the cleartext password with the hashed one
				user.password = hash;
				next();
			});
		});
	});




		//	add a instance to model
	userSchema.methods.encryptPassword = function(cb) {
		var _this = this
		bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
			if(err) return cb(err);
			// hash the password using our new salt
			bcrypt.hash(_this.password, salt, (err, hash)=>{
				 cb(err, hash);
			});
		});
	}

	userSchema.methods.comparePassword = function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
				return	cb(err, isMatch);
		});
	};

		//	called as a class method Model.sidAuthentication
	userSchema.statics.sidAuthentication = function(sid, cb) {
		console.log("sidAuthentication called");
		var _this = this;
		var user_id = ''
		try {
			user_id = FX.crypto(sid.toString(), 'decrypt');
		} catch (e) {
			return cb(new Error('Wrong sid'));
		}
		if(!user_id) return cb(new Error('Wrong sid'));

		_this.findById(user_id, (err, user)=>{
			console.log(err);
		if(err) return cb(new Error(DM.error_finding_user));
		if(!user) return cb(new Error(DM.account_not_exist));
		return cb(null, user)
		});
	}

	userSchema.statics.getAdminAuthenticated = function(username, password, cb) {
		 var _this = this;
		 console.log('email', username)
		 this.findOne({
				 email: username,
				 superadmin: true
		 }, (err, user)=>{
			//  console.log(err, user);
				 if(err) return cb(err);
				 if(!user) return cb(null, null, DM.incorrect_email_password);
				 // test for a matching password
				 user.comparePassword(password, function(err, isMatch) {
						 if(err)  return cb(err);
						 if(isMatch)  return cb(null, user);
						 return cb(null, null, DM.incorrect_email_password);
				 });
		 });
	};


	userSchema.statics.getAuthenticated = function(postData, cb) {
		console.log("getAuthenticated called");
		var _this = this;
		// username = new RegExp(username, "i")
		this.findOne({
			email: postData.email,
			// // isArchive:false
		}, (err, userData)=>{
			if(err) return cb(err);
			if(!userData) return cb(new Error(DM.user_not_found));
			if(userData.isArchive) return cb(new Error("Account associated with this email is removed. Please use a different email or contact to OOTT admin"));
			if(userData.facebookId) return cb(new Error("Email registered with facebook, Please login via facebook"));
			// test for a matching password
			userData.comparePassword(postData.password, function(err, isMatch) {
				console.log(err);
				if(err) return cb(err);
				// check if the password was a match
				if(!isMatch) return cb(new Error(DM.incorrect_email_password))
				return cb(null,null, userData)
			});
		});
	};


	// lat, lng store in form of [longitude, latitude] for 2dsphere index
	// userSchema.virtual('longitude').get(function() {
	// 	if(this.location  && this.location.length ) return this.location[0];
	// 	else	return 0;
	// });


	 // userSchema.path('firstName').validate(function(value) {
	 // var nameRegex = /^(?:[A-Za-z]+)(?:[A-Za-z0-9 _]*)$/;
	 // return nameRegex.test(value);
	 // }, 'First Name should contain alpha-numeric characters only.');
	 // businessImageSchema
	 // 	.path('filename')
	 // 	.get(function(val) {
	 // 		return val ? IMAGE_BASE + 'businessImages/' + val : ""
	 // 	});



	userSchema.post('init', function (doc) {
		if(doc.isArchive){ 
			doc.name = "OOTT User"
			doc.username = "OOTT User"
			doc.picture =  "user.png";
		}
		// console.log(`doc`, doc);
		//	dynamically add virtuals
		if(doc.followers)
			userSchema
				.virtual('isFollowed')
				.get(function() {
					if(this.followers)
						return  this.followers.length ? 1 : 0
					else 
						return 0;
			});


		if(doc.requests)
			userSchema
				.virtual('isRequested')
				.get(function() {
					if(this.requests)
						return  this.requests.length ? 1: 0
					else
						return 0;
			});
	});



	 userSchema
		.path('picture')
		.get(function(val) {
			return val ? IMAGE_BASE + 'users/' + val : ""
		});

	//  userSchema
 // 		.path('counts')
 // 		.get(function(val) {
 // 			return {
	// 			likesCount: this.likes?this.likes.length:0,
	// 			movesCount: this.moves?this.moves.length:0,
	// 			followersCount: this.followers?this.followers.length:0,
	// 			followingsCount: this.followings?this.followings.length:0
	// 		}
 // 		});

	 userSchema
		.virtual('user_id')
		.get(function() {
			return this._id
	 });



	 // userSchema
		// .virtual('insensitiveName')
		// .get(function() {
		// 	return this.name.toLowerCase()
	 // });



 module.exports =	mongoose.model('User', userSchema)
