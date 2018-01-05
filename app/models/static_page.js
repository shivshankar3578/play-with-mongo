var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;

	var staticPageSchema = new Schema({
		title: {
			type: String,
			required: true
		},
		slug: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		}
	},
	{
		timestamps: {
		createdAt: 'created',
		updatedAt: 'updated'
		},
		id: false,
		toJSON: {
			getters: true,
			virtuals: true
		},
		toObject: {
			getters: true,
			virtuals: true
		}
	});

module.exports =  mongoose.model('StaticPage', staticPageSchema, 'static_pages')
