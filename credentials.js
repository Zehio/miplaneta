
module.exports = {
	cookieSecret: 'your cookie secret goes here',
	mongo: {
		development: {
		connectionString: 'mongodb://sergiator:wetdog80@ds011462.mlab.com:11462/sim',
		},
		production: {
		connectionString: 'your_production_connection_string',
		},
	},
	authProviders: {
		facebook: {
			development: {
				appId: '1325481584133697',
				appSecret: '9297085b02e0bf915ca6f252b334d6fd',
			},
		},
    },
};

