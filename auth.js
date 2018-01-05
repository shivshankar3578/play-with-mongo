export = function(req, res, next) {

	var ssid = req.headers.ssid;
	if(!ssid)
		return  next(new Error("pls provide ssid"));

	try{
		var user_id = FX.crypto(ssid.toString(), 'decrypt');
	}catch(e){
		return next(new Error("wrong ssid"))
	}

	console.log("before welcome ", user_id);

	User.findOne({
		where:{ id: user_id }
	})
	.then((user)=>{
		if(!user)
			return next(new Error("Invalid user"))

		user=	user.get({ plain: true})
		// if(req.headers.access_token != userData.access_token)
		// 	return next(new Error("Invalid access token"))
		user.ssid = ssid
		req.user = user
		next()
	})
	.catch((err)=> {
				return next(err);
	});

}
