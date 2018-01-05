const { users, serverErr } = require('./shared');
const {UserInfo, UserShortInfo} =require('../app/models/classes');
const mongoose = require('mongoose');
const User = mongoose.model("User");
const Checkin = mongoose.model("Checkin");
const Group = mongoose.model("Group");
const Message = mongoose.model("Message");
const Chat = mongoose.model("Chat");
const Invitee = mongoose.model("Invitee");

// Group.find({}, (err, results)=>{
// 	// var S = require('string');
// 	console.log(`obj`);
// 	(function loop(index){
// 		var doc = results[index]
// 		if(index == results.length) return ;
// 		doc.invitee.push(new Invitee({user_id:doc.leader}))
// 		doc.save((err, done)=>{
// 			console.log(err);
// 			loop(++index)
// 		})
// 	})(0)
// })

exports.leaveChat = function(data, ack){
	const socket = this
	socket.user.online = false;
	if(player = users[socket.user._id])
		player.user.followings.forEach((v)=>{
			if(friend = users[v._id]){
				console.log(`tell ${friend.name} you are leaving chat`);
				friend.emit("friendsStatus",[new UserShortInfo(socket.user)])
			}
		})
}

// console.log(FX.crypto("5a03f60efafa645c8a39933f", "encrypt"));
// console.log(FX.crypto("5a03f968fafa645c8a39934a", "encrypt"));


exports.groupList = function(data, ack){
	const socket = this
	// Checkin.populate(socket.user,{
	// 	path:'lastCheckin',
	// 	select:'business',
	// }, (err, user)=>{
		// if(err) return socket.emit("error", err)
		Group.aggregate([
			{
				$match:{
						$or:[
							{ "leader": socket.user._id },
							{ "coleader": socket.user._id },
							{ "invitee.user_id":socket.user._id }]
				}
			},
			// {
			// 	 $group : {
			// }
			{
				$project : {
					lastMessage:1,
					messages:1,
					name:1,
					leader:1,
					isBusiness:1,
					picture:1,
					created:1,
					insensitiveName:1,
					lastCheckin:1,
					friends:{
						$subtract:[
							{
								$size:{
									$filter: {
										 input: "$invitee",
										 as: "x",
										cond: {
											cond: {  $setIsSubset: [["$$x"], socket.user.followings] }
										}
									}
								}
							},1
						]
					},
					people:{
						$size:"$invitee"
					},
					invitee:{
						$filter: {
						 input: "$invitee",
						 as: "user",
							cond: {
								$eq : [ "$$user.user_id", socket.user._id]
							}
						}
					},
				}
			},
			{
				$unwind:"$invitee"
			},
			{
				$project:{
					lastMessage:1,
					name:1,
					created:1,
					friends:1,
					leader:1,
					people:1,
					insensitiveName:1,
					lastCheckin:1,
					isBusiness:1,
					// status:{$literal:"this is a tmp status"},
					picture: {
						$concat:[IMAGE_BASE, "users/", "$picture"]
					},
					// newly created group should be sort first
					new:{ $cond: [ { $size: "$messages"}, 1, 0] },
					unseenCount: {
						$size:{
							$filter: {
								 input: "$messages",
								 as: "msg",
								cond: {
									$and : [
										// count should contain messages after user join to last seen time
										// { $lte: ["$$msg.created", "$user.created" ] },
										{ $gte: ["$$msg.created", "$invitee.updated" ] } ]
								}
							}
						}
					}
				},
			},

			{
				$sort:{
					"isBusiness":-1,
					"lastMessage.updated":-1,
					"insensitiveName":1,
				}
			}
		])
		.exec((err, results)=>{
			console.log(err);
			if(err) return socket.emit("error", err)
				
			if(typeof ack == 'function')
				ack({
					status:200,
					data:results,
					message: "message found",
				})

		})
	// })
}

exports.messageLike = function(data, ack){
	const socket = this
	if(parseInt(data.action))
		var update = {
			$addToSet: {
				"messages.$.likes": socket.user._id
			}
		}
	else
		var update = {
			$pull: {
				"messages.$.likes": socket.user._id
			}
		}
	console.log(update)
	Chat.findOneAndUpdate({
			_id:data.room_id,
			"messages._id":data.message_id
		},
		update,
		{
			upsert: false,
			new: true
		}
	,(err, results)=>{
		console.log(err);
		if(err) return socket.emit("error", err)
		if(typeof ack == 'function')
			ack({
				status:200,
				message: "Like successfully",
			})
	})

}


