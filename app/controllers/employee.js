var mongoose = require('mongoose');
const Employee = mongoose.model("Employee");
const User = mongoose.model("User");
const Group = mongoose.model("Group");
const Invitee = mongoose.model("Invitee");
var { EmployeeInfo } = require('../models/classes');


exports.addEmployee = function(req, res, next) {

	var postData = req.body;
	console.log("addEmployee called");

	postData.owner = req.user._id;
	postData.userType = 'Employee'

	FX.getUser(postData, (err, results)=>{
		if(err) return next(err);

		if(results)
			return next(new Error("Email Already Registered"));

		postData.isVerified = 1;

		FX.sendMail("customer_signup", 'Registration Successful', postData.email, postData, function(err, responseStatus) {

		console.log(err, responseStatus);

			FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
				if(err) return next(err);

				if(filename) postData.picture = filename
					var rand = randomString.generate({
						length: 6,
						charset: 'numeric'
					});

					postData.username =  postData.name.replace(/[^0-9a-z]/gi, '')+rand

				var employee = new Employee(postData);

				employee.save(function(err, employee) {
					if(err) return next(err);

					Group.findOneAndUpdate({
						// isBusiness:true,
						leader:req.user._id
					},
					{
						$push:{
							//	bouncer is also coleader of Group
							coleader: employee._id,
							invitee: new Invitee({user_id:employee._id})
						}
					},
					{
						new: true,
						upsert: false
					}
					,(err, results)=>{
						if(err) return next(err);

						return res.status(200).json({
							type: true,
							data:new EmployeeInfo(employee),
							message: DM.registered_successfully
						});
						
					})
				})
			})
		})
	})
}


exports.listEmployee = function(req, res, next) {

	console.log("listEmployee called");

	Employee.find({
		owner:req.user._id,
		// isArchive:false
	},
	'name username insensitiveName email employeeRole picture'
	)
	.sort({insensitiveName: 1})
	.exec((err, list) => {
		if(err)	return next(err);

		if(!list.length)
			list = []
		return res.status(200).json({
			type: true,
			data:list,
			message: DM.employee_found
		})


	})
}

exports.viewEmployee = function(req, res, next) {

	console.log("viewEmployee called");

	Employee.findById(req.params.id, (err, employee)=>{
		if(err) return next(err);

		if(!employee)
			return res.status(203).json({
				type: false,
				message: DM.employee_not_found
			})

		employeeData = new EmployeeInfo(employee);

		return res.status(200).json({
			type: true,
			data:employeeData,
			message: DM.employee_found
		})

	})
}

exports.deleteEmployee = function(req, res, next) {

	console.log("deleteEmployee",req.params.id);

	Employee.findById({
		"_id": req.params.id,
		"owner": req.user._id
	}, (err, employee) => {
		if(err)	return next(err);

		if(!employee)
			return res.status(203).json({
				type: false,
				message: DM.not_auth
			})
		// console.log(employee.owner,req.user._id );

		employee.remove((err, done)=>{
			if(err)	return next(err);

			return res.status(200).json({
				type: true,
				message: DM.employee_deleted
			})

		})

	})
}

exports.editEmployee = function(req, res, next) {

	var postData = req.body
	console.log("editEmployee called", postData);

	FX.uploadFile(req.files.picture, dir = 'users', thumb=false, (err, filename)=>{
		if(err) return next(err)
		if(filename) postData.picture  = filename

		User.findOne({email:postData.email}, (err, user)=>{
			if(err) return next(err)

			if(user && user._id.toString() != req.params.id )
				return res.status(203).json({
					type: true,
					message: DM.email_already_registered
				})

			delete postData.password
			Employee.findOneAndUpdate({
					owner: req.user._id,
					_id:req.params.id
				},{
					$set:postData
				},
				{
					new :true
				},
				(err, employee) => {
				if(err)	return next(err);
				if(!employee)
					return res.status(203).json({
						type: false,
						message: DM.not_auth
					})

				return res.status(200).json({
					type: true,
					data:employee,
					message: DM.employee_updated
				})
			})


		})
	})
}
