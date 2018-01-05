var mongoose = require('mongoose');
const User = mongoose.model("User");
const Group = mongoose.model("Group");
const Activity = mongoose.model("Activity");
const Comment = mongoose.model("Comment");
const Checkin = mongoose.model("Checkin");
const Business = mongoose.model("Business");
const Move = mongoose.model("Status");
const Status = mongoose.model("Status");
var { UserInfo } = require('../models/classes');




logActivity = (req, res, next ) => {
	var activity = {
		activityBy:req.user._id,
		activityOn: req.params.id,
		activityType: req.activityType,
	};

	Activity.findOneAndUpdate(activity,
		{
			$set:{
				hide:req.hideActivity ? true : false
			}
		},
		{
			new:true,
			upsert:true
		}, (err,done)=>{
		 if(err) return next(err)
			console.log(done._id);
		 res.status(200).json({
				type: true,
				data:req.data ? req.data: done,
				message: "activity completed"
		})
	})
}



exports.closeMoveRequest = function(req, res, next) {
	var postData = req.body;
	console.log("move called", req.params);

	Activity.findByIdAndUpdate(req.params.id,
		{
			$set:{
				hide:true
			}
		},
		{
			new:true,
			upsert:false
		}, (err,done)=>{
		 if(err) return next(err)
			console.log(done._id);
		 res.status(200).json({
				type: true,
				message: "activity completed"
		})
	})
}



exports.move = function(req, res, next) {
	var postData = req.body;
	console.log("move called", req.params);


	Business.findByIdAndUpdate(req.params.id,
		{
			$addToSet: {
				moves: req.user._id
			}
		},
		{
			upsert: false,
			new: true
		},
	(err, userData)=>{
		if(err) return next(err);

		var move = new Move({
			status: userData.name,
			business: req.params.id,
			statusType : "Move",
			user: req.user._id 
		}) 
		move.save((err, done)=>{
			if(err) return next(err)

			console.log(`checkin added id = `, done._id);	

			User.findOneAndUpdate({
					_id:req.user._id
				},
				{
					$set:{
						currentMove: {
							business: req.params.id,
							status:  userData.name,
							_id: done._id
						},
					},
				},
				{
					new : true,
					upsert: false
				},
			(err, results)=>{
				if(err) return next(err)
				
				req.activityType = 'move'
				logActivity(req, res, next)
			})
		})
	})
}


//	 check a rule group also may have current checkin
//	 see doc to details of rules
function triggerStatus(group_id, business,user_id ) {
	console.log(`triggerStatus`);
	Group.findById(group_id, (err,results)=>{
		console.log(err);
		if(!results) return ;
		results.moveCount = results.moveCount+1
		// console.log(`#########`,results.invitee.length/2,results.moveCount+1 );
		if( results.moveCount+1 >=results.invitee.length/2  )
			// user same stature as same to user. lastCheckiin
			results['lastCheckin'] =  {
				// id:  null, 
				status: business.name, 
				business: business._id
			}
		// console.log(results);
		results.save((err, results)=>{
			console.log(err, results);
		})

	})

}


exports.acceptInvitation = function(req, res, next) {
	var postData = req.body;
	console.log("acceptInvitation called", req.params);

	var p1 =
		Business.findByIdAndUpdate(req.body.business_id,
			{
				$addToSet: {
					moves: req.user._id
				}
			},
			{
				upsert: false,
				new: true
			})

	var p2 =
		User.findOneAndUpdate({
				_id:req.user._id
			},
			{
				$set:{
					currentMove: req.body.business_id,
				},
			},
			{
				new : true,
				upsert: false
			})

	var p3 =
		Activity.update({
				business_id:req.body.business_id,
				activityOn:req.user._id,
				group_id:req.body.group_id
			},
			{
				$set:{
					hide: true,
				},
			},
			{
				new : true,
				multi:true,
				upsert: false
			})


	Promise.all([p1,p2,p3])
	.then(done=>{
		 triggerStatus(req.body.group_id, done[0] ,req.user._id);
		 res.status(200).json({
				type: true,
				message: "activity completed"
		})
	})
	.catch(err=>{
		return next(err)
	})

}