exports.invite2group = function(data, ack){
	const socket = this
	Group.findById(data.room_id, (err, results)=>{
		if(err) return socket.emit("error", err)
		if(!results)
		return ack({
				status:200,
				message: "No group found",
			})

		if(results.invitee.some((invitee)=>{
			if(invitee.user_id.toString() == data.user_id ) return true;
		}))
		return ack({
				status:200,
				message: "Already inviteed",
			})

		results.invitee.push(new Invitee({user_id:data.user_id}))

		results.save((err, userData)=>{
			console.log(err);
			if(err) return socket.emit("error", err)

			if(client = users[data.user_id])
				client.join(data.room_id)

			if(typeof ack == 'function')
				ack({
					status:200,
					message: "Invitee successfully",
				})
		})
	})
}

exports.deleteGroup = function(data, ack){
	Group.remove({
		_id: data.room_id
	}, (err, done)=>{
		console.log(err)
		if(err) return socket.emit("error", err)
		if(typeof ack == 'function')
			ack({
				status:200,
				message: "Leave successfully",
			})
	})
}


exports.leaveGroup = function(data, ack){
	var socket = this
	Group.findById(data.room_id, (err, results)=>{
		if(err) return socket.emit("error", err)

		if(results.leader.toString() == socket.user._id){

			results.invitee.forEach(v=>{
				if(v.user_id.toString() == socket.user._id) return false
				if(client = users[v.user_id])
					client.emit("groupRemoved", {
						status:200,
	 				  data: {group_id: data.room_id},
						message: "Leave successfully",
					})
			})

			return exports.deleteGroup(data, ack)
		}

		var index =
			results.invitee.findIndex((invitee, index)=>{
				if(invitee.user_id.toString() == socket.user._id ) return true;
			})
			console.log(`index`, index);
		if(index>=0)
			results.invitee.splice(index,1)

		 index =
		results.coleader.findIndex((coleader, index)=>{
			if(coleader.toString() == socket.user._id ) return true;
		})
		console.log(`index`, index);
		if(index>=0)
			results.invitee.splice(index,1)
		results.save((err, results)=>{
			console.log(err);
			if(err) return socket.emit("error", err)

			// if(client = users[data.user_id])
			// 	client.join(data.room_id)

			if(typeof ack == 'function')
				ack({
					status:200,
					message: "Leave successfully",
				})
		})
	})
}


exports.unblockUser = function(data, ack) {
	const socket = this
	User.findByIdAndUpdate(socket.user._id,
		{
			$pull: {
				blockedUser: data.user_id
			}
		},
		{
			new: true,
		},
	(err, done)=>{
	if(err) return socket.emit("error", err)
		socket.user.blockedUser = done.blockedUser
		if(typeof ack == 'function')
			ack({
				status:200,
				data:{ user_id : data.user_id, isblocked: false },
				message: "user unblocked successfully "
			})
		// if(client = users[data.user_id])
		// 	client.emit("blockStatus", { user_id: socket.user._id, isBlocked })
	});
}



exports.blockedUserList = function(data, ack) {
	const socket = this
	User.populate(socket.user,[
		{
			path:'blockedUser',
			select:'name picture isArchive',
			// populate:{
			// 	path: 'lastCheckin',
			// 	select: 'status comments likes',
			// 	model:'Checkin'
			// },
			options: {
				sort:{name: 1},
			},
			// match:{
			// 	isArchive : false
			// }
		}],
	(err, results)=>{
		console.log(err);
		if(typeof ack == 'function')
			ack({
				status:200,
				data: results,
				message: "list found "
			})
	})
}



exports.blockUser = function(data, ack) {
	const socket = this
	User.findByIdAndUpdate(socket.user._id,
		{
			$addToSet: {
				blockedUser: data.user_id
			}
		},
		{
			new: true,
		},
	(err, done)=>{
	if(err) return socket.emit("error", err)
		socket.user.blockedUser = done.blockedUser
		console.log(socket.user.blockedUser);
		if(typeof ack == 'function')
			ack({
				status:200,
				data:{ user_id : data.user_id, isblocked: true },
				message: "user blocked successfully "
			})
	});
}

