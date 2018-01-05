var mongoose = require('mongoose');
const Business = mongoose.model("Business");
const User = mongoose.model("User");
const Scene = mongoose.model("Scene");
const Group = mongoose.model("Group");
const Checkin = mongoose.model("Checkin");
const Invitee = mongoose.model("Invitee");
const BusinessImage = mongoose.model("BusinessImage");
const MenuImage = mongoose.model("MenuImage");
var { BusinessInfo, UserInfo, OpenTill } = require('../models/classes');

exports.getScene = function(req, res, next) {

	console.log("getScene called", req.params);

	Scene.find({
		name:{
			$regex: new RegExp('^'+req.params["name"], 'i')
		},
			isArchive: false
		},
		"name",
		function(err, sceneData) {
		if(err) return next(err);

		if(!sceneData.length)
			return res.status(200).json({
				type: false,
				message:DM.no_result_found
			});

		return res.status(200).json({
			type: true,
			data:sceneData,
			message: "Scenes found"
		});

	});
}

exports.updateStatus = function(req, res, next) {
	// update event status by bouncer or owner

	var postData = req.body;
	console.log("updateStatus called", postData);

	Business.findOneAndUpdate({
		$or:[{
				_id : req.user.owner
			},
			{
				_id:req.user._id
			}]
		},
		{
			$set: postData
		},
		{
			new: true
		},
	(err, done)=>{
		if(err)	return next(err);

		if(!done)
			return res.status(203).json({
				type: false,
				message: DM.not_auth
			})

		return res.status(200).json({
			type: true,
			message: "status update successfully"
		})

	})
}

exports.currentStatus = function(req, res, next) {
	// update event status by bouncer or owner

	console.log("currentStatus called", req.user._id);

	Group.findOne({
		$or:[{
				leader:req.user._id
			},
			{
				coleader:req.user._id
			}]
	}
	// ,{
 //   	 "invitee":{
 //   	 	$elemMatch: {user_id : { $eq: req.user._id } }
 //   	}
	// }
	)
	// .select("name picture messages unseenCount leader")
	.populate([
		{
			path: 'leader',
			select: "waitingTime status attended",
			model: "User"
		}
	 ])
	.lean()
	.exec((err, group)=>{
		if(err)	return next(err);
		
		if(!group || !group.invitee.length )
			return res.status(203).json({
				type: false,
				message:"group not found"
			})
		console.log(group)
		
		group.unseenCount = 0
		var lastseen = group.invitee[0].updated.getTime()
		
		group.messages.forEach(v=>{
			if(v.created.getTime() > lastseen) ++group.unseenCount
		});
		
		group.room_id = group._id
		// group.picture  = IMAGE_BASE + 'users/' + group.picture
		group.business_id = group.leader._id
		Object.assign(group,group.leader)
		delete group.leader
		return res.status(200).json({
			type: true,
			data:group,
			message: "group found"
		})

	})
}


exports.createProfile = function(req, res, next) {

	var postData = req.body
	console.log("createProfile called", postData);

	FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
		if(err) return next(err);

		if(filename) postData.picture = filename

	FX.uploadFile(req.files.coverPicture, dir = 'users', thumb=false, (err, filename)=>{
		if(err) return next(err);

		if(filename)
			postData.coverPicture = filename

		postData.scene = postData.scene.split(',')
		postData.isProfileDone = 1;

		if(postData.longitude && postData.latitude)
			postData.geoLocation = [parseFloat(postData.longitude), parseFloat(postData.latitude)];

			// console.log(postData.open);
		// try {
		// 	postData.open = JSON.stringify(postData.open)
		// } catch (e) {
		// 	console.log("fail to stringify");
		// 	postData.open = new OpenTill()
		// }
		var update = { name : postData.name }
		if(postData.picture)
			update.picture = postData.picture 

		Group.findOneAndUpdate({
				leader: req.user._id
			},
			{
				$set: update
			},
			{
					upsert: false,
					new: true
			})
		.exec((err, results)=>{
			if(err)	return next(err);

			// console.log(results);
			postData.businessGroup = results._id

			Business.findOneAndUpdate(
				{
					_id: req.user._id
				},
				{
						$set: postData
				},
				{
						upsert: false,
						new: true
				},
				(err, businessData)=> {
					if(err) return next(err);

					if(!businessData)
						return res.status(200).json({
							type: false,
							message:"Business not found "
						});

					businessData = new BusinessInfo(businessData);

					return res.status(200).json({
						type: true,
						data: businessData,
						message:DM.profile_created
					})

			});

		});
	});
	});

}

