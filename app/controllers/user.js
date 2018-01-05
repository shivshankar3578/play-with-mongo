var mongoose = require('mongoose');
const User = mongoose.model("User");
const Business = mongoose.model("Business");
const Otp = mongoose.model("Otp");
const BusinessImage = mongoose.model("BusinessImage");
const MenuImage = mongoose.model("MenuImage");
const Checkin = mongoose.model("Checkin");
const Event = mongoose.model("Event");
const Group = mongoose.model("Group");
const { users } = require('../../socket/shared');

var {UserInfo,BusinessInfo,EmployeeInfo,EventInfo} =require('../models/classes');

// exports.staticContent = function(req, res, next) {
// 	console.log(`staticContent called` );
// 	staticContent.findOne({slug:req.params.slug}, (err, data)=>{
// 		res.send(data.description)
// 	})
// }
// 

exports.sendOtp = function(req, res, next) {

	var postData = req.body;
	console.log("sendOtp called");
 // 	postData.otp = randomString.generate({
	// 	length: 6,
	// 	charset: 'numeric'
	// });
	FX.getUser(postData, (err, userData)=>{
		if(err) return  next(err);

		if(userData && userData.mobileNo == postData.mobileNo)
			return res.status(203).json({
				type: false,
				 message: DM.mobileNo_already_registered
			 });

		if(userData && userData.email == postData.email)
			return res.status(203).json({
				type: false,
				 message: DM.email_already_registered
			 });

		postData.otp =1234;
		otpModel = new Otp(postData);
		//resend otp delete or update ??
		otpModel.save(function(err, saved){
			if(err)  return next(err);

			return res.status(200).json({
				type: true,
				message: DM.otp_sent
			});

		})

	})
}


// User.findOne({ '$or': [ { mobileNo: '9785218725' }, {facebookId: '123456'} ],
// isArchive: false }, (err, userData)=>{
// 	console.log(userData);
// 	userData.update({$set: {deviceToken:"123"}}, (err, userData)=>{
// 		console.log(err, userData);
// 	})
// })


exports.checkUser = function(req, res, next) {

	var postData = req.body
	console.log("checkUser called", postData);
	var query = {username: postData.username }

	User.findOne(query, (err, userData)=>{

		if(err) return next(err);

		if(userData)
			return res.status(200).json({
				type: false,
				message: DM.username_already_registered
			 });

		return res.status(200).json({
			type: true,
			message: "username is available"
		 });

		})
}

function postAuth(userData, postData, cb){
	// console.log("postAuth called",postData);

	User.findOneAndUpdate(
		{
		 _id: userData._id
		},
		{
			$set: {
				deviceToken: postData.deviceToken,
				osType: postData.osType
			}
		},
		{
			multi: true,
		}, (err, done)=>{
			console.log(err, done);
			if(err) return cb(err, null);

			return cb(err, done)
		});
}


exports.socialLogin = function(req, res, next) {

	var postData = req.body
	console.log("socialLogin called", postData, req.files);

	sourceType = 'facebook';
	socialId = postData.socialId;
	postData.facebookId = socialId;

	FX.getUser(postData, (err, userData)=>{
		if(err) return  next(err);

			//if userData exists then social signup/login automatcally by socialRegister
		if(!userData)
			return res.status(200).json({
				type: false,
				message: "user not exists"
			 });

			// console.log(postData.socialId, userData.facebookId);
		if(userData.facebookId == postData.socialId)
			//social auth done postAuth for update deviceToken etc

			postAuth(userData, postData, (err, done)=>{
				if(err) return  next(err);

				userData = new UserInfo(userData);
				userData.sid  = FX.crypto(userData.user_id.toString(), 'encrypt').toString();

				return res.status(200).json({
					type: true,
					data:userData,
					 message: DM.login_successfully
				 });

			})
		//update user and logged in
		else {
			FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
				if(err) return next(err)

				if(filename) userData.picture = filename
				userData.facebookId = socialId;

				userData.save((err, userData)=>{
					if(err) return  next(err);

					postAuth(userData, postData, (err, done)=>{
						if(err) return  next(err);

						userData = new UserInfo(userData);
						userData.sid  = FX.crypto(userData.user_id.toString(), 'encrypt').toString();

						return res.status(200).json({
							type: true,
							data:userData,
							message: DM.login_successfully
						});

					})

				})

			})
		}
	})
}


exports.socialRegister = function(req, res, next) {

	// 	socialLogin is always called before socialRegister is email/MobileNo already exists then socialLogin add relative socialId
	var postData = req.body
	console.log("socialRegister called", postData);
	sourceType = 'facebook';
	socialId = postData.socialId;
	postData.facebookId = socialId;

	postData.isVerified = 1;
	FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
		if(filename) postData.picture = filename

		FX.getUser(postData, (err, userData)=>{
			if(err) return  next(err);

			// anything found then socialLogin handle
			if(userData)
				return exports.socialLogin(req,res);
			Otp.findOne({otp:postData.otp, mobileNo:postData.mobileNo}, function(err, otpData){
				if(err)  return  next(err);

				if(!otpData) return  next(err);
				postData.password = 'shiv'
				if(postData.userType == 'Business')
					userModel = new Business(postData);
				else
					userModel = new User(postData)

				userModel.save(function(err, saved) {
					if(err) return  next(err);

					userData = new UserInfo(saved);
					userData.sid  = FX.crypto(userData.user_id.toString(), 'encrypt').toString();

					return res.status(200).json({
						type: true,
						data:userData,
						 message: DM.registered_successfully
					 });

				})

			})
		})
	})
}