exports.leaveChatWindow = function(data, ack){
	const socket = this
	Group.findOneAndUpdate({
			_id: data.room_id,
			"invitee.user_id": socket.user._id
		},
		{
			$set:{
				"invitee.$.updated": new Date(),
			},
			"invitee.$.updated": new Date()
		},
		{
			new : true,
			upsert: false
	}, (err, done)=>{
		console.log(err);
		if(typeof ack == 'function')
			ack({
				status:200,
				message: "grt "
			})
	})
}



		// Group.findOneAndUpdate({
		// 		leader:"59ef2e8e2770d474f3c70424",
		// 		"invitee.user_id":"59ef2e8e2770d474f3c70424"
		// 	},
		// 	{
		// 		$pull:{
		// 				"invitee": { "user_id": ObjectId("59ef2e8e2770d474f3c70424")}
		// 		},
		// 	},
		// 	{
		// 		new : true,
		// 		upsert: false
		// 	},
		// (err, done)=>{
		// 	console.log(err,done);

		// })


exports.groupChatHistroy = function(data, ack){
	const socket = this
	socket.inWindow = data.user_id
	Group.findOneAndUpdate({
		$or:[{
				_id: data.room_id
			},
			{
				leader: socket.user.id
			},
			{
				coleader: socket.user.id
			}],
			"invitee.user_id": socket.user._id
		},
		{
			$set:{
				"invitee.$.updated": new Date(),
			},
			"invitee.$.updated": new Date()
		},
		{
			new : true,
			upsert: false
	})
	// .select('messages')
	.populate({
		path: 'messages.sender',
		select : 'name picture isArchive isPrivateAccount isPrivateAccountemployeeRole lastCheckin isArchive',
		model:'User',
		populate:{
			path: 'lastCheckin',
			select : 'status',
			model:'Checkin',
		}
	})
	.exec((err, result)=>{
		console.log(err);
	if(err) return socket.emit("error", err)
		// console.log(result)
	 if(!result)
		 return socket.emit("error",new Error("something went wrong"))

		result = result.toObject()
		result.messages.forEach(v=>{
			if(v.likes.some((w)=>{ if(w.toString()== socket.user._id.toString()) return true }))
				v.isLiked = true

			if(v.sender.userType == "Business") v.sender.employeeRole = "Owner"

		})

		var position = ""
		if(result.leader.toString() == socket.user._id)
			position = "leader"
		else if(result.coleader.toString() == socket.user._id)
			position = "coleader"

		if(typeof ack == 'function')
			ack({
				status:200,
				data:{ position:position, history:result.messages },
				message: "message found",
			})
	})

}

exports.newGroupMessage = function(data, ack){
	const socket = this
	data.sender = socket.user._id
	var message =  new Message(data)

	Group.findOneAndUpdate({
			_id:data.room_id,
			"invitee.user_id":socket.user._id
		},
		{
			$set:{
				lastMessage: message,
				"invitee.$.updated": new Date(),
			},
			"invitee.$.updated": new Date(),
			$push: { messages: message},
		},
		{
			new : true,
			upsert: false
		})
		.select('name picture isArchive isPrivateAccount isPrivateAccountisBusiness invitee lastMessage chatType')
		// .populate({
		// 	path: 'lastMessage.sender',
		// 	select : 'name picture',
		// 	model:'User',
		// })
	.lean()
	.exec((err, result)=>{
			console.log(err);
		if(err) return socket.emit("error", err)
		result.lastMessage.group_name = result.name
		result.lastMessage.group_picture = IMAGE_BASE + 'users/' + result.picture
		result.lastMessage.room_id = result._id
		result.lastMessage.sender = new UserShortInfo(socket.user)
		result.lastMessage.isBusiness = result.isBusiness

		if(typeof ack == 'function')
			ack({
				status:200,
				data:result.lastMessage,
				message: "message sent",
			})

		socket.broadcast.to(data.room_id).emit('newGroupMessage', {
				status:200,
				data:result.lastMessage,
				message: "new Group Message "
			});


			User.populate(result, [{
				path: 'invitee.user_id',
				select : 'deviceToken',
				model:'User',
				// match:{
				// 	isArchive:false
				// }
			}],(err, group)=>{
				console.log(err)
				var deviceTokens  = [];
				group.invitee.forEach(v=>{
					var client = users[v.user_id._id]
					if(!client || client.user.isBackground || client.user._id!=socket.user._id)
						deviceTokens.push(v.user_id.deviceToken)
					else
						return false
				})
					var msg = {
						title: socket.user.name+' @ '+result.name,
						body: data.message
					}
					var payload = {
						status:200,
						type:"groupChat",
						data:result.lastMessage,
						message: "message sent",
					}
					console.log(deviceTokens)
					// return 0;
					FX.apnSend({},msg , deviceTokens, payload)

			})
	})

}

exports.isBackground = function(data, ack){
	const socket = this
	socket.user.isBackground = data.isBackground;
	socket.user.online = !data.isBackground;
	console.log(socket.user.name);
	socket.user.followings.forEach((v)=>{
		if(friend = users[v]){
			friend.emit("friendsStatus", {
				status:200,
				data: new UserShortInfo(socket.user),
				message: `${socket.user.name} status`
			})
		}
	})

}


