var mongoose = require('mongoose');
const Event = mongoose.model("Event");
const Group = mongoose.model("Group");
var {EventInfo, BusinessInfo, UserInfo } = require('../models/classes');

//
// if(events.length)
// 	if( new Date().getTime() > new Date(events[0].end).getTime())
// 		return res.status(203).json({
// 			type: false,
// 			message: "Event is Already completed "
// 		});
// 	else if(new Date(events[0].start).getTime()> new Date().getTime())
// 		return res.status(203).json({
// 			type: false,
// 			message: "Already there is an Event at this period of time "
// 		});

exports.deleteEvent = function(req, res, next) {

	console.log("delete event",req.params.id);

	Event.findOne({
		"_id": req.params.id,
		"business": req.user._id
	}, (err, event)=>{
		if(err)	return next(err);

		if(!event)
			return res.status(203).json({
				type: false,
				message: DM.not_auth
			})

		var now = new Date().getTime()
		if(new Date(event.start).getTime()< now  < new Date(event.end).getTime())
			return res.status(203).json({
				type: false,
				message: "current event not allow to delete"
			});

		event.remove((err, done)=>{
			if(err)	return next(err);

			return res.status(200).json({
				type: true,
				message: DM.event_deleted
			})

		})

	})
}

exports.myBusinessGroup = function(req, res, next) {
	console.log("myBusinessGroup called");

	// var group = {
	// 	group_id: req.user._id,
	// 	name: req.user.name,
	// 	attendee:req.user.attended,
	// 	status : req.user.status,
	// 	picture: req.user.picture
	// }
	Group.findOne({
		$or:[{
				leader:req.user._id
			}]
	})
	.select('name picture invitee leader')
	.exec((err, group)=>{
		if(!group)
			return res.status(203).json({
				type: false,
				message: "Group not Found"
			})
		group = group.toObject()
		group.group_id = group._id
		group.status = req.user.status
		group.attendee = group.invitee.length
		delete group.invitee
		return res.status(200).json({
			type: true,
			data:group,
			message: "Group Found"
		})
	})
}

exports.currentEvent = function(req, res, next) {

	// current event
	var postData = req.body
	console.log("currentEvent called", postData);

	Event.findOne({
		start: {
			$lte: new Date()
		},
		end: {
			 $gte: new Date()
		},
		$or:[{
			business : req.user.owner},
			{business:req.user._id
		}]
	}, 'status waitingTime attended', (err,event)=>{
		if(err) return next(err);

		if(!event)
			return res.status(203).json({
				type: false,
				message: "No Event Found"
			})

		return res.status(200).json({type: true, data:event,  message: "Event Found" })

	})

}



exports.editEvent = function(req, res, next) {

	var postData = req.body
	console.log("editEvent called", postData);
	Event.findOne({
		$or: [{
				 $and:[
					{start: {$lte: postData.start }},
					{end: {$gte: postData.start }}
					]
			},
			{
				$and:[
					{start: {$lte: postData.end }},
					{end: {$gte: postData.end }}
				 ]
		 }],
		_id: {
			$ne:req.params.id
		},
		business:req.user._id
	},
	(err,eventFound)=>{
		if(err) return next(err)
		console.log(eventFound);

		if(eventFound)
			return res.status(203).json({
				type: false,
				message: "Already have Event at this period of time "
			});


		Event.findOneAndUpdate(
			{
				business: req.user._id,
				_id:req.params.id
			},
			{
				$set: postData
			},
			{
				new: true
			},
		(err, event)=>{
			if(err)	return next(err);

			if(!event) return res.status(200).json({
				type: true,
				message: DM.not_auth
			})

			event = new EventInfo(event)

			return res.status(200).json({
				type: true,
				data:event,
				message: DM.event_updated
			})

		})
	})
}

exports.addEvent = function(req, res, next) {

	var postData = req.body
	console.log("addEvent called");
	postData.business = req.user._id;
	Event.findOne({
		$or: [{
				 $and:[
					{start: {$lte: postData.start }},
					{end: {$gte: postData.start }}
					]
			},
			{
				$and:[
					{start: {$lte: postData.end }},
					{end: {$gte: postData.end }}
				 ]
		 }],
		business:req.user._id
	}, (err,eventFound)=>{
		if(err) return next(err)

		if(eventFound)
			return res.status(203).json({
				type: false,
				message: "Already have Event at this period of time "
			});

		event = new Event(postData);

		event.save((err, event)=>{
			if(err)	return next(err);

			return res.status(200).json({
				type: true,
				data:event,
				message: DM.event_added
			})

		})
	})
}



exports.eventAttendee = function(req, res, next) {

	console.log("eventAttendee called",req.params.id);
	Event.findById(req.params.id)
		.populate({
			path: 'attendee',
			select: '_id name picture isArchive',
			match:{
				// isArchive:false
			}
		})
		.exec((err, list) => {
		if(err)	return next(err);

		if(list)
			return res.status(203).json({
				type: false,
				message: DM.event_not_found
			})

		if(!list.attendee.length)
			return res.status(203).json({
				type: false,
				message: DM.no_result_found
			})

		return res.status(200).json({
			type: true,
			data:list.attendee,
			message: DM.list_found
		})

	})
}



exports.upcommingEvent = function(req, res, next) {

	console.log("upcommingEvent called");
	Event.find({
		business: req.user._id,
		start: {
			$gte: new Date()
		}
	})
		// .populate({
		// 	path: 'attendee',
		// 	select: '_id name picture'
		// })
	.sort({start: 1}) // upcomming event first
	.exec((err, list) => {
		if(err)	return next(err);

		//	check array length
		if(!list || !list.length) list = []

		return res.status(200).json({
			type: true,
			data:list,
			message: DM.event_found
		})

	})
}



// exports.myBusinessGroup = function(req, res, next) {
//
// 	// for business app event screen group detail
// 	console.log("myBusinessGroup called");
// 	Event.findOne({
// 		start: {
// 			$lte: new Date()
// 		},
// 		end: {
// 			$gte: new Date()
// 		},
// 		$or:[{
// 				business : req.user.owner
// 			},
// 			{
// 				business:req.user._id
// 			}]
// 	},
// 	'status', (err,event)=>{
// 		if(err) return next(err);
//
// 		var group = {
// 			group_id: req.user._id,
// 			name: req.user.name,
// 			attendee:"0",
// 			status : event? event.status:'',
// 			picture: req.user.picture
// 		}
//
// 		if(event)
// 			group.stauts = event.stauts
// 		else
// 			group.status = ""
//
// 		return res.status(200).json({
// 			type: true,
// 			data:group,
// 			message: "Group Found"
// 		})
//
// 	})
// }


exports.listEvent = function(req, res, next) {

	console.log("listEvent called");

	Event.find({
			business:req.params.id,
	})
	.sort({
		start: -1
	})
	.exec((err, list) => {
		if(err)	return next(err);

		//	check array length
		if(!list.length) list = []

		return res.status(200).json({
			type: true,
			data:list,
			message: DM.event_found
		})

	})
}
