
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Article = new Schema({
	user: {
		    type: Schema.Types.ObjectId,
            ref: 'User'
          },
	title: String,
	content: String,
	comments: [{
                type: Schema.Types.ObjectId,
                ref: 'Comment'
	         }],
	address: String,
	loc: {
		    type: [Number],  // [<longitude>, <latitude>]
		    index: '2d'      // create the geospatial index
         },
	link: String,
	otherLinks: [String],
	photoPath: String,
	beach: Boolean,
	bike: Boolean,
	childFriendly: Boolean,
	mountain: Boolean,
	gastro: Boolean,
	created: Number
});


var Article = mongoose.model('Article', Article);

module.exports = Article;