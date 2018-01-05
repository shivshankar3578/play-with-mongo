var mongoose = require('mongoose');
const User = mongoose.model("User");
const Business = mongoose.model("Business");
const Group = mongoose.model("Group");
const Invitee = mongoose.model("Invitee");
const Activity = mongoose.model("Activity");
const { users } = require('../../socket/shared');
var { BusinessInfo, UserInfo, UserShortInfo, GroupShortInfo } = require('../models/classes');


exports.updateGroup = function(req, res, next) {

	var postData = req.body;
	console.log("updateGroup called", postData);
	FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
		if(err) return next(err)

		if(filename) postData.picture = filename

		Group.findByIdAndUpdate(req.params.id, {
				$set: postData
			}, {
				new: true
			}, (err, userData)=>{
			if(err)	return  next(err);

			userData = new GroupShortInfo(userData)
			return res.status(200).json({
				type: true,
				data:userData,
				message: "group updated"
			})

		})

	})
}


exports.viewGroup = function(req, res, next) {
	var postData  = req.body;
	console.log("viewGroup called" );
	Group.findById(req.params.id)
	.populate([{
			path: 'coleader',
			select: 'name picture',
			model:"User",
		},
		{
			path: 'leader',
			select: 'name picture',
			model:"User",
		},
		{
			path: 'invitee.user_id',
			select: 'name picture isArchive',
			model:"User",
			match: {
				//  "currentMove":{
				// 	$eq: "$currentMove"
				// },
				// // isArchive:false
			},

		// options: {
		// 	sort:{insensitiveName: 1},
		// 	skip: req.query.page? parseInt(LPP*req.query.page):0,
		// 	limit:LPP
		// },
	}])
	.exec((err, results)=>{
		if(err) return next(err);
		var invitees = []
		var results = JSON.parse(JSON.stringify(results))
		results.invitee.forEach(v=>{
			invitees.push(v.user_id)
		})
		results.invitee = invitees
		res.status(200).json({
			type: true,
			data:results ,
			message: "group found"
		});
	})

}

exports.createGroup = function(req, res, next) {

	var postData = req.body;
	console.log("createGroup called", postData);

	FX.uploadFile(req.files.picture, dir = 'users/', thumb=false, (err, filename)=>{
		if(err) return next(err);

		if(filename) postData.picture = filename
		invitee = []

		postData.invitees.split(",").forEach(v=>{
			invitee.push(new Invitee({user_id:v}))
		})
		invitee.push(new Invitee({user_id:postData.leader}))

		postData.invitee =invitee
		// postData.lastMessage = {}
		var group =  new Group(postData);
		group.save((err, results)=>{
			if(err)	return next(err);

			res.status(200).json({
				type: true,
				data:new GroupShortInfo(results) ,
				message: "group created successfully"
			});

			postData.invitees.split(",").forEach(v=>{
				if(socket = users[v])
					socket.join(results._id)
			})

		});

	});
}


exports.inviteToGroup = function(req, res, next) {

	console.log("inviteToGroup called");

	Group.findOneAndUpdate(
		{
			_id: req.body.group_id,
			"invitee.user_id" : {$ne : req.body.user_id}
		},
		{
			// use addToSet instead of pull to make uniue array.
			$addToSet: {
				invitee: new Invitee({ user_id : req.body.user_id })
			}
		},
		{
			upsert: false,
			new: true
		},
	(err, userData)=>{
			if(err) return  next(err);

			return res.status(200).json({
				type: true,
				message: "User invited"
			})

		})

}





exports.moveMeter = function(req, res, next) {
	Group.findById(req.params.id)
	.select("invitee currentMove")
	.populate([{
			path: 'invitee.user_id',
			select: 'currentMove isArchive',
			model:"User",
			 match: {
				//  "currentMove":{
				// 	$eq: "$currentMove"
				// },
				// isArchive:false
			}
	 	},
	 	{
			path: 'currentMove',
			select: 'name isArchive',
			model:"User"
		}
		])
	.lean()
 	.exec((err, results)=>{
 		if(err) return next(err)
 			// console.log(results);
		if(results.currentMove)
			results.invitee =
			results.invitee.filter(v=>{
				console.log(results.currentMove._id , v.user_id.currentMove);
				if(results.currentMove._id.toString() == v.user_id.currentMove) return true
			})
		// console.log(results);
		return res.status(200).json({
			type: true,
			data: results,
			message: "List found successfully"
		});
 	})
}





exports.blockUser = function(req, res, next) {
	User.findByIdAndUpdate(req.user._id,
		{
			$addToSet: {
				blockedUser: req.params.id
			}
		},
		{
			new: true,
		},
	(err, done)=>{
		if(err) return next(err);
		return res.status(200).json({
			type: true,
			message: "user blocked successfully"
		});
	});
}

exports.unblockUser = function(req, res, next) {
	User.findByIdAndUpdate(req.user._id,
		{
			$pull: {
				blockedUser: req.params.id
			}
		},
		{
			new: true,
		},
	(err, done)=>{
		if(err) return next(err);
		return res.status(200).json({
			type: true,
			message: "user unblocked successfully"
		});
	});
}

exports.blockedUserList = function(req, res, next) {
	User.populate(req.user,[
		{
			path:'blockedUser',
			select:'name insensitiveName picture isArchive',
			// populate:{
			// 	path: 'lastCheckin',
			// 	select: 'status comments likes',
			// 	model:'Checkin'
			// },
			options: {
				sort:{insensitiveName: 1},
			}
		}],
	(err, results)=>{
		if(err) return next(err)
		return res.status(200).json({
			type: true,
			data:results.blockedUser,
			message: "list found"
		});
	})
}

