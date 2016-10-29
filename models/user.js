
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
	facebookId: String,
	username: String,
	password: String,
	email: String,
	autoDescription: String,
	photo: String,
	ownArticles: [{
                    type: Schema.Types.ObjectId,
                    ref: 'Article'
	             }],
	favoriteArticles: [{
                          type: Schema.Types.ObjectId,
                          ref: 'Article'
	                   }],
	favoriteUsers: [{
                          type: Schema.Types.ObjectId,
                          ref: 'User'
	                   }],
	created: Number

});

User.plugin(passportLocalMongoose);

var User = mongoose.model('User', User);

module.exports = User;