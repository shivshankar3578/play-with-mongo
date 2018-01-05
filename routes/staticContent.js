var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const StaticPage = mongoose.model("StaticPage");
// var { BusinessInfo } = require('../models/classes');
/* GET users listing. */
router.all('/termsOfService', function(req, res, next) {

	StaticPage.findOne({slug: 'termsOfService'},  (err, result)=>{
		if(err) return next(err)

		if(!result)
			result = { description: "this is a demo termsOfService" }
		res.locals.termsOfService = result.description;
		res.send(`<html><body>${result.description}</body></html>`)

  	// return res.render('staticContent/termsOfService');
	})

});
	
router.all('/privacyPolicies', function(req, res, next) {

	StaticPage.findOne({'slug': 'privacyPolicies'}, (err, result)=>{
		if(err) return next(err)
		// console.log("privacyPolicies", result);
		if(!result)
			result = { description: "this is a demo privacyPolicies" }
		res.locals.privacyPolicies = result.description;
		res.send(`<html><body>${result.description}</body></html>`)
		// return res.render('staticContent/privacyPolicies');
	})

});

module.exports = router;