exports.peopleOnGroup = function(req, res, next) {
	Group.findById(req.params.id)
	.select("invitee")
	.populate({
		path: 'invitee.user_id',
		select: 'name username picture isArchive',
		model:"User",
		match: {
			//  "invitee":{
			// 	$in:req.user.followings
			// }
		// // isArchive:false
		}
 	}).exec((err, results)=>{
		if(err) return next(err);

		if(!results && !results.invitee.length)
			return res.status(200).json({
				type: false,
				message: DM.no_result_found
			});
		try{
			var results = results.toObject()
		}	catch(e){
			return next(e)
		}

		var data = { group_id: results._id, moveCount:1}

		data.invitee =
			results.invitee.map(v=>{
				return {
					name : v.user_id.name,
					username : v.user_id.username,
					user_id: v.user_id.user_id,
					picture: v.user_id.picture
				}
			})

		return res.status(200).json({
			type: true,
			data:data,
			message: DM.list_found
		});


	})
}

// console.log(FX.crypto("5a03f60efafa645c8a39933f", "encrypt"));

exports.groupmove = function(req, res, next) {
	console.log("groupmove called");

	req.params.id  = req.body.business_id
	
	Group.findOneAndUpdate({
			_id:req.body.group_id
		},
		{
			$set:{
				currentMove: req.body.business_id,
				moveCount:1
			},
		},
		{
			new : true,
			upsert: false
		})
		.select('invitee')
		.populate({
			path: 'invitee.user_id',
			select : 'name picture isArchive',
			model:'User',
			// match:{
			// 	// isArchive:false
			// }
		})
	.lean()
	.exec((err, result)=>{
		if(err) return next(err)
			console.log(result);
		var ctrl = require('./activity')
		ctrl.move(req, res, next);
		var msg = `you have a make move request form ${req.user.name}`

		var activity =  [],
		updates = [ ]
		result.invitee.forEach(v=>{
			// FX.apnSend(v.user_id, msg, {type:"activity"})
			// skip self to notify
			console.log(`&&&&&&&&&&&&`,v.user_id._id , req.user._id);
			if(v.user_id._id != req.user._id.toString())
				activity.push(new Activity({
					activityBy:req.user._id,
					activityOn: v.user_id._id,
					activityType: "make_move",
					business_id: req.body.business_id,
					group_id: req.body.group_id
				}))
		})
		// console.log(activity);
		Activity.update({
				group_id:req.body.group_id
			},
			{
				$set: {
					hide:true
				}
			},
			{
				multi:true
			}, (err,done)=>{
				console.log(err);
				Activity.insertMany(activity, (err,done)=>{
					console.log(err);
				})

		})
	})

}



exports.closeMoveRequest = function(req, res, next) {
	console.log("rejectMoveRequest called");
		Activity.findByIdAndUpdate(req.params.id,
			{
				hide:true
			},
			{
				new:true,
				upsert:false
			}, (err,done)=>{
			 if(err) return next(err)

			 res.status(200).json({
					type: true,
					message: "Move request rejected"
			})
		})
}


exports.GroupsIcanMakemove  = function(req, res, next) {
	Group.aggregate([
		{
			$match : {
				$or:[
					{ leader: ObjectId(req.user._id) } ,
					{ coleader: ObjectId(req.user._id) }
				],
				canMove : true
			}
		},
		{
			$project: {
				name : 1,
				picture :{
					$concat:[ IMAGE_BASE , 'users/' , "$picture" ]
				},
				isMoving :{
					$eq : ["$leader", ObjectId(req.user.currentMove) ]
				}
			}
		}])
	.exec((err, groups)=>{
		if(err) return next(err);

		if(!groups.length)
			groups = []

		return res.status(200).json({
			type: true,
			data:groups,
			message: DM.list_found
		});


	})
}



exports.GroupsIcanInvite  = function(req, res, next) {
	Group.aggregate([
		{
			$match : {
				$or:[
					{ leader: ObjectId(req.user._id) } ,
					{ coleader: ObjectId(req.user._id) }
				],
				canInvite : true
			}
		},
		{
			$project: {
				name : 1,
				picture :{
					$concat:[ IMAGE_BASE , 'users/' , "$picture" ]
				},
				isInvited : {
					$size : {
						$filter: {
							input: "$invitee",
							as: "x",
							cond: { $eq : ["$$x.user_id", ObjectId(req.body.user_id) ] }
						}
					}
				}
			}
		}])
	.exec((err, groups)=>{
		if(err) return next(err);

		if(!groups.length)
			groups = []

		return res.status(200).json({
			type: true,
			data: groups,
			message: DM.list_found
		});


	})
}

exports.myGroups = function(req, res, next) {
	Group.aggregate([
		{
			$match : {
				$or:[
					{ leader: ObjectId(req.user._id) } ,
					{ "invitee.user_id": ObjectId(req.user._id) }
				],
				isBusiness : false
			}
		},
		{
			$project: {
				name : 1,
				picture :{
					$concat:[ IMAGE_BASE , 'users/' , "$picture" ]
				},
				isInvited : {
					$size : {
						$filter: {
							input: "$invitee",
							as: "x",
							cond: { $eq : ["$$x.user_id", ObjectId(req.body.user_id) ] }
						}
					}
				},
				// isMoving :{
				// 	$eq : ["$leader", ObjectId(req.user.currentMove) ]
				// }	
			}
		}])
	.exec((err, groups)=>{
		if(err) return next(err);

		if(!groups.length)
			groups = []

		res.status(200).json({
			type: true,
			data: groups,
			message: DM.list_found
		});


	})
}
