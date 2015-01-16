var Twit = require('twit')
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('./config');

mongoose.connect(config.mongodb.connect_string);

var Tweet = mongoose.model('Tweet', 
	{ 
		tweet: String,
		id: String,
		created_at: Date,
		text: String,
		source: String,
		user_id: Schema.Types.ObjectId,
		retweet_count: Number,
		favorite_count: Number,
		retweeted_status: Schema.Types.Mixed,
		user: Schema.Types.Mixed,
		list_slug: String,
		list_owner_screen_name: String,
	}
);

var Tweeter = mongoose.model('Tweeter', 
	{
		name: String,
		id: String,
		screen_name: String,
		location: String,
		description: String,
		followers_count: Number,
		friends_count: Number,
		listed_count: Number,
		favourites_count: Number,
		created_at: Date,
		profile_image_url: String,
	}
);

// var kitty = new Cat({ name: 'Zildjian' });
// kitty.save(function (err) {
//   if (err) // ...
//   console.log('meow');
// });

var T = new Twit({
	consumer_key:         config.twitter.consumer_key,
	consumer_secret:      config.twitter.consumer_secret,
	access_token:         config.twitter.access_token,
	access_token_secret:  config.twitter.access_token_secret,
});

var get_list = function(slug, owner_screen_name) {

	var remove_inc = function(o) {
		if (o["$inc"]) {
			delete o["$inc"];
		}
	}

	T.get('lists/statuses', { slug: slug, owner_screen_name: owner_screen_name, count: config.twitter.count }, function(err, tweets, response) {
		var top_tweet = { retweet_count: 0 };
		tweets.forEach(function(tweet) {
			if (tweet.retweet_count > 5) {
				// tweet = tweet.retweeted_status;
				Tweeter.findOneAndUpdate({ id: tweet.user.id }, tweet.user, {upsert: true }, function(err, user) {
					if (err) {
						console.log("Tweeter Err", err);
					} else {
						remove_inc(tweet.user);
						tweet.user_id = user._id;
						tweet.list_slug = slug;
						tweet.list_owner_screen_name = owner_screen_name;
						Tweet.findOneAndUpdate({ id: tweet.id }, tweet, { upsert: true }, function(err, data) {
							if (err) {
								console.log("Tweet Err", err);
								// console.log(tweet);
							}
							// console.log(data);
						});	
					}
				})
				
			}
			if (tweet.retweet_count > top_tweet.retweet_count) {
				top_tweet = tweet;
			}
		});
		console.log("Fetched list", owner_screen_name, slug);
		console.log("Top tweet", top_tweet.user.screen_name, top_tweet.text)
		// console.log(top_tweet);
	});
}

var list_queue = config.twitter.lists;

var get_next_list = function() {
	var item = list_queue.shift();
	get_list(item.slug, item.owner_screen_name);
	list_queue.push(item);
}

get_next_list();

setInterval(get_next_list, 1000 * config.twitter.interval);