exports.chatHistroy = function(data, ack){
	const socket = this
	socket.inWindow = data.user_id
	Chat.findOneAndUpdate({
			$or:[{
				participant:[data.user_id,socket.user._id]
			},
			{
				_id:data.room_id
			},
			{
				participant:[socket.user._id,data.user_id]
			}],
		"messages.$.skip" :{ $ne : socket.user._id}
		},
	{
		 $set: {
			unseenCount:0,
			lastSeenBy:socket.user._id
			//messages.$.seen: 2
		 }
	},
	{
		new : true,
		upsert: false
	})
	.select('unseenCount messages')
	.populate({
		path: 'messages.sender',
		select : 'name picture isArchive',
		model:'User',
	})
	.exec((err, result)=>{
		console.log(err);
	if(err) return socket.emit("error", err)
		if(!result  ||  !result.messages)
			 result = { messages: [] }

		var	messages = result.messages
		// .filter(v=>{
		// 		console.log(v.get('skip'), socket.user._id);
		// 		if(v.get('skip') != socket.user._id.toString()) return true
		// 	})

		var friend = users[data.user_id]
		if(friend){
			socket.emit("friendsStatus", {
					status:200,
					data: new UserShortInfo(friend.user),
					message: `user status`
				})

			friend.emit("friendsStatus", {
					status:200,
					data: new UserShortInfo(socket.user),
					message: `user status`
				})
		}

		var isBlocked = false
		if(socket.user.blockedUser.some(v=>{
			if(v==data.user_id) return true
		}))	isBlocked = true

		if(typeof ack == 'function')
			ack({
				status:200,
				data:{ history: messages, isBlocked : isBlocked},
				message: "message found",
			})
	})

}

exports.chatList = function(data, ack){
	const socket = this
	socket.inWindow = ''
	Chat.find({
			participant:socket.user._id,
		})
		.sort({ "lastMessage.updated": -1,  })
		.select('participant unseenCount lastSeenBy messages updated lastMessage')
		.populate({
			path: 'participant',
			select : 'name picture isArchive',
			model:'User',
			options: { $sort: {"insensitiveName":1} },
			// match:{
			// 	isArchive : false
			// }
		})
		.exec((err, results)=>{
			console.log(err);
		if(err) return socket.emit("error", err)

			try{
				results = JSON.parse(JSON.stringify(results))
			}catch(e){
				console.log(e);
			}



			results.forEach(v=>{
			//	 if should not count his message
				if(v.lastSeenBy.toString()== socket.user._id)
					v.unseenCount = 0

				v.user = { isBlocked : false }
				v.room_id = v._id
				if(v.participant[0]._id.toString() == socket.user._id.toString()){
					var user_id = v.participant[1]._id
					v.user.user_id =  user_id
					if(socket.user.blockedUser.some(m=>{
						if(m.toString()==user_id) return true
					})) v.user.isBlocked = true
					v.user.name = v.participant[1].name
					// v.user.online = (users[user_id] && users[user_id].online) ? true :false
					v.user.picture = v.participant[1].picture
					v.user.isArchive = v.participant[1].isArchive
				}
				else {
					var user_id = v.participant[0]._id
					v.user.user_id =  user_id
					if(socket.user.blockedUser.some(m=>{
						if(m.toString()==user_id) return true
					})) v.user.isBlocked = true
					v.user.name = v.participant[0].name
					// v.user.online = (users[user_id] && users[user_id].online) ? true :false
					v.user.picture =  v.participant[0].picture
					v.user.isArchive =  v.participant[0].isArchive
				}

				if(v.user.isBlocked) v.unseenCount = 0
				for(i=v.messages.length-1; i>0; i--){
					var msg = v.messages[i]
					if(msg.skip  != socket.user._id.toString()) {
						v.lastMessage = msg
						break;
					}
				}
			delete v.messages
			delete v.participant
			delete v._id
			})

		if(typeof ack == 'function')
			ack({
				status:200,
				data:results,
				message: "message found",
			})

	})

}

