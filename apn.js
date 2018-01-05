const apn = require('apn');
//	config apn
	// var options = {
	// 	token: {
	// 		key:  "/var/www/html/oott/dev/apn/key.pem",
	// 		cert: "/var/www/html/oott/dev/apn/cert.pem",
	// 		passphrase:"saurabh@123"
	// 		// keyId: "key-id",
	// 		// teamId: "developer-team-id"
	// 	},
	// 	production: false
	// };
var coptions = {
	cert: "/var/www/html/oott/build/apn/cert.pem",
	key: "/var/www/html/oott/build/apn/key.pem",
	production: true,
	passphrase:"saurabh@sharma"
};

cservice = new apn.connection(coptions);

cservice.on("connected", function() {
		console.log("Connected");
});

cservice.on("transmitted", function(notification, device) {
		console.log("Notification transmitted to:" + device.token.toString("hex"));
});

cservice.on("transmissionError", function(errCode, notification, device) {
		//console.error("Notification caused error: " + errCode + " for device ", device, notification);
		console.log("DEVICE TOKEN:" + JSON.stringify(device));
		if (errCode === 8) {
				console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
		}
});

cservice.on("timeout", function() {
		console.log("Connection Timeout");
});

cservice.on("disconnected", function() {
		console.log("Disconnected from APNS");
});

cservice.on("socketError", console.error);

module.exports = cservice
