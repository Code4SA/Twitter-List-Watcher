# Twitter-List-Watcher
This watches twitter lists for the most retweeted tweets

The server is built by Jason Norwood-Young from [Code for South Africa](http://code4sa.org), in partnership with the [School of Data](http://schoolofdata.org/) and [Media Monitoring Africa](http://mediamonitoringafrica.org/).

## Requirements

- [Node.js](http://nodejs.org/)
- [MongoDB](http://www.mongodb.org/)

## Installation

First, install the dependencies.

`npm install`

Copy config_sample.js to config.js

`cp config_sample.js config.js`

Edit config.js for your [Twitter API auth details](https://apps.twitter.com/), and the lists you'd like to watch. (The "slug" is the list name, the "owner_screen_name" is the Twitter username of the list owner.)

Run the server

`node server.js`

## Results

Results are stored in MongoDB. Here's an example of how we'd see the resulting Tweets, ordered by number of retweets, but excluding tweets that are themselves retweets.

First get into Mongo:

`mongo`

Use the correct database:

`use agendasetter`

Find the tweets for our sa-journos-who-tweet list:

`db.tweets.find({ retweeted_status: { $exists: false }, list_slug: "sa-journos-who-tweet" }, { "user.screen_name": 1, text: 1, retweet_count: 1 }).sort( { retweet_count: -1 });`

## API

Fortunately, you don't need to use Mongo every time you want to see results. There's a built-in API! It runs on port 8080 by default. We also have it running on Heroku, so you can try out all of these commands straight away from your browser. I'll put the Heroku link to each example below the example. Let's take a look.

### Get last 100 Tweets

`http://localhost:8080/tweets`

[Heroku link](https://twitter-list-watcher.herokuapp.com/tweets)

### Top 10 Tweets for the last week, by Retweets

`http://localhost:8080/tweets/top/retweets`

[Heroku link](https://twitter-list-watcher.herokuapp.com/tweets/top/retweets)

### Top 10 Tweets for the last week, by Retweets

`http://localhost:8080/tweets/top/favourites`

[Heroku link](https://twitter-list-watcher.herokuapp.com/tweets/top/favourites)

You can also modify the _/tweets_ endpoint with parameters. The parameters are:

| Parameter | Description | Default |
|-----------|:-----------:|--------:|
| limit     | Limits result count | 100 |
| sort		| Sorts the results by any field, always descending | created_at |
| no_retweets | Don't show retweets, only original tweets | False |
| list_slug | The name of the list (in case you're scraping more than one) | All lists |
| period 	| Limit by a certain period. Takes seconds, but you can also append with n, h, d, w, m, y | None |

Example of finding the top 10 Tweets according to favourites for the last hour:

`http://localhost:8080/tweets?limit=10&sort=favourite_count&no_retweets=true&list_slug=sa-journos-who-tweet&period=1h`

[Heroku link](https://twitter-list-watcher.herokuapp.com/tweets?limit=10&sort=favourite_count&no_retweets=true&list_slug=sa-journos-who-tweet&period=1h)