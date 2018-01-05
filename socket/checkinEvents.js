const mongoose = require('mongoose');
const User = mongoose.model("User");
const Business = mongoose.model("Business");
const Checkin = mongoose.model("Checkin");
const Invitee = mongoose.model("Invitee");
const Group = mongoose.model("Group");
const { users,serverErr } = require('./shared');
const { UserInfo } =require('../app/models/classes');


exports.checkin = function(data, ack){
	return
	var	socket = this
	//	socket session performance improve
	// if(socket.user && socket.user.lastCheckin)
	// if(socket.checkOutDone)
	// 	return checkOut(socket.user)

	//	 to get Business from lastCheckin
	// Business.populate(socket.user, {
	// 		path: "lastCheckin",
	// 		model:'Checkin'
	// 	}, (err, user)=>{
	// 		if(err) return socket.emit("error", err)

			console.log('######', socket.user.lastCheckin);
			if(socket.user.lastCheckin)
				return checkOut(socket.user);

			console.info("user.lastCheckin not found ");

			Business.aggregate([
				{
					$geoNear: {
						'near': {
								'type': 'Point',
								'coordinates':[parseFloat(data.longitude), parseFloat(data.latitude)]
						},
						'spherical': true,
						'distanceField': 'dist',
						'maxDistance':100
					}
				},
				// {
				// 	$lookup:{
				// 		 from: 'events',
				// 		 localField: '_id',
				// 		 foreignField: 'business',
				// 		 as: 'events'
				// 	}
				// },
				{
					$project:{
						"dist":1,
						"geoLocation":1,
					 	// "event": {
							//  $arrayElemAt: [
							// 		 {
							// 				 $filter: {
							// 						 "input": "$events",
							// 						 "as": "e",
							// 						 "cond": {
							// 								$and:[
							// 									{
							// 									 $lte: [
							// 										 "$$e.start",
							// 										 new Date()
							// 									 ]
							// 								},
							// 								{
							// 									$gte: [
							// 										"$$e.end",
							// 										new Date()
							// 									]
							// 								}
							// 							]
							// 				 		}
							// 				 }
							// 		 }, 0
							//  ]
					 	// },
						"name":1
					}
				},
				// {
				// 	$match:{
				// 		"event":{$exists:true}
				// 	}
				// },
				{
					$sort:{
						"dist": 1
					}
				},
				{
					$limit: 1
				}
			]).exec((err, business)=>{

				if(err) return socket.emit("error", err)

				if(!business.length){
					console.log("NO business found");
					return ack({
						status: 203,
						message: "No business found"
					})
				}
				business = business[0];
				// console.log(`business found autoCheckOut=event.end : ${business.event.end} on dist ${business.dist} business geo ${business.geoLocation}` );

				//	notic here user.lastCheckin not socket.user.lastCheckin
				// if(business._id == socket.user.lastCheckin.business)
				// 	return  ack({
				// 		status: 203,
				// 		message: "Already checkin"
				// 	})

				console.info("new checkin");
				
				var checkinPoint = {
						user: socket.user._id,
						business: business._id,
						status:  business.name,
						geoLocation : business.geoLocation
					}
				Checkin.create(checkinPoint,(err, checkin)=>{
					if(err)
						return socket.emit("error", err)
					
					checkinPoint._id = checkin._id
					socket.user.lastCheckin = checkinPoint;
					console.dir(checkinPoint);
					User.findOneAndUpdate({
							_id:socket.user._id
						},
						{
							$set:{
								lastCheckin: checkinPoint,
							}
						},
						{
							new:true,
							upsert:true
						},(err, done)=>{
						if(err) return socket.emit("error", err)

						Group.findOneAndUpdate(
							{
								isBusiness:true,
								leader:business._id,
								"invitee.user_id" : {$ne : socket.user._id}
							},
							{
								// use addToSet instead of pull to make uniue array.
								$addToSet: {
									invitee: new Invitee({ user_id : socket.user._id })
								}
							},
							{
								upsert: false,
								new: true
							},(err, group)=>{
							if(err) return socket.emit("error", err)
							
							// socket.user.lastCheckin = checkin;
														
							// socket.user.autoCheckOut = business.event.end;

							// var timer = (business.event.end.getTime()-new Date())*1000
							// console.log("checkin Successfully expire after",timer );
							// setTimeout(function () {
							// 	console.info("timer called after milisec." );
							// 	checkOut(socket.user, 1);
							// }, 10000);
	
								ack({
									status: 200,
									message: "Checkin Successfully"
								})
						})
					})
				})
			})

	// })

	function checkOut(user, patch){
		// console.info("checkOut called",user.lastCheckin);
		var geo = user.lastCheckin.geoLocation
		var dist = 0
			try {
				console.log("lat long before sending in function===>", geo[1] , geo[0], data.latitude, data.longitude)
				dist = FX.getDistance(geo[1], geo[0], data.latitude, data.longitude)
				console.log("checkout new dist ", dist*1000);
			} catch (e) {
				console.log("@@ error is getDistance", e);
			}
		
		// if(user.autoCheckOut.getTime() < new Date().getTime() || dist*1000 > 50)
		

		if(dist*1000 > 100 || patch)
		// if(1)
			User.findOneAndUpdate({
					_id:user._id
				},
				{
					$set:{
						lastCheckin:null,
						// autoCheckOut:null
					}
			},(err, done)=>{
				Group.findOneAndUpdate(
					{
						isBusiness:true,
						leader:user.lastCheckin.business,
						"invitee.user_id" : user._id
					},
					{
						// use addToSet instead of pull to make uniue array.
						$pull: {
							invitee: { user_id : user._id }
						}
					},
					{
						upsert: false,
						new: true
					},(err, group)=>{
								if(err) return socket.emit("error", err)
								// console.log(done);
								console.info("checkOut Successfully with checkOutDone ", socket.checkOutDone );

								return ack({
									status: 203,
									message: "CheckOut Successfully"
								})
							
						})
			})
		else{
			console.log("noting in checkOut Already Checkin");
			return ack({
				status: 203,
				message: "Already Checkin"
			})
		}
	}

}
