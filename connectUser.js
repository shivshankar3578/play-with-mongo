
exports.connectUser = function(data, ack){
		var clientSocket = this
		console.log(Object.keys(clientSocket.sockets));
		var message = "User " + data.clientNickname + " was connected.";
		console.log(message);

		var userInfo = {};
		var foundUser = true;
		for (var i=0; i<userList.length; i++) {
			if (userList[i]["nickname"] == data.clientNickname) {
				userList[i]["isConnected"] = true
				userList[i]["id"] = clientSocket.id;
				userInfo = userList[i];
				foundUser = false;
				break;
			}
		}

		if (foundUser) {
			userInfo["id"] = clientSocket.id;
			userInfo["nickname"] = data;
			userInfo["isConnected"] = true
			userList.push(userInfo);
		}

		io.emit("userList", userList);
		io.emit("userConnectUpdate", userInfo)
}
