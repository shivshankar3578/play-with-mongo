var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	var ObjectId = mongoose.Types.ObjectId;
	var sceneSchema = new Schema({
			name: {
				type: String,
				required: true
			},
			active:{
				type:Boolean,
				default:true
			},
			isArchive:{
				type:Boolean,
				default:false
			}},
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

	module.exports = mongoose.model('Scene', sceneSchema)
