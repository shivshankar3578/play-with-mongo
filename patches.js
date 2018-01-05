//	change all db name to titleCase
const mongoose = require('mongoose')
const Business = mongoose.model('Business');
Business.find({}, (err, results)=>{
	// var S = require('string');
	(function loop(index){
		var doc = results[index]
		if(index == results.length) return ;
		doc.invitee,push(new Invitee({user_id:doc._id}))
		doc.save((err, done)=>{
			console.log(err);
			loop(++index)
		})
	})(0)
})
