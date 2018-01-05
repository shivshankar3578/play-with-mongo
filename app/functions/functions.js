var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
const apn = require('apn');
const EmailTemplate = require('email-templates').EmailTemplate;
const crypto = require('crypto');
const User = mongoose.model("User");

const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
		from: process.env.SMTP_FROM,
		host: process.env.SMTP_HOST, // hostname
		service: process.env.SMTP_SERVICE,
		auth: {
				user: process.env.SMTP_AUTH_USER,
				pass: process.env.SMTP_AUTH_PASS
		}
});


module.exports = {
	 uniqueArrayofObject: function( ar ) {
	  var j = {};

	  ar.forEach( function(v) {
	    j[v+ '::' + typeof v] = v;
	  });

	  return Object.keys(j).map(function(v){
	    return j[v];
	  });
	} ,
	apnSend: function(user, msg, deviceTokens, payload) {
		// console.log("apn called",deviceTokens);
		var note = new apn.notification();
		note.setAlertText(msg);
		// note.badge = user.badge?user.badge:0;
		note.sound = "default";
		note.payload = payload ? payload : {}
		cservice.pushNotification(note, deviceTokens);
	},
	getUser: function(postData, cb){

		var query = { $or: [] }

		if(postData.email)
			query["$or"].push({email:postData.email })

		if(postData.mobileNo)
			query["$or"].push({mobileNo: postData.mobileNo})

		if(postData.socialId)
			query["$or"].push({"facebookId":postData.socialId});

		console.log(query);

		User.findOne(query, (err, userData)=>{
			// console.log(userData);
			if(userData && userData.isArchive)
					err = new Error("Account associated with this email is removed. Please use a different email or contact to OOTT admin ")

			return cb(err, userData);
		});
	},
	getDistance : function(lat1,lon1,lat2,lon2) {
		lat1 = parseFloat(lat1)
		lat2 = parseFloat(lat2)
		lon1 = parseFloat(lon1)
		lon2 = parseFloat(lon2)
		function deg2rad(deg) {
		return deg * (Math.PI/180)
		}

		var R = 6371; // Radius of the earth in km
		var dLat = deg2rad(lat2-lat1);
		var dLon = deg2rad(lon2-lon1);
		var a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2)
			;
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		var d = R * c; // Distance in km
		return d;
	},


	crypto: function(text, type) {
		var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
		var key = 'password';

		if(type.toString() === 'encrypt') {
				var cipher = crypto.createCipher(algorithm, key);
				var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
				return encrypted;
		} else {
				var decipher = crypto.createDecipher(algorithm, key);
				var decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
				return decrypted;
		}
	},

	sendMail: function(template, subject, email, email_data,cb) {
		console.log("sendMail called");
		// return cb(1,1);
		var template = new EmailTemplate(path.join(__dirname, '../../templates/', template));
		// An example users object with formatted email function
		if(!template) return cb("template not found")
		var locals = {
				custom: email_data
		}
		locals.site_title = 'process.env.SITE_TITLE';
		locals.email_logo = 'process.env.LOGO_PATH';
		// Send a single email
		template.render(locals, (err, results)=>{
			if(err) return cb(err, null);
				transport.sendMail({
						from: process.env.FROM_MAIL,
						to: email,
						subject: subject,
						html: results.html,
						text: results.text
					}, function(err, responseStatus) {
						return cb(err, responseStatus);
				});
		});
	},

	// ***** test ffmpeg *****
	// mime = mime.lookup('fav.mp4');
	//   console.log(mime,mime.split('/')[0]);
	//   var proc = new ffmpeg('fav.mp4')
	//       .takeScreenshots({
	//         count: 1,
	//         timemarks: ['6'],
	//      }, '')
	//      .on('error', function(err) {
	//         console.log('an error happened: ' + err.message);
	//       })
	//      .on('filenames', function(filenames) {
	//       console.log(filenames);
	//    })

	createThumb: function(filename, label, cb){
		srcPath = path.join(UPLOAD_PATH, label, filename);
		dstPath = path.join(UPLOAD_PATH, label, 'thumb', filename);
		srcDir = path.join(UPLOAD_PATH, label);
		dstDir = path.join(UPLOAD_PATH, label, 'thumb');
		console.log(srcPath,'\n',dstPath);
		 var file_type = mime.lookup(path.join(uploadDir, label, filename));
		if(file_type.split('/')[0]=='image')
			 im.resize({
				 srcPath: srcPath,
				 dstPath: dstPath,
				 width:   256,
				 quality: 0.8
			 }, function(err, stdout, stderr){
				 console.log('thumbErr', err);
				 console.log('stdout:', stdout);
				 console.log('file uploadErr', stderr);
				 return cb(err, filename);
			 });
		 else if(file_type.split('/')[0]=='video')
				var proc = new ffmpeg(srcPath)
					 .takeScreenshots({
							count: 1,
							timemarks: ['6'],
					 }, dstDir)
					 .on('error', function(err) {
							console.log(err);
							return cb(err, null);
						})
					 .on('filenames', function(ts) {
							console.log('video thumb successfully',ts);
							ts = ts.toString();
							thumbName = filename.split('.')[0]+'.png';
							setTimeout(function(){
								 fs.renameSync(path.join(dstDir,'tn.png' ), path.join(dstDir, thumbName));
								 return cb(null, filename);
							}, 2000 )
					 })
		 else
				return cb("Not a valid File", filename);
	},

	// uploadFileBase64 : function(data, file_type, label, cb){
	//   console.log("uploadFileBase64 called");
	//   if(!data)  return cb(null, null);
	//    var filename =  require('uuid/v1')()+'.'+file_type;
	//     target = path.join(UPLOAD_PATH, label, filename);
	//     fs.writeFile(target, new Buffer(data, "base64"), function (err) {
	//       console.log('uploadErr:', err);
	//       if(err) return cb(err, null)
	//       createThumb(filename, label, (err, done)=>{
	//         if(err) console.log('err while thumb');
	//         return cb(err, filename)
	//       })
	//     });
	// },



	uploadFile: function(file, label, thumb, cb){
		 console.log("uploadFile called", file);
		 if(!file || !label)  return cb(null, null);
		 var source = file.path;
		 var filename = randomString.generate() +file.name.substr( file.name.lastIndexOf('.'), file.name.length);
		 target = path.join( UPLOAD_PATH, label, filename);
		 fs.readFile(source, function (err, data) {
				console.log(err);
				if(err) return cb(err, null)
				fs.writeFile(target, data, function (err) {
					 console.log(err);
					 if(err) return cb(err, null)
					 if(thumb)
						 createThumb(filename, label, (err, done)=>{
							 console.log(err);
							 return cb(err, filename)
						 })
					 return cb(null, filename);
					});
		 });
	}


};