exports.declineFollowReq = function(req, res, next) {
	var postData = req.body;
	console.log("declineFollowReq called", req.params);


	Promise.all([
		User.findByIdAndUpdate(req.user._id,
			{
				$pull: {
					requests: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			}),

		Activity.findOneAndUpdate({
			"activityType" : "followReq",
			"activityOn" : req.user._id,
			"activityBy" : req.params.id
		},
			{
				$set:{
					hide:true
				}
			},
			{
				new:true,
				upsert:false
		})
	])
	.then(done=>{

		res.status(200).json({
			type: true,
			message: "activity completed"
		})

	})
	.catch(err=>{
		next(err)
	})

	
}

exports.acceptFollowReq = function(req, res, next) {
	var postData = req.body;
	console.log("followPrivate called", req.params);


	Promise.all([
		User.findByIdAndUpdate(req.user._id,{
				$pull: {
					requests: req.params.id
				},
				$addToSet: {
					followers: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			}),

		User.findByIdAndUpdate(req.params.id,{
				$addToSet: {
					followings: req.user._id
				}
			},
			{
				upsert: false,
				new: true
			}),
		Activity.findOneAndUpdate({
			"activityType" : "followReq",
			"activityOn" : req.user._id,
			"activityBy" : req.params.id
		},
			{
				$set:{
					hide:true
				}
			},
			{
				new:true,
				upsert:false
		})
	])
	.then(done=>{
			req.activityType = 'follow'
			var tmp = req.params.id
			req.params.id = req.user._id 
			req.user._id = tmp

			logActivity(req, res, next)

	})
	.catch(err=>{
		next(err)
	})

}



exports.follow = function(req, res, next) {
	var postData = req.body;
	console.log("follow called", req.params);

	Promise.all([
		User.findByIdAndUpdate(req.params.id,{
				$addToSet:  {
					followers: req.user._id
				}
			},
			{
				upsert: false,
				new: true
			}),

		User.findByIdAndUpdate(req.user._id,{
				$addToSet:  {
					followings: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			})
	])
	.then(done=>{
	
		req.activityType = 'follow'

		// User.findById(req.params.id, (err, user)=>{
		// 	if(err) return next(err)
			var msg = `${req.user.name} started following you`
			logActivity(req, res, next)
			FX.apnSend(req.toUser, msg,[req.toUser.deviceToken], {type:"activity"})
		// })

	})
	.catch(err=>{
		next(err)
	})

}

exports.followPrivate = function(req, res, next) {
	var postData = req.body;
	console.log("followPrivate called", req.params);


	User.findByIdAndUpdate(req.params.id,
		{
			$addToSet: {
				requests: req.user._id
			}
		},
		{
			upsert: false,
			new: true
		},
	(err, userData)=>{
		if(err) return next(err)

			req.activityType = 'followReq'
			var msg = `${req.user.name} wants tp follow you`
			// var tmp = req.params.id
			// req.params.id = req.user._id 
			// req.user._id = tmp
			logActivity(req, res, next)
			FX.apnSend(req.toUser, msg,[req.toUser.deviceToken], {type:"activity"})
	})

}

exports.unfollow = function(req, res, next) {
	var postData = req.body;
	console.log("unfollow called", req.params);

	Promise.all([
		User.findByIdAndUpdate(req.params.id,{
				$pull:  {
					followers: req.user._id
				}
			},
			{
				upsert: false,
				new: true
			}),

		User.findByIdAndUpdate(req.user._id,{
				$pull:  {
					followings: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			})
	])
	.then(done=>{

		req.hideActivity = true,
		req.activityType = 'follow'
			// var tmp = req.params.id
			// req.params.id = req.user._id 
			// req.user._id = tmp
		logActivity(req, res, next)

	})
	.catch(err=>{
		next(err)
	})

}


exports.checkinCommentLike= function(req, res, next) {
	console.log("checkinCommentLike called", req.params, req.query);
	Status.findOneAndUpdate({
			_id:req.params.id,
			"comments._id":req.params.comment_id
		},
		{
			$addToSet: {
				"comments.$.likes": req.user._id
			}
		},
		{
			upsert: true,
			new: true
		},
	(err, checkin)=>{
		if(err) return next(err);
		// console.log(checkin);
		res.status(200).json({
				type: true,
				message: "activity completed"
		})

	})

}


exports.checkinCommentUnlike= function(req, res, next) {
	console.log("checkinCommentUnlike called", req.params, req.query);
	Status.findOneAndUpdate({
			_id:req.params.id,
			"comments._id":req.params.comment_id
		},
		{
			$pull: {
				"comments.$.likes": req.user._id
			}
		},
		{
			upsert: true,
			new: true
		},
	(err, checkin)=>{
		if(err) return next(err);

			res.status(200).json({
				type: true,
				message: "activity completed"
		})

	})

}




exports.checkinLike= function(req, res, next) {
	console.log("checkinLike called", req.params, req.query);
	Status.findByIdAndUpdate(req.params.id,
		{
			$addToSet: {
				likes: req.user._id
			}
		},
		{
			upsert: true,
			new: true
		},
	(err, checkin)=>{
		if(err) return next(err);

		
		req.activityType = 'checkinLike'


		User.findById(checkin.user, (err, user)=>{
			if(err) return next(err)
			var msg = `${req.user.name} liked your status`
			console.log(" checkin.user.id", checkin.user.toString());
			/**
			 * @param {activityOn} req.params.id
			 * @param {activityBy} req.user._id
			 */
			req.params.id = checkin.user.toString()
			logActivity(req, res, next)
			FX.apnSend(user, msg,[user.deviceToken], {type:"activity"})
		})

	})

}



exports.checkinUnlike = function(req, res, next) {
	console.log("checkinUnlike called", req.params, req.query);

	Status.findByIdAndUpdate(req.params.id,
		{
			$pull: {
				likes: req.user._id
			}
		},
		{
			upsert: false,
			new: true
		},
	(err, checkin)=>{
		if(err) return next(err);

		res.status(200).json({
			type: true,
			message: "done",
		})

	})
}



exports.commentOnCheckin = function(req, res, next) {

	var postData = req.body;
	postData.commentBy = req.user._id;
	console.log("commentOnCheckin called", postData);

	var comment = new Comment(postData);

	Status.findByIdAndUpdate(req.params.id,
		{
			$push: {
				comments: comment
			}
		},
		{
			upsert: false,
			new: true
		}
	,(err, checkin) =>{
		if(err) return next(err);

		
		req.activityType = 'checkinComment'
		User.findById(checkin.user, (err, user)=>{
			if(err) return next(err)
			var msg = `${req.user.name} commented on your checkin`
			comment.created = new Date().getTime()
			req.data = comment.toObject()
			req.data.commentBy= {
				_id: req.user._id,
				picture: req.user.picture,
				name: req.user.name,
				userType: req.user.userType
			}
			//	req.params id should on user id see common function
			req.params.id = checkin.user.toString()
			
			req.activityType = 'checkinComment'
			logActivity(req, res, next)
			FX.apnSend(user, msg, [user.deviceToken], {type:"activity"})
		})

	})
}

exports.like = function(req, res, next) {
	var postData = req.body;
	console.log("like called", req.params);

	User.findByIdAndUpdate(req.params.id,
		{
			$addToSet: {
				likes: req.user._id
			}
		},
		{
			upsert: false,
			new: true
		}
	,(err, userData)=>{
		if(err) return next(err);
		User.findByIdAndUpdate(req.user._id,
			{
				$addToSet: {
					favourites: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			}
		,(err, userData)=>{
			if(err) return next(err);
			
			req.activityType = 'like'
			return logActivity(req, res, next)

		})
	})
}

exports.unlike = function(req, res, next) {
	var postData = req.body;
	console.log("unlike called", req.params);

	User.findByIdAndUpdate(req.params.id,
		{
			$pull: {
				likes: req.user._id
			}
		},
		{
			upsert: false,
			new: true
		},
	(err, userData)=>{
		if(err) return next(err);
		User.findByIdAndUpdate(req.user._id,
			{
				$pull: {
					favourites: req.params.id
				}
			},
			{
				upsert: false,
				new: true
			},
		(err, userData)=>{
			if(err) return next(err);
			req.hideActivity = true,
			req.activityType = 'like'
			return logActivity(req, res, next)

		})
	})
}

// var req = { params : { id: "5a1278dd6f254e707775f7cc"} , user: { _id:"5a03f9a0fafa645c8a39934c" }}
// User.aggregate([
// 	{
// 		$match:{
// 			_id: ObjectId(req.params.id)
// 		}
// 	},
// 	{
// 		$unwind:"$likes"
// 	},
// 	{
// 		$lookup:{
// 		 from: 'users',
// 		 localField: 'likes',
// 		 foreignField: '_id',
// 		 as: 'likes'
// 		}
// 	}, 

// 	{
// 		$group:{
// 			_id:"$_id",
// 			"likes.name":{ $first : "$likes.name" },
// 			// picture:{
// 			// 	$concat:[IMAGE_BASE, "users/",{ $first : "$picture" } ]
// 			// },
// 			// followings: "$followings" ,
// 			// isFollowed : {
// 			// 	$size: {
// 			// 		$filter: {
// 			// 			input: "$followings",
// 			// 			as: "x",
// 			// 			cond: { $eq : ["$$x",ObjectId(req.user._id) ] }
// 			// 		}
// 			// 	}
// 			// }
// 		},

// 	},
// 	{
// 		$project:{
// 			name: 1,
// 			likes:1
// 		}
// 	}
// ])
// .exec((err, results)=>{
// 		console.dir({
// 		err:err,
// 		results:JSON.stringify(results)
// 	});
// })

exports.businessLikes = function(req, res, next) {

	console.log("businessLikes called", req.params);

	User.findById(req.params.id, 'likes requests')
	.populate({
		path: 'likes',
		select: 'name picture requests isPrivateAccount currentMove lastCheckin isArchive',
		// populate:[{
		// 			path: 'lastCheckin.business',
		// 			select: 'name',
		// 			model:'Business'
		// 		},
		// 		{
		// 			path: 'currentMove.business',
		// 			select: 'name',
		// 			model:'Business'
		// 		}],
		match:{
			userType:"Customer",
			// isArchive:false
		}
	})
	// .skip(req.query.page? parseInt(LPP*req.query.page):0)
	// .limit(LPP)
	// .lean()
	.exec((err, user)=>{
		if(err) return next(err);
		try{
			user = user.toObject()
		}catch(e){
			return next(e)
		}
		if(!user.likes) user.likes = []
		console.log(user);

		user.likes.map((v)=>{
				// v.picture = `${IMAGE_BASE}users/${v.picture}` ,
				v.isFollowed = req.user.followings.some((w)=>{
					if(w.toString() == v._id.toString()) return true
				}) ? true : false

			 v.isRequested =
				v.requests.some((w)=>{
					if(w.toString() == req.user._id) return true
				})
		})

		return res.status(200).json({
			type: true,
			data:user,
			message: DM.list_found,
			limit:LPP
		})

	})
}


// User.aggregate([
// 	{
// 		$match:{
// 			_id:req.user._id
// 		}
// 	},
// 	{
// 		$unwind:"$followings"
// 	},
// 	{
// 		$lookup:{
// 		 from: 'groups',
// 		 localField: 'businessGroup',
// 		 foreignField: '_id',
// 		 as: 'groups'
// 		}
// 	},
// 	{
// 		$lookup:{
// 		 from: 'checkins',
// 		 localField: 'lastCheckin',
// 		 foreignField: '_id',
// 		 as: 'lastCheckin'
// 		}
// 	},
// 	{
// 		$project : {
// 			name:1,
// 			picture:{
// 				$concat:[IMAGE_BASE, "users/", "$picture"]
// 			},
// 			isInvited:{$literal:0},
// 			// lastCheckin: { $arrayElemAt:["$lastCheckin", 0] },
// 			lastCheckin: {
// 				$let: {
// 			 		vars: {
// 						lastCheckin:{ $arrayElemAt:["$lastCheckin", 0] },
// 			 		},
// 					in: {
// 						checkinCommentCount:{$size: "$$lastCheckin.comments"},
// 						checkinLikeCount:{$size: "$$lastCheckin.likes"},
// 						status:"$$lastCheckin.status",
// 						_id:"$$lastCheckin._id"
// 					}
// 				}
// 			}
// 		}
// 	}
// ]).exec((err, followings)=>{



exports.suggestiveFriends = function(req, res, next) {

	console.log("suggestiveFriends called",req.user.followings);
	User.aggregate([
		{
			$match:{
				$and: [
					{
						"_id": {
							$nin:req.user.followings
						}
					},
					{
						"_id": {
							$ne:req.user._id
						}
					},
					{
						"userType":"Customer",
							isArchive:false
					}
				]
			}
		},
		{
			$project:{
				name:1,
				isArchive:1,
				isPrivateAccount:1,
				picture:{
					$concat:[IMAGE_BASE, "users/", "$picture"]
				},
				requests:1,
				insensitiveName: 1,
				mutualFriend :{
						$filter: {
							input: "$followings",
							as: "x",
							cond: { $setIsSubset : [["$$x"],req.user.followings ] }
						}
					}
				}
		},
		{
			$lookup:{
			 from: 'users',
			 localField: 'followings',
			 foreignField: '_id',
			 as: 'followings'
			}
		}, 
		{
			$project:{
				name:1,
				isArchive:1,
				picture:1, 
				insensitiveName: 1,
				isPrivateAccount:1,
				isRequested : {
					$size:{
						$filter: {
							input: "$requests",
							as: "x",
							cond: { $eq : ["$$x", ObjectId(req.user._id)] }
						}
					}
				},
				mutualFriend: {$size : "$mutualFriend" }
			}
		}
	])
	.sort({'mutualFriend':-1,'insensitiveName': 1, })
	// .skip(req.query.page? parseInt(LPP*req.query.page):0)
	// .limit(LPP)
	// .lean()
	.exec((err, users)=>{
		if(err) return next(err)


		res.status(200).json({
			type: true,
			data:users,
			limit:LPP,
			message: DM.list_found
		})

	})
}


exports.followersList = function(req, res, next) {
	console.log("followersList called", req.params);
	User.findById(req.params.id ? req.params.id  : req.user._id, (err, user)=>{
		if(err) return next(err)
		User.populate(user, [
			{
				path:'followers',
				select:'name picture  currentMove lastCheckin isArchive',
				// populate:[{
				// 		path: 'lastCheckin.business',
				// 		select: 'name',
				// 		model:'Business',
				// 	},
				// 	{
				// 		path: 'currentMove.business',
				// 		select: 'name',
				// 		model:'Business'
				// }],
				options: {
					sort:{insensitiveName: 1},
					// skip: req.query.page? parseInt(LPP*req.query.page):0,
					// limit:LPP
				},
				match:{
					userType:"Customer",
					// isArchive:false
				}
			}
		], (err, user)=>{
			if(err) return next(err);

			return res.status(200).json({
				type: true,
				data:user.followers,
				limit:LPP,
				message: DM.list_found
			})

		})
	})

}

console.log(FX.crypto("5a1278dd6f254e707775f7cc", "encrypt"));
// var req = { user : {id : ObjectId("5a03f9a0fafa645c8a39934c")}}
// User.aggregate([
// 	{
// 		$match:{
// 			_id: ObjectId(req.user.id)
// 		}
// 	},
// 	{
// 		$lookup:{
// 		 from: 'status',
// 		 localField: 'lastCheckin._id',
// 		 foreignField: '_id',
// 		 as: 'checkin'
// 		}
// 	},
// 	{
// 		$project : {	
// 			name:1,
// 			lastCheckin: { $arrayElemAt:[ "$checkin",0]},
			

// 		// 	followings:1,
// 		// 	isFollowed : {
// 		// 		$size : {
// 		// 			$filter: {
// 		// 				input: "$followings",
// 		// 				as: "x",
// 		// 				cond: { $eq : ["$$x", ObjectId("5a1ffb8ee57a5e7dd0d55de5") ] }
// 		// 			}
// 		// 		}
// 		// 	},
// 		}
// 	},
// 	{
// 		$addFields:{
// 			"lastCheckin.isLiked": { $literal:1  },
// 		}
// 	}
// ])
// .exec((err,results)=>{
// 	console.dir({
// 		err:err,
// 		results:JSON.stringify(results)
// 	});
// })

exports.followingsList = function(req, res, next) {

	console.log("followingsList called", req.params);
	User.findById(req.params.id ? req.params.id  : req.user._id, (err, user)=>{
		if(err) return next(err)
		User.populate(user, [
			{
				path:'followings',
				select:'name picture isPrivateAccount currentMove lastCheckin isArchive',
				populate:[{
						path: 'lastCheckin._id',
						select: 'comments likes',
						model:'Status'
					},
					{
						path: 'currentMove._id',
						select: 'comments likes',
						model:'Status'
				}],
				options: {
					sort:{ lastCheckin:-1, insensitiveName: 1},
				},
				match:{
					userType:"Customer",
					// isArchive:false
				}
			}
		], (err, user)=>{
			try {
				followings =user.toObject().followings
			} catch (e) {
				console.error(e);
				followings = []
			}
			// console.log(JSON.stringify(followings));
			followings.forEach((v)=>{
				if(checkin1 = v.lastCheckin){
					if(checkin = checkin1._id){
						checkin1.checkin= checkin._id
						checkin1.checkinLikeCount= checkin.checkinLikeCount
						checkin1.checkinCommentCount= checkin.checkinCommentCount
						console.log(checkin.likes);
						if(checkin.likes.some(w=>{
								console.log(w);	
								if(w.toString() == req.user._id ) return true
							})) v.isLiked = true

					}
					delete checkin1._id
					checkin1._id = checkin1.checkin
					checkin1.isLiked=1
				}
					
				if(move1 = v.currentMove){
						if(move = move1._id){
							console.log(move.likes);
							move1.move = move._id
							move1.checkinLikeCount= move.checkinLikeCount
							move1.checkinCommentCount= move.checkinCommentCount
							if(move.likes.some(w=>{
								console.log(w);
								if(w.toString() == req.user._id ) return true
							})) v.isLiked = true

					}
						delete move1._id
						move1._id = move1.move
						move1.isLiked=1
				}


			})

			return res.status(200).json({
				type: true,
				data:followings,
				limit:LPP,
				message: DM.list_found
			})
				
		})
	})

}

// User.findOne({})
// .cursor()
// .on('data', function(doc) { 
// 		console.log(doc.name); 
//  })
// .on('end', function() { 
// 	console.log('Done!')
// }) 
// .on('error', function(err) { 
// 	console.log(err); 
// })

exports.myActivityList = function(req, res, next) {

	console.log("myActivityList called");
	Activity.find({
		$or:[
			// { "activityBy": req.user._id },
			{ "activityOn": req.user._id }
		],
		activityType: {
			$in: [ "follow", "followReq", "checkinLike", "checkinComment","make_move"]
		},
		hide : false
	})
	.sort("-_id")
	.populate([
			{
				path: 'activityBy',
				select: {
					name:1, 
					username:1,   
					isArchive:1, 
					isPrivateAccount:1,
					picture:1,
					requests: {
						$elemMatch:{
							$eq: req.user._id
						} 
					},
					followers: {
						$elemMatch:{
							$eq: req.user._id
						} 
					},
				},
				// match:{
				// 	userType:'Customer'
				// }
			},
			{
				path: 'activityOn',
				select: 'name username isArchive isPrivateAccount picture',
				// match:{
				// 	userType:'Customer'
				// }
			}
		])
		// .skip(req.query.page? parseInt(LPP*req.query.page):0)
		// .limit(LPP)
		.lean()
		.exec((err, results)=>{
		if(err) return next(err);

		if(!results.length) results =[]
			console.log(JSON.stringify(results));
		results.map((v)=>{
			v.user = new UserInfo(v.activityBy)
			var msg = `${v.user.name}`
			if(v.activityType=='follow')
				msg+= ` started following you`
			else if(v.activityType=='checkinLike')
				msg+= ` liked your status`
			else if(v.activityType=='checkinComment')
				msg+= ` commented on your status`
			else if(v.activityType=='make_move')
				msg+= ` invite you to make moves on `+v.activityOn.name
			else if(v.activityType=='followReq')
				msg+= ` requested to follow you `

			v.message = msg
			v.isFollowed = v.activityBy.followers ? v.activityBy.followers.length : 0
			v.isRequested = v.activityBy.requests ? v.activityBy.requests.length : 0
			// v.isFollowed =
			// 	req.user.followings.some((w)=>{
			// 		if(w.toString() == v.user.user_id.toString()) return true
			// 	})

			// v.isRequested =
			// 	req.user.requests.some((w)=>{
			// 		if(w.toString() == v.user.user_id.toString()) return true
			// 	})

			delete(v.activityOn)
			delete(v.activityBy)
		})

		res.status(200).json({
			type: true,
			data:results,
			message: DM.list_found,
			limit:LPP
		})

	})
}


exports.followingsActivityList = function(req, res, next) {

	console.log("followingsActivityList called",req.user.followings);

	Activity.find({
		$and:[{
			activityBy:{
				$in:req.user.followings
			}
		},
		{
			activityOn:{
				$ne:req.user._id
			}
		},
		{
			activityType: {
				$in: [ "follow", "like", "move"]
			}
		}],
		hide:false
	})
	.sort("-_id")
	.populate([
			{
				path: 'activityOn',
				select: 'name username picture isArchive',
			},
			{
				path: 'activityBy',
				select: '_id name username  isArchive isPrivateAccount picture currentMove lastCheckin',
				// populate:[{
				// 		path:"lastCheckin.business",
				// 		model:"Business",
				// 		select: "name"
				// 	},
				// 	{
				// 		path: 'currentMove.business',
				// 		select: 'name',
				// 		model:'Business'
				// }]
			}
		])
		// .skip(req.query.page? parseInt(LPP*req.query.page):0)
		// .limit(LPP)
		.lean()
	.exec((err, results)=>{
		if(err) return next(err);

		if(!results.length) results = []

		results.map((v)=>{
			v.user = new UserInfo(v.activityBy)
			var msg = v.user.name
			if(v.activityType=='follow') msg += " started following "
			else if(v.activityType=='like') msg += " favorited "
			else if(v.activityType=='move') msg += " is making moves to "

			msg += v.activityOn.name
			v.message = msg
			v.isRequested =
				req.user.requests.some((w)=>{
					if(w.toString() == v.user.user_id.toString()) return true
				})

			
			delete(v.activityOn)
			delete(v.activityBy)
		})

		return res.status(200).json({
			type: true,
			data:results,
			message: DM.list_found,
			limit:LPP
		})

	})
}

// Status.findById("5a434711bd0c4d6760f5dbe2")
// 	.select({
// 		comments:{			
// 			$elemMatch:{
// 				likes: "5a03f9a0fafa645c8a39934c"
// 			} 
// 		},
// 	})	

// // .sort({created:-1})
// .exec((err, results)=>{
// 	console.log(err, JSON.stringify(results));
// })

exports.checkinCommentList = function(req, res, next) {

	console.log("checkinCommentList called", req.params.id);

	Status.findById(req.params.id, 'comments').
		populate({
			path: 'comments.commentBy',
			select: 'name picture isArchive',
			model:'User',
			// options:{
			// 	sort:{created:-1}
			// }
		})
	// .sort({created:-1})
	.exec((err, results)=>{
		if(err) return next(err);
		results = results.toObject()
		results.comments = results.comments.reverse()
		results.comments.forEach((v)=>{
			if(v.likes.some((w)=>{
				console.log(req.user._id,w);
					if(w.toString() == req.user._id) {
						console.log(`ddddddddd`);
						return true
					}
				})) v.isLiked = true
		})

		res.status(200).json({
			type: true,
			data:results.comments,
			message: DM.list_found
		})
	})

}