const url = require('url');

// console.log(url.URL.toString());
exports.favouriteBusinessList = function(req, res, next){
	//	view business
	var postData  = req.body;
	console.log("favouriteBusinessList called", req.user._id);
	User.findById(req.params.id)
		.populate([
			{
			path: 'favourites',
			select: 'name picture isArchive',
			//	match use to find friendsOnBusiness
			options: {
				 "$sort":"name"
			},
			match:{
				// isArchive:false
			}
	 }])
	 // .select("name, picture")
	.exec((err, result)=> {
	if(err) return next(err)
		if(!result || !result.favourites)
			var favourites = []
		else
			favourites = result.favourites

	return res.status(200).json({
		type: true,
		data: favourites,
		message:"favourites found"
	}) 		
}) 		

}



exports.insights = function(req, res, next) {
	User.aggregate([
			{
				$match:{
					_id:ObjectId("5a1278dd6f254e707775f7cc")
				}
			},
			{
				$lookup:{
				 from: 'users',
				 localField: 'likes',
				 foreignField: '_id',
				 as: 'likes'
				}
			}, 
			{
				$project:{
					name:1,
					isArchive:1,
					picture:1, 
					isPrivateAccount:1,
					gender:"$likes.gender",
					age: {
						$map:
							 {
								 input:"$likes.birthdate",
								 as: "x",
								 in: {  $substr: [ "$$x",6, 9 ]}
							 }
					},
					// age: { $subtract : [ new Date().getFullYear(),"$likes.birthdate" ] },
					// male : {$literal :0 },
					// female : {$literal :0 },
					// total : {$literal :0 },
					// agebelow18 : {$literal :0 },
					// age18to30 : {$literal :0 },
					// age30to45 : {$literal :0 },
					// ageabove45 : {$literal :0 },
				},
			},
		])
		.exec((err, results)=>{
			var stat = results[0]
			var thisYear  =   new Date().getFullYear()
			var male =female= agebelow18= age18to30= age30to45= ageabove45 =0
			var total = stat.gender.length 
			stat.gender.forEach(v=>{
				if(v=='Male') male+=1
				if(v=='Female') female+=1
			})

			stat.age.forEach(v=>{
				var val = thisYear-v	
				console.log(`v`,val);
				if(val<18) agebelow18+=1
				if(18<val<30) age18to30+=1
				if(30<val<45) age30to45+=1
				if(val>45) ageabove45+=1
			})
			console.log(male,total);
			var insights = {
				male : male/total*100,
				female : female/total*100,
				other : (total-male-female)/total*100,
				agebelow18 : agebelow18/total*100,
				age18to30: age18to30/total*100,
				age30to45: age30to45/total*100,
				ageabove45: ageabove45/total*100,
			}
			res.status(200).json({
				type: true,
				data:insights,
				message: "business found"
			})
			
		})

}
exports.viewBusiness = function(req, res, next) {

	//	view business
	var postData  = req.body;
	console.log("viewBusiness called", req.user.followings);
	Business.findById(req.params.id)
		// .populate([
		// 	{
		// 	path: 'moves',
		// 	select: 'name picture isArchive isPrivateAccount isPrivateAccount',
		// 	//	match use to find friendsOnBusiness
		// 	match: {
		// 		 "_id":{
		// 			$in:req.user.followings
		// 		},
		// 		// isArchive:false
		// 	},
		//  }
	// ])
	.exec((err, biz)=> {
		if(err) return next(err);
		try{
			biz = biz.toObject()
		}catch(e){
			return next(e)
		}

		User.populate(req.user, [
			{
				path:'followings',
				select:'name picture isArchive isPrivateAccount isPrivateAccountcurrentMove lastCheckin',
				match:{
					$or:[{
							"lastCheckin.business" : ObjectId(req.params.id),
							
						}, 
						{
							"currentMove.business" : ObjectId(req.params.id)
					}]
				},
				options: {
					sort:{ lastCheckin:-1, insensitiveName: 1},
				}
			}
		], (err, user)=>{

			biz.friendsOnBusiness = user.followings
			biz.friendsOnBusinessCount = user.followings.length
			biz.dist = FX.getDistance(parseFloat(req.query.latitude),parseFloat(req.query.longitude),  biz.geoLocation[1],biz.geoLocation[0] )

			biz.likesCount = biz.likes.length
			biz.busines_id = biz._id
			
			biz.isLiked =
				biz.likes.some(
					(v)=>{
					if(v.toString()==req.user._id.toString()) return true
				}) ? true:false;
			res.status(200).json({
				type: true,
				data:biz,
				message: "business found"
			})
		})


	})

}



