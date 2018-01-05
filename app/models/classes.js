var url = require("url");
exports.UserShortInfo =  class {
	constructor(data) {
		this.user_id = data._id;
		this.name = data.isArchive ? "OOTT User" : data.name;
		this.picture = data.isArchive ? "user.png" : data.picture
		this.online = data.online? data.online: false
		if(data.userType == "Business")
			this.employeeRole = "Owner"
		else this.employeeRole = data.employeeRole
		this.lastCheckin = data.lastCheckin
	}
}

exports.GroupShortInfo =  class {
	constructor(data) {
		this._id = data._id;
		this.room_id = data._id;
		this.name = data.name;
		this.picture = data.picture
	}
}


exports.UserInfo =  class {
	constructor(data) {
		this.user_id = data._id;
		this._id = data._id;
		this.name = data.isArchive  ? "OOTT User": data.name;
		this.isArchive = data.isArchive;
		this.username =  data.isArchive ? "OOTT User" :data.username;
		this.description =  data.description;
		this.isNotify = data.isNotify;
		this.email =  data.email;
		this.mobileNo =  data.mobileNo;
		this.userType = data.userType
			try {
				console.log("###", data.picture);
				var host = url.parse(data.picture).hostname.toString()
				this.picture = data.picture
			} catch (e) {
				console.log("no a valid picture url");
				this.picture = IMAGE_BASE + 'users/' + data.picture
			}
		this.picture = data.isArchive  ? IMAGE_BASE + 'users/user.png' : this.picture
		this.sourceType = data.sourceType
		this.birthdate = data.birthdate
		this.gender = data.gender ? data.gender : "Not Specified"
		this.facebookId =  data.socialId;
		this.isPrivateAccount =  data.isPrivateAccount;
		if(data.userType=='Business') this.isProfileDone =  data.isProfileDone;
		if(data.userType=='Employee') this.employeeRole =  data.employeeRole;
	}
	set setSID(d){
		this.sid =  FX.crypto(data.user_id.toString(), 'encrypt').toString();
	}
}


exports.EmployeeInfo =  class {
	constructor(data) {
		this.employee_id = data._id;
		this.name = data.name;
		this.userType = data.userType
		this.username =  data.username;
		this.employeeRole =  data.employeeRole;
		this.picture = data.picture
	}
}

exports.EventInfo =  class {
	constructor(data) {
		this.event_id = data._id;
		this.title = data.title;
		this.description =  data.description;
		this.start = data.start
		this.end = data.end
	}
}

var OpenTill = class {
	constructor(data) {
		this.Monday = "";
		this.Tuesday =  "";
		// this.Wednesday = "10.00 AM - 8.00 PM"
		this.Wednesday = ""
		this.Thursday = ""
		this.Friday = ""
		this.Saturday = ""
		this.Sunday = "";
	}
}

exports.OpenTill = OpenTill

exports.BusinessInfo =  class  {
	constructor(data) {
		this.busines_id = data._id;
		this.name = data.name;
		this.coverPicture = data.coverPicture;
		this.picture = data.picture;
		//	feedback change
		this.status = data.status;
		this.attended = data.attended;
		this.waitingTime = data.waitingTime?data.waitingTime:0;
		//	End feedback change
		this.scene =  data.scene;
		this.location =  data.location;
		this.latitude =  data.geoLocation[1];
		this.longitude =  data.geoLocation[0];
		this.info =  data.info;
		this.about =  data.about;
		this.countryCode =  data.countryCode;
		try {
			 this.open = JSON.parse(data.open)
		} catch (e) {
		 this.open = new OpenTill()
		}
		this.dressCode =  data.dressCode;
		this.charges =  data.charges;
		this.occupancy =  data.occupancy;
		this.menuImages =  data.menuImages;
		this.businessImages =  data.businessImages;
		this.contact = data.contact;
		this.isProfileDone =  data.isProfileDone;
		this.vipCount =  data.vip ? data.vip.length : 0 ;
	}
}
