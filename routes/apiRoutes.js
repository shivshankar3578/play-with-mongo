var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
const User = mongoose.model("User");
var ctrl = {},
    ctrl_path = process.cwd() + '/app/controllers'
		// console.log(__dirname);
fs.readdirSync(ctrl_path).forEach(function(file) {
    if(file.indexOf('.js') != -1) {
        ctrl[file.split('.')[0]] = require(ctrl_path + '/' + file)
    }
})

// router.get("/:slug",auth, ctrl.user.staticContent)
router.post("/checkUser",auth, ctrl.user.checkUser)
router.post("/sendOtp",auth, ctrl.user.sendOtp)
router.post("/register", auth, ctrl.user.createUser)
router.post("/login", auth, ctrl.user.loginUser)
router.post("/socialLogin",auth, ctrl.user.socialLogin)
router.post("/socialRegister",auth, ctrl.user.socialRegister)
router.post("/changePassword/:sid",auth, ctrl.user.changePassword)
router.post("/forgotPassword", ctrl.user.forgotPassword)
router.get("/deleteAccout/:sid", auth, ctrl.user.deleteAccout)
router.post("/editProfile/:sid", auth, ctrl.user.editProfile)
router.get("/viewUser/:sid/:id", auth, ctrl.user.viewUser)
// router.get("/myProfile/:sid/:id", auth, ctrl.user.myProfile)
// router.get("/notifSetting/:sid", auth, ctrl.user.notifSetting)

		//	sub account routes
router.post("/createSubAccount/:sid", auth, ctrl.user.addSubAccount)
router.post("/addSubAccount/:sid", auth, ctrl.user.addSubAccount)
router.post("/removeSubAccount/:sid", auth, ctrl.user.removeSubAccount)
router.get("/logout/:sid", auth, ctrl.user.logoutUser)

		//	busines routes
router.get("/getScene/:name", ctrl.business.getScene)
router.post("/createProfile/:sid", auth, ctrl.business.createProfile)
router.get("/viewBusiness/:sid/:id", auth, ctrl.business.viewBusiness)
router.get("/insights/:sid/:id", auth, ctrl.business.insights)
router.get("/friendsOnBusiness/:sid/:id", auth, ctrl.business.friendsOnBusiness)
router.get("/businessLikes/:sid/:id", auth, ctrl.activity.businessLikes)
router.post("/getBusiness/:sid/", auth, ctrl.business.getBusiness)
router.post("/addBusinessImage/:sid", auth, ctrl.business.addBusinessImage)
router.post("/addMenuImage/:sid", auth, ctrl.business.addMenuImage)
router.get("/removeMenuImage/:sid/:id", auth, ctrl.business.removeMenuImage)
router.get("/removeBusinessImage/:sid/:id", auth, ctrl.business.removeBusinessImage)
router.get("/userRoles/", (req,res)=>{
	return res.status(200).json({ type: true, data: [{"_id": 123, "name":"Manager"}, { "_id":321, "name":"Bouncer" }], message: "Roles found"  });
});
router.post("/updateStatus/:sid", auth, ctrl.business.updateStatus)
router.get("/currentStatus/:sid", auth, ctrl.business.currentStatus)
router.get("/favouriteBusinessList/:sid/:id", auth, ctrl.business.favouriteBusinessList)

		//	event routes
router.post("/addEvent/:sid", auth, ctrl.event.addEvent)
router.post("/editEvent/:sid/:id", auth, ctrl.event.editEvent)
router.get("/currentEvent/:sid", auth, ctrl.event.currentEvent)
router.get("/listEvent/:sid/:id", auth, ctrl.event.listEvent)
router.get("/upcommingEvent/:sid", auth, ctrl.event.upcommingEvent)
router.get("/deleteEvent/:sid/:id", auth, ctrl.event.deleteEvent)
router.get("/eventAttendee/:sid/:id", auth, ctrl.event.eventAttendee)
router.get("/myBusinessGroup/:sid", auth, ctrl.event.myBusinessGroup)

		//	employee routes

router.post("/addEmployee/:sid", auth, ctrl.employee.addEmployee)
router.post("/editEmployee/:sid/:id", auth, ctrl.employee.editEmployee)
router.get("/listEmployee/:sid", auth, ctrl.employee.listEmployee)
router.get("/viewEmployee/:sid/:id", auth, ctrl.employee.viewEmployee)
router.get("/deleteEmployee/:sid/:id", auth, ctrl.employee.deleteEmployee)

		//	connect