exports.createUser = function(req, res, next) {

	var postData = req.body
		postData.insensitiveName = postData.name.toLowerCase()
	console.log("createUser called", postData);
		FX.getUser(postData, (err, userData)=>{
			if(err) return  next(err);

			if(userData && userData.mobileNo == postData.mobileNo)
				return res.status(203).json({
					type: false,
					message: DM.mobileNo_already_registered
				});

			if(userData && userData.email == postData.email)
				return res.status(203).json({
					type: false,
					 message: DM.email_already_registered
				 });

		Otp.findOne({otp:postData.otp, mobileNo:postData.mobileNo}, function(err, otpData){
			if(err)  return  next(err);

			if(!otpData)
				return res.status(203).json({
					type: false,
					 message: DM.wrong_otp
				 });

			postData.isVerified = 1;
			FX.sendMail("customer_signup", 'Registration Successful', postData.email, postData, function(err, responseStatus) {
				// if(err) return next(err)
				console.log(err, responseStatus);

				FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
					if(err) return next(err)
					if(filename) postData.picture = filename
					if(postData.userType == 'Business')
						userModel = new Business(postData);
					else
						userModel = new User(postData)

					userModel.save(function(err, saved) {
						if(err) return  next(err);

						userData = new UserInfo(saved);
						userData.sid  = FX.crypto(userData.user_id.toString(), 'encrypt').toString();

						return res.status(200).json({
							type: true,
							data:userData,
							message: DM.registered_successfully
						});

					})

				})
			})
		})
	})
}


exports.viewUser = function(req, res, next) {

	var user_id = req.user._id;
	console.log("viewUser called", user_id, req.params.id);

	User.findById(req.params.id)
	.select({
		name:1, 
		username:1, 
		favourites:1, 
		picture:1, 
		description:1, 
		followings:1, 
		isPrivateAccount:1, 
		currentMove:1, 
		lastCheckin:1, 
		isArchive :1,
		followers:1,
		requests: {
			$elemMatch:{
				$eq: req.user._id
			} 
		},
	})	
	.exec((err, userData)=>{
		if(err)	return  next(err);
	console.log(userData);
		try{
			userData = userData.toObject();
		}catch(e){
			return next(e)
		}
	

		userData.favouriteCount = userData.favourites.length;

		// Checkin.aggregate([
		// 		{
		// 			$match: {
		// 				user:req.params.id
		// 			}
		// 		},
		// 		{
		// 			$lookup:{
		// 				from: 'users',
		// 				localField: '_id',
		// 				foreignField: 'business',
		// 				as: 'business'
		// 			}
		// 		},
		// 		{
		// 			$project: {
		// 				business: {
		// 					$arrayElemAt: [ '$business', 0 ]
		// 				}
		// 			 }
		// 		}
		// 	])
		Checkin.findOne({user:req.params.id}, 'business')
		.populate({
			path:"business",
			select:"name picture",
			model:"User",
			// options: {
				// sort:{name: 1},
				// skip: req.query.page? parseInt(LPP*req.query.page):0,
				// limit:1
			// },
		}).exec((err, checkins)=>{
			if(err) return next(err);

			if(!checkins || checkins.length)
				userData.checkins = []

			userData.isBlocked = false
			if(req.user.blockedUser.some(v=>{
				if(v== req.params.id) return true
			})) userData.isBlocked = true
			// checkins.unique
			userData.followingsCount = userData.followings.length
			userData.followersCount = userData.followers.length
			userData.isFollowed =
				req.user.followings.some((w)=>{
					if(w.toString() == req.params.id) return true
				})
				
			userData.checkins = checkins
			res.status(200).json({
				type: true,
				data:userData,
				message: DM.user_found
			})

		})

	})
}


exports.myProfile = function(req, res, next) {

	var user_id = req.user._id;
	console.log("myProfile called", user_id, req.params.id);
	User.findById(req.params.id, (err, userData)=>{
		if(err)	return  next(err);

		// !userData no a case bcz findById give error on invalid id
		userData = userData.toObject();
		//no need to cast user, Business, employee sepertly using Classes
		if(userData.followings.some(
			(x) =>{ return x==req.params.id; }
		))
			userData.isFollowed =1 ;
		else
			userData.isFollowed =0 ;

		return res.status(200).json({
			type: true,
			data:userData,
			message: DM.user_found
		})

	})
}

