const mongoose = require('mongoose');
const User = mongoose.model("User");
const Group = mongoose.model("Group");
const { users, serverErr } = require('./shared');
const {UserInfo} =require('../app/models/classes');

module.exports = function(socket, next) {
		// console.log(next.toString());
	console.log("middleware:",socket.handshake.query);

	var ssid = socket.handshake.query.ssid;
	if(!ssid)
		return  next(new Error("pls send ssid"));

	User.sidAuthentication(ssid, (err, user)=>{
		console.log(err);
		if(err)
			return next(new Error(serverErr))

		if(!user)
			return next(new Error("Invalid user"))

		// if(socket.handshake.query.access_token != user.access_token)
		// 	return next(new Error("Invalid access token"))

		//	disconnect old socket
		var oldSocket = users[user._id]
		if(oldSocket && oldSocket._id == socket._id ){
			console.warn("duplicate socket disconnected", user._id);
			oldSocket.emit("sessionExpired", {
					status:400,
					message:"Your session expired"
				})
			// users[user._id].disconnect()
		}
		user.connected = true
		user.user_id = user._id.toString()

		socket.user = user
		Group.find({
			"invitee.user_id":user.user_id
		}, (err, results)=>{
			if(err) return next(err)
			// console.log(results);
			results.forEach(v=>{
				socket.join(v._id);
			})
			users[user.user_id] = socket
			// console.log(socket.emit.toString);
			next();
		})
	})
}