router.get("/blockUser/:sid/:id", auth, ctrl.connect.blockUser)
router.get("/peopleOnGroup/:sid/:id", auth, ctrl.connect.peopleOnGroup)
router.get("/unblockUser/:sid/:id", auth, ctrl.connect.unblockUser)
router.get("/moveMeter/:sid/:id", auth, ctrl.connect.moveMeter)
router.get("/blockedUserList/:sid", auth, ctrl.connect.blockedUserList)
router.post("/myGroups/:sid", auth, ctrl.connect.myGroups)
router.post("/createGroup/:sid", auth, ctrl.connect.createGroup)
router.post("/groupmove/:sid", auth, ctrl.connect.groupmove)
router.post("/inviteToGroup/:sid", auth, ctrl.connect.inviteToGroup)
router.post("/acceptInvitation/:sid", auth, ctrl.activity.acceptInvitation)
router.post("/updateGroup/:sid/:id", auth, ctrl.connect.updateGroup)
router.get("/viewGroup/:sid/:id", auth, ctrl.connect.viewGroup)


		//	checkin
router.get("/checkinLike/:sid/:id", auth, ctrl.activity.checkinLike)
router.get("/checkinCommentLike/:sid/:id/:comment_id", auth, ctrl.activity.checkinCommentLike)
router.get("/checkinCommentUnlike/:sid/:id/:comment_id", auth, ctrl.activity.checkinCommentUnlike)
router.get("/checkinUnlike/:sid/:id", auth, ctrl.activity.checkinUnlike)
router.post("/commentOnCheckin/:sid/:id", auth, ctrl.activity.commentOnCheckin)
router.get("/checkinCommentList/:sid/:id", auth, ctrl.activity.checkinCommentList)

	//	move
// router.get("/moveLike/:sid/:id", auth, ctrl.activity.moveLike)
// router.get("/moveUnlike/:sid/:id", auth, ctrl.activity.moveUnlike)
// router.post("/commentOnmove/:sid/:id", auth, ctrl.activity.commentOnMove)
// router.get("/moveCommentList/:sid/:id", auth, ctrl.activity.moveCommentList)


router.get("/myActivityList/:sid", auth, ctrl.activity.myActivityList)
router.get("/followingsActivityList/:sid", auth, ctrl.activity.followingsActivityList)


router.get("/followingsList/:sid/:id?", auth, ctrl.activity.followingsList)
router.get("/followersList/:sid/:id?", auth, ctrl.activity.followersList)
router.get("/suggestiveFriends/:sid", auth, ctrl.activity.suggestiveFriends)
router.get("/follow/:sid/:id", auth,
	(req, res, next )=>{
		User.findById(req.params.id, (err, user)=>{
			if(err) return next(err)
				req.toUser = user
			if(user.isPrivateAccount) 
				ctrl.activity.followPrivate(req, res, next)
			else
				ctrl.activity.follow(req, res, next)
		})
	})

router.get("/acceptFollowReq/:sid/:id", auth, ctrl.activity.acceptFollowReq)
router.get("/declineFollowReq/:sid/:id", auth, ctrl.activity.declineFollowReq)
router.get("/unfollow/:sid/:id", auth, ctrl.activity.unfollow)
router.get("/like/:sid/:id", auth, ctrl.activity.like)
router.get("/unlike/:sid/:id", auth, ctrl.activity.unlike)
router.get("/move/:sid/:id", auth, ctrl.activity.move)
router.get("/closeMoveRequest/:sid/:id", auth, ctrl.activity.closeMoveRequest)

module.exports = router;

function auth(req, res, next) {

	var postData = req.body?req.body: {};
	console.log("auth stage called");

	if(!req.files) req.files = {}
		postData.osType = req.headers.os? req.headers.os: "android";

	if(postData.email)
		postData.email = postData.email.toLowerCase();

	if(s=postData.userType)
		postData.userType = s.charAt(0).toUpperCase() + s.slice(1);
	
	if(postData.name)
		req.body.insensitiveName = postData.name.toLowerCase()

	if(postData.latitude && parseInt(postData.latitude)==0)
		return next(new Error("GPS location is not valid"))
	
	if(postData.longitude && parseInt(postData.longitude)==0)
		return next(new Error("GPS location is not valid"))

	if(postData.username)
		postData.username = postData.username.toLowerCase();
	var sid = req.params.sid? req.params.sid : req.headers.sid ;

	console.log("sid",sid);

	if(!sid)
		return next();
	else
		User.sidAuthentication(sid, (err, user)=>{
			if(err) return next(err);

			req.user = user;
			if(user.isArchive) 
				return next(new Error("this account is deleted"))
				next();
		})
}
