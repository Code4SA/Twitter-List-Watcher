module.exports = {
	twitter: {
		consumer_key:         '', // Get from https://apps.twitter.com/
		consumer_secret:      '', 
		access_token:         '', 
		access_token_secret:  '',

		count: 200,
		interval: 120, //Seconds

		lists: [
			{ 
				slug: "sa-journos-who-tweet", owner_screen_name: "rayjoe" 
			},
			{
				slug: "a-brave-new-world", owner_screen_name: "rayjoe"
			},
		],
	},
	mongodb: {
		connect_string: "mongodb://localhost/agendasetter",
	},
}