exports.friendsOnBusiness = function(req, res, next) {

	//	list of my friends on a business
	var postData  = req.body;
	console.log("friendsOnBusiness called");

	User.populate(req.user, [
		{
			path:'followings',
			select:'name picture  isArchive isPrivateAccount isPrivateAccountlastCheckin currentMove',
			match:{
				$or:[{
						"lastCheckin.business" : ObjectId(req.params.id),
						
					}, 
					{
						"currentMove.business" : ObjectId(req.params.id)
				}]
			},
			options: {
				sort:{ lastCheckin:-1, insensitiveName: 1},
			}
		}
	], (err, user)=>{
		console.log(err);
		if(err) return next(err);

		return res.status(200).json({
			type: true,
			data:{ moves: user.followings },
			message: DM.list_found,
			limit:LPP
		})

	})
}




exports.getBusiness = function(req, res, next) {

	var postData = req.body;
	console.log("getBusiness called",postData.longitude,postData.latitude);

	postData.geoLocation = [
		parseFloat(postData.longitude),
		parseFloat(postData.latitude)
	];
	var match =  {
		isProfileDone:true
	}

	if(postData.isFavourite){
		match.isFavourite = true;
		//	when get favourite business remove filter
		delete postData.sortType
		delete postData.scene
		postData.sort = 1
	}

	if(postData.scene)
		match.scene = {
			"$in": postData.scene.split(",").map((v)=>{
							return v.trim().toLowerCase()
						 })
		}

		if(postData.sortType=="waitingTime"){
			match.waitingTime = { $lte: parseInt(postData.sort)  }
			postData.sort = 1
		}


		if(postData.sortType=="dist"){
			maxDistance =  postData.sort*1.609344*1000
			postData.sort = 1
		}
		else
			maxDistance = false



	const sort = {}
	if(postData.sortType) sort[postData.sortType] = parseInt(postData.sort)
	else sort.insensitiveName = 1

	User.populate(req.user, [
		{
			path:'followings',
			select:'_id lastCheckin currentMove  isArchive',
			// populate:[{
			// 		path: 'lastCheckin',
			// 		select: '_id',
			// 		model:'Checkin'
			// 	},
			// 	{
			// 		path: 'currentMove',
			// 		select: 'status',
			// 		model:'User'
			// }],
			match:{
				// isArchive:false
			},
			options: {
				sort:{ lastCheckin:-1, insensitiveName: 1},
			}
		}
	], (err,user)=>{
		console.log(user.followings);
		var ck =  []
		var mv =  []
		user.followings.forEach(v=>{
			if(v.lastCheckin) ck.push(v.lastCheckin._id)
			if(v.currentMove) ck.push(v.currentMove._id)
		})

		console.log(`ck`, ck);
		console.log(`mv`, mv);

		Business.aggregate([
			{
				'$geoNear': {
						'near': {
								'type': 'Point',
								'coordinates':postData.geoLocation
						},
						'spherical': true,
						'distanceField': 'dist',
						'distanceMultiplier':0.000621371,
						"maxDistance": maxDistance
					}
			},
			{
				$lookup:{
					 from: 'status',
					 localField: '_id',
					 foreignField: 'business',
					 as: 'checkins'
				}
			},
			{
				'$project' : {
					name : 1,
					dist:1,
					likes:1,
					scene:1,
					isProfileDone:1,
					waitingTime:1,
					occupancy:1,
					attended:1,
					// attendeeCount: { $size: "$moves"},
					// crowded:{
					// 	$ceil: {$divide:[ {$multiply:["$attendeeCount", 100]}, "$occupancy"]}
					// },
					attendeeCount:{
						$ceil:{
							$multiply:[
								{
									$divide:["$attended", { $cond: [ "$occupancy","$occupancy",1 ]}]
								},100
							]
						}
					},
					// event: {
					// 	$filter: {
					// 		 input: "$events",
					// 		 as: "item",
					// 		cond: {
					// 			$and : [
					// 				{ $lte: ["$$item.start", new Date() ] },
					// 				{ $gte: ["$$item.end", new Date() ] } ]
					// 		}
					// }},
					longitude:{
						$arrayElemAt:["$geoLocation", 0]
					},
					latitude:{
						$arrayElemAt:["$geoLocation", 1]
					},
					picture:{
						$concat:[IMAGE_BASE, "users/", "$picture"]
					},
					coverPicture:{
						$concat:[IMAGE_BASE, "users/", "$coverPicture"]
					},

					status:{$literal:"this is a tmp status"},
					friendsOnBusiness : [],

					friendsOnBusiness:{
						 $filter: {
							input: "$checkins",
							as: "x",
							cond: {  $setIsSubset: [["$$x._id"], ck] }
						}
					},
					friendsOnBusinessCount: { $size: {
						$filter: {
								 input: "$checkins",
								 as: "x",
									cond: {  $setIsSubset: [["$$x._id"],  ck] }
						}
					}},
					likesCount: { $size: "$likes" },
					isMoved:{$setIsSubset:[ [req.user._id], "$moves" ] 	},
					isFavourite : {
						$setIsSubset:[ [req.user._id], "$likes" ]
					}
				}
			},
			{
				'$match' : match
			},
			{
				'$sort':sort
			}
		]).exec((err, results)=>{
			if(err) return next(err);

			if(!results.length) results = []

			Business.populate(results, {
				path: "friendsOnBusiness",
				select:"picture"
			}, (err, business)=>{
				
				if(err) return next(err);
				return res.status(200).json({
					type: true,
					data:results,
					message: DM.list_found,
					limit:LPP
				});

			})
		})
	})
}

