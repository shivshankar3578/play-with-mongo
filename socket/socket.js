const app = require('../app');
// const restart_patches = require('./restart_patches');
const events = require('events');
const util = require('util');
const { users, serverErr } = require('./shared');
const {UserInfo,
	UserShortInfo,
	MissionInfo
	} = require('../app/models/classes');

const chatEvents = require('./chatEvents');
const checkinEvents = require('./checkinEvents');
// const groupchatEvents = require('./groupchatEvents');

module.exports = function(io){

	io.use(require('socketio-wildcard')());

	io.use(require('./middleware'));

	io.on('connection', (socket)=>{
		console.log("connection done", socket.id, socket.user.id);
		// var ioRoom = io.sockets.adapter.rooms;
		// assert.equal(socket, this)
		socket.user.online = true
		socket.user.isBackground = false
		socket.user.followings.forEach((v)=>{
			if(friend = users[v]){
				console.log(`tell ${friend.user.name} you are online`);
				friend.emit("friendsStatus", {
					status:200,
					data: new UserShortInfo(socket.user),
					message: `${socket.user.name} is online`
				})
			}
		})
		
		socket.on("*", (packet)=>{
			// return socket.emit("error", new Error(serverErr));
			// packet.data ['event_name', 'postData', [func]]
			// dynamic msg event listing
			console.info(" ***** Event calling *****");
			if(packet.data[0]!="checkin")
				console.dir({
					listing:packet.data[0],
					postData : packet.data[1],
					socket: socket.id,
					user: socket.user._id
				});
		})

		socket.on("doDisconnect", (data, ack)=>{
			socket.disconnect(JSON.stringify({"a":1}))
		});
		socket.on("checkin", checkinEvents.checkin );
		socket.on("friendsStatus",chatEvents.friendsStatus );
		socket.on("chatHistroy", chatEvents.chatHistroy)
		socket.on("isBackground", chatEvents.isBackground)
		socket.on("startTyping", chatEvents.startTyping)
		socket.on("stopTyping", chatEvents.stopTyping)
		socket.on("newMessage", chatEvents.newMessage)
		socket.on("chatList", chatEvents.chatList)
		socket.on("leaveChat", chatEvents.leaveChat)
		socket.on("groupChatHistroy", chatEvents.groupChatHistroy)
		socket.on("newGroupMessage", chatEvents.newGroupMessage)
		socket.on("leaveChatWindow", chatEvents.leaveChatWindow)
		socket.on("groupList", chatEvents.groupList)
		socket.on("blockUser", chatEvents.blockUser)
		socket.on("unblockUser", chatEvents.unblockUser)
		socket.on("blockedUserList", chatEvents.blockedUserList)

		socket.on("invite2group", chatEvents.invite2group)
		socket.on("leaveGroup", chatEvents.leaveGroup)
		socket.on("messageLike", chatEvents.messageLike)

		socket.on("disconnect", ()=>{

			socket.user.online = false
			socket.user.isBackground = true
			socket.inWindow = ''
			socket.user.followings.forEach((v)=>{
				console.log(v);
				if(friend = users[v]){
					console.log(`tell ${friend.user.name} you are leaving chat`);
					friend.emit("friendsStatus", {
						status:200,
						data: new UserShortInfo(socket.user),
						message: `${socket.user.name} goes offline`
					})
				}
			})
			delete(users[socket.id])
			console.dir({
				"after disconnect ": Object.keys(users)
			});
		})

		socket.on("error", (err)=>{
			console.error("server err", err);
			socket.emit("stdErr", serverErr)
		})

	});
}