exports.newMessage = function(data, ack){
	const socket = this
	data.sender = socket.user._id
		//	populate always fire extra query while here we only fire when receiver is offline
User.findById(data.receiver, (err, reqUser)=>{
	if(err)  return socket.emit("error", err)
	var isBlocked = false
	console.log(reqUser.blockedUser);
	console.log(`skip0`,data.skip)
	reqUser.blockedUser.some(v=>{
		if(v.toString() == socket.user._id.toString()) {
			isBlocked = true
			data.skip = socket.user._id
			return true
		}
	})
		console.log(`skip1`,data.skip)
	if(!isBlocked)
		socket.user.blockedUser.some(v=>{
			if(v.toString() == data.receiver) {
				isBlocked = true
				data.skip = data.receiver
				return true
			}
		})
		console.log(`skip2`,data.skip)
	// if(isBlocked) data.skip = data.receiver
	var message =  new Message(data)
	var updates = {
		$set:{
				lastMessage: message,
				lastSeenBy: socket.user._id,
				participant:[data.receiver,socket.user._id],
			},
		$push: { messages: message},
	}
	var receiver =  users[data.receiver]
	if(!receiver || receiver.inWindow!= data.sender.toString())
		updates["$inc"]  = {unseenCount:1}

	Chat.findOneAndUpdate(
		{
			$or:[{
					participant:[data.receiver,socket.user._id]
				},
				{
					participant:[socket.user._id,data.receiver]
				}]
		},
		updates,
		{
			new : true,
			upsert: true
		})
		.select('lastMessage')
		// .populate({
		// 	path: 'lastMessage.sender',
		// 	select : 'name picture',
		// 	model:'User',
		// })
		// .populate({
		// 	path: 'lastMessage.receiver',
		// 	select : 'name picture',
		// 	model:'User',
		// })
		.lean()
		.exec((err, result)=>{
			console.log(err);
		if(err) return socket.emit("error", err)


		if(!result.lastMessage) return socket.emit("error", err)
		result.lastMessage.sender = new UserShortInfo(socket.user)
		var msg = result.lastMessage

		if(typeof ack == 'function')
			ack({
				status:200,
				data:result.lastMessage,
				message: "message sent",
			})
		console.log(`skip3`,data.skip)
		var client = users[data.receiver]
		// console.log(client)
		if(isBlocked) {
			console.log('client not  blocked')
			return
		 // console.log(client.user.isBackground);
		}
		if(client && client.user.isBackground == false)
			return client.emit('newMessage', {
					status:200,
					data:result.lastMessage,
					message: "message sent",
				});

		var message = {
			title: socket.user.name,
			body: data.message
		}
		console.log("~~~~~~~~~~~~~~reqUser.deviceToken",reqUser.deviceToken)


		FX.apnSend(reqUser, message, [reqUser.deviceToken], {
			status:200,
			type:"chat",
			data:result.lastMessage,
			message: "message sent",
		})

	})
})

}


// Chat.findOne({
// 	$or:[
// 		{
// 			participant: { "$size" : 2, "$all":  [ "598c1040f8332c2a47a3e21d", "599c2f31052ce675159d0cb2" ] }
// 		}
// 	]
// },'lastMessage').populate({
//
// 	path:'lastMessage',
// 	model:'Chat'
// 	// populate:{
// 	// 	path: 'lastCheckin',
// 	// 	select: 'status',
// 	// 	model:'Checkin',
// 	// }
// 	}).exec((err, results)=>{
// 	console.log(err, results);
// })




exports.friendsStatus = function(data, ack){
	return
	const socket = this
	// PS: if only online user need to send then no need populate
	//	NOTE only followings status if you follow someone and he msg you then smg in chat history but you cann't get his online status unless he follow you
	User.findById(socket.user._id).populate({
		path:'followings',
		select:'name picture lastCheckin',
		populate:{
			path: 'lastCheckin',
			select: 'status',
			model:'Checkin',
		},
		options: {
			sort:{name: 1},
			// skip: 0,
			// limit:LPP
		}
	}).lean()
	.exec((err, updated)=>{
		if(err) return socket.emit("error", err)
		// update friends status
		socket.user = updated
		socket.user.online = true
		socket.user.followings.filter((v)=>{
			if(tmp = users[v._id]){
				console.log(`following ${v.name} sktid ${tmp ?tmp.id : false} `);
				 v.online = true
				//	send my[] status to friends
				tmp.emit("friendsStatus", new UserInfo(socket.user))
			}
			else
				console.warn(`${v.id + ' '+ v.name} is followings but not online `);
		})
		//	send friends[] status to me
		// socket.emit("friendsStatus",socket.user.followings)
		if(typeof ack == 'function')
		 ack({
			status:200,
			data:socket.user.followings,
			message: "Friends found",
		})
	})

}



exports.startTyping = function(data, ack){
	const socket = this
}

exports.stopTyping = function(data, ack){
	const socket = this

}