exports.addBusinessImage = function(req, res, next) {

	var postData = req.body;
	console.log("addBusinessImage called");

	FX.uploadFile(req.files.file, dir = 'businessImages', thumb=false, (err, filename)=>{
		if(err) return next(err);

		if(filename) postData.filename = filename

		businessImage = new BusinessImage(postData);

		Business.findOneAndUpdate(
			{
				_id: req.user._id
			},
			{
				// use addToSet instead of pull to make uniue array.
				$push: {
					businessImages: businessImage
				}
			},
			{
				upsert: false,
				new: true
			},
		(err, businessData) => {
			if(err) return next(err);

			return res.status(200).json({
				type: true,
				data:businessImage,
				 message: DM.file_uploaded
			})

		})
	})

}

exports.addMenuImage = function(req, res, next) {

	var postData = req.body;
	console.log("addMenuImage called");

	FX.uploadFile(req.files.file, dir = 'menuImages', thumb=false, (err, filename)=>{
		if(err) return next(err);

		if(filename) postData.filename = filename

		menuImage = new MenuImage(postData);

		Business.findOneAndUpdate(
			{
				_id: req.user._id
			},
			{
			// use addToSet instead of pull to make uniue array.
				$push: {
					menuImages: menuImage
				}
			},
			{
				upsert: false,
				new: true
			},
		(err, businessData)=> {
			if(err) return next(err);

			// menuImage.filename = IMAGE_BASE+"menuImages/"+menuImage.filename;
			return res.status(200).json({
				type: true,
				data:menuImage,
				message: DM.file_uploaded
			})

		})
	})

}


