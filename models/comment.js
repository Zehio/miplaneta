
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Comment = new Schema({
	user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
	      },
	info: String
});

var Comment = mongoose.model('Comment', Comment);

module.exports = Comment;