exports.editProfile = function(req, res, next) {

	var postData = req.body;
	
	console.log("editProfile called", postData);
	FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
		if(err) return next(err)

		if(filename) postData.picture = filename

		User.findByIdAndUpdate(req.user._id, {
				$set: postData
			}, {
				new: true
			}, (err, userData)=>{
			if(err)	return  next(err);


			socket = users[req.user._id]
			if(socket){
				socket.user = Object.assign(socket.user,userData )
			}

			userData = new UserInfo(userData)
			return res.status(200).json({
				type: true,
				data:userData,
				message: "profile updated"
			})

		})

	})
}


exports.deleteAccout = function(req, res, next) {

	console.log("deleteAccout called");
	User.findByIdAndUpdate(req.user._id,
		{
			$set: { isArchive: true}
		},
		{
			new: true
		}
		,(err, userData)=>{
		if(err)	return  next(err);

		return res.status(200).json({
			type: true,
			message: "Account not exists"
		})

	})
}


exports.addSubAccount = function(req, res, next) {

	var postData = req.body;
	console.log("addSubAccount called", req.params);

	// need to auth of secondry account
	User.getAuthenticated(postData, function(err, reason, userData) {
			if(err) return  next(err);

			User.findOneAndUpdate({
				_id: req.user._id
			}, {
				// use addToSet instead of pull to make uniue array.
				$addToSet: {
					accounts: userData._id
				}
			}, {
				upsert: false,
				new: true
			}, (err, userData)=>{
				if(err) return  next(err);

				return res.status(200).json({
					type: true,
					data:userData,
					message: DM.account_added
				})

			})

		})
}

exports.removeSubAccount = function(req, res, next) {

	var postData = req.body;
		console.log("addSubAccount called");
		// need to auth of secondry account
		User.getAuthenticated(postData, function(err, reason, userData) {
			if(err) return  next(err);

			User.findOneAndUpdate({
				_id: req.user._id
			}, {
				$pull: {
					accounts: userData._id
				}
			}, {
				upsert: false,
				new: true
			}, (err, userData)=>{
				if(err) return  next(err);

				return res.status(200).json({
					type: true,
					message: DM.account_removed
				})

			})

		})

}


exports.loginUser = function(req, res, next) {

	var postData = req.body;
		console.log("loginUser called", postData);
		User.getAuthenticated(postData, function(err,reason, userData) {
			if(err) return  next(err);

			postAuth(userData, postData, (err, done)=>{
				if(err) return  next(err);
				// console.log(userData);
				userData = new UserInfo(userData);
				userData.sid  = FX.crypto(userData.user_id.toString(), 'encrypt').toString();

				return res.status(200).json({
					type: true,
					data:userData,
					message:DM.login_successfully
				})

			})
		})
}



exports.forgotPassword = function(req, res, next) {

	var postData = req.body;
	console.log("forgotPassword called");
	FX.getUser(postData, (err, userData)=>{
		if(err) return  next(err);

		if(!userData)
			return res.status(203).json({
				type: false,
				message: DM.user_not_found
			});


		if(userData.isArchive)
			return res.status(203).json({
				type: false,
				message: "your Account is deleted"
			});

		if(userData.sourceType == 'facebook')
			return res.status(203).json({
				type: false,
				message: DM.email_registered_fb
			});

		var password = randomString.generate({
			length: 6,
			charset: 'alpha-numeric'
		});

		postData.password = password
		userData.password = password
		console.log(password);

		FX.sendMail("customer_change_password", 'Change Password', postData.email, postData, function(err, responseStatus) {
		console.log(err, responseStatus);
		if(err) return  next(err);

		userData.save((err, done)=>{
			if(err) return  next(err);

			return res.status(200).json({
				type: true,
				message: "Please check your Email"
			});

		})

		});
	});
}

exports.changePassword = function(req, res, next) {

	var postData = req.body;
	console.log("changePassword called");
	///getAuthenticated sure user/userData exists
	var userData = req.user;
		if(!userData.password)
			return res.status(203).json({
				type: false,
				message: DM.email_registered_fb
			});

		userData.comparePassword(postData.currentPassword, function(err, isMatch) {
			if(err) return  next(err);

			if(!isMatch)
				return res.status(200).json({
					type: true,
					message: DM.err_old_password_wrong
				});

			bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt)=>{
				if(err) return  next(err);

				bcrypt.hash(postData.newPassword, salt,(err, hash)=>{
					if(err) return  next(err);

					User.findOneAndUpdate({
						_id: userData._id
					}, {
						$set: {
							password: hash
						}
					}, {
						upsert: false
					}, (err, user)=>{
						if(err) return  next(err);

						return res.status(200).json({
							type: true,
							message: DM.password_changed
						});

					})
				});

		})
	})
}


exports.logoutUser = function(req, res, next) {


	var updateData = {
		device_token: ""	
	};
	var user_id = req.user._id;

	User.findOneAndUpdate(
		{
			_id: user_id
		},
		{
			$set: updateData
		},
		{
			upsert: false,
			new: true
		},
	(err, user)=>{
		if(err) return  next(err);

		return res.json({
			type: true,
			message: DM.logout_msg,
			data:[]
		})

	})

}


exports.createSubAccount = function(req, res, next) {


}