exports.removeMenuImage = function(req, res, next) {

	var postData = req.body;
	console.log("removeMenuImage called", req.params);

	Business.findOneAndUpdate(
		{
			_id: req.user._id
		},
		{
			$pull: {
				menuImages: {_id: req.params.id }
			}
		},
		{
			new: false
		}, (err, businessData)=> {
		if(err) return next(err);

		var deletedImageObj =
			businessData.menuImages.filter(
				(item)=>{ return item._id == req.params.id
				})

		// console.log('deletedImageObj',deletedImageObj)
		if(!deletedImageObj.length)
			return res.status(200).json({
				type: true,
				message: DM.file_not_exists
			})

		 filepath = path.join( UPLOAD_PATH, "menuImages", deletedImageObj[0].filename)
		//  console.log(filepath);

		fs.exists(filepath, (exists) => {
				if(exists) {
					fs.unlinkSync(filepath)
					 return res.status(200).json({
						 type: true,  message: DM.file_removed
					 })
				}
				else
					return res.status(203).json({
						type: false,
						message: DM.file_remove_fail
					})
			});

	})
}


exports.removeBusinessImage = function(req, res, next) {

	var postData = req.body;
	console.log("removeBusinessImage called", req.params);

	Business.findOneAndUpdate({
			_id: req.user._id
		},
		{
			$pull: {
				businessImages: {_id: req.params.id }
			}
		},
		{
			new: false
		}, (err, businessData)=> {
		if(err) return next(err);

		var deletedImageObj =
			businessData.businessImages.filter(
				(item)=>{
					return item._id == req.params.id
				})

		console.log('deletedImageObj',deletedImageObj)

		if(!deletedImageObj.length)
			return res.status(203).json({
				type: false,
				message: DM.file_not_exists
			})

		 filepath =path.join( UPLOAD_PATH, "businessImages", deletedImageObj[0].filename)
		//  console.log(filepath);

		fs.exists(filepath, (exists) => {
			if(exists) {
				fs.unlinkSync(filepath)
				 return res.status(200).json({
					 type: true,
					 message: DM.file_removed
					})
			}
			else
				return res.status(203).json({
					type: false,
					message: DM.file_remove_fail
				})

			});

	})
}



//
// Business.aggregate([
// 	{
// 		$match:{
// 			_id: ObjectId(req.params.id)
// 		}
// 	},
// 	{
// 		$unwind:"$followings"
// 	},
// 	{
// 		$lookup:{
// 		 from: 'users',
// 		 localField: 'followings',
// 		 foreignField: '_id',
// 		 as: 'followings'
// 		}
// 	},
// 	{
// 		$unwind:"$followings"
// 	},
//
// 	{
// 		$lookup:{
// 		 from: 'checkins',
// 		 localField: 'lastCheckin',
// 		 foreignField: '_id',
// 		 as: 'lastCheckin'
// 		}
// 	},
// 		{
// 		$unwind:"$lastCheckin"
// 	},
// 	{
// 		$project : {
// 			name:"$followings.name",
// 			user_id:"$followings._id",
// 			picture:{
// 				$concat:[IMAGE_BASE, "users/", "$picture"]
// 			},
// 			status: "$lastCheckin.status",
// 			isFollowed:{
// 				$eq: ["$followings._id", req.user._id]
// 			}
// 		}
// 	}
// ])
