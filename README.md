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

`node twitwatcher.js`

## Results

Results are stored in MongoDB. Here's an example of how we'd see the resulting Tweets, ordered by number of retweets, but excluding tweets that are themselves retweets.

First get into Mongo:
`mongo`

Use the correct database:

`use agendasetter`

Find the tweets for our sa-journos-who-tweet list:

`db.tweets.find({ retweeted_status: { $exists: false }, list_slug: "sa-journos-who-tweet" }, { "user.screen_name": 1, text: 1, retweet_count: 1 }).sort( { retweet_count: -1 });`