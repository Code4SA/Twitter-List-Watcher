var Twit = require('twit')
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
try {
	var config = require('./config');
} catch(e) {
	var config = {
		twitter: {
			consumer_key:         process.env.TWITTER_CONSUMER_KEY, 
			consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
			access_token:         process.env.TWITTER_ACCESS_TOKEN,
			access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,

			lists: [
				{ 
					slug: "sa-journos-who-tweet", owner_screen_name: "rayjoe" 
				},
				// {
				// 	slug: "a-brave-new-world", owner_screen_name: "rayjoe"
				// },
			],

			count: 200,
			interval: 120, //Seconds
		},
		mongodb: {
			connect_string: "mongodb://localhost/agendasetter",
		},
	}
}

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

//API Server
var restify = require('restify');

var server = restify.createServer();
server.use(restify.queryParser());

var timePeriod = function(t) {
	var periods = {
		n: 60,
		h: 60 * 60,
		d: 60 * 60 * 24,
		w: 60 * 60 * 24 * 7,
		m: 60 * 60 * 24 * 7 * 30,
		y: 60 * 60 * 24 * 7 * 365,
	}
	if (isNaN(t.charAt(t.length - 1))) {
		var p = t.slice(-1);
		if (p in periods) {
			t = periods[p] * parseInt(t);
		}
	}
	return new Date(new Date().getTime() - (t*1000));
}

var queryBuilder = function(req, res, next) {
	var find = {};
	if (req.params.list_slug) {
		find.list_slug = req.params.list_slug;
	}
	if (req.params.no_retweets) {
		find.retweeted_status = { $exists: false };
	}
	if (req.params.period) {
		find.created_at = { $gte:  timePeriod(req.params.period) }
	}
	req.mongodb_q = Tweet.find(find);
	if (req.params.limit) {
		req.mongodb_q.limit(req.params.limit);
	} else {
		req.mongodb_q.limit(100);
	}
	if (req.params.sort) {
		req.mongodb_q.sort = {};
		req.mongodb_q.sort[req.params.sort] = -1; //Always sort descending
	} else {
		req.mongodb_q.sort({ created_at: -1 });
	}

	next();
};

server.get("/tweets", queryBuilder, function(req, res, next) {
	console.log(req.route.path);
	req.mongodb_q.exec(function(err, tweets) {
		res.json(tweets);
		next();
	})
});

server.get("/tweets/top/retweets/", function(req, res, next) {
	console.log(req.route.path);
	Tweet.find({ retweeted_status: { $exists: false }, list_slug: "sa-journos-who-tweet", created_at: { $gte: timePeriod("7d") }  }).sort({ retweet_count: -1 }).limit(10).exec(function(err, tweets) {
		res.json(tweets);
		next();
	})
});

server.get("/tweets/top/favourites/", function(req, res, next) {
	console.log(req.route.path);

	Tweet.find({ retweeted_status: { $exists: false }, list_slug: "sa-journos-who-tweet", created_at: { $gte: timePeriod("7d") } }).sort({ favourite_count: -1 }).limit(10).exec(function(err, tweets) {
		res.json(tweets);
		next();
	})
});

server.listen(process.env.PORT || 8080, function() {
	console.log('%s listening at %s', server.name, server.url);
});