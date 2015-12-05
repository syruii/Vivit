var util = require('util');
var winston = require('winston');
var http = require('http');
var request = require('request')

function DanbooruPlugin () {
};


DanbooruPlugin.prototype.respond = function (query, channel, bot) {
	var args = query.split(" ");
	var method = -1;
	if (args.length === 1) {
		bot.sendMessage(channel,"Please specify a <method> (Ex. !danbooru nsfw swimsuit cleavage)");
		return;
	} else if (args[0] === 'nsfw') {
		method = 0;
		if (args.length == 2) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "&limit=100";
		} else if (args.length == 3) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "+" + args[2] + "&limit=100";
		};
	} else if (args[0] === 'sfw') {
		method = 1;
		if (args.length == 2) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "&limit=100";
		} else if (args.length == 3) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "+" + args[2] + "&limit=100";
		};
	} else if (args[0] === 'search') {
		method = 2;
		if (args.length == 2) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "&limit=100";
		} else if (args.length == 3) {
			var url = "http://danbooru.donmai.us/posts.json?tags=" + args[1] + "+" + args[2] + "&limit=100";
		};	
	} else {
		bot.sendMessage(channel,"Please specify a valid <method> (nsfw | sfw | search)");
	};
	respond(url,method,channel,bot)
	
	
	

};
function respond (url, method,channel,bot) {
	request({
    url: url,
    json: true
	}, function (error, response, body) {

    if (!error && response.statusCode === 200) {
		if (body.length === 0) {
			bot.sendMessage(channel, "Search returned nothing.");
			return;
		}
		if (method === 0) {
			for (var i = body.length - 1; i >= 0; i--) {
				if (body[i].rating === 's') {
					body.splice(i,1);
				};
			};
		} else if (method === 1) {
			for (var i = body.length - 1; i >= 0; i--) {
				if (body[i].rating != 's') {
					body.splice(i,1);
				};
			};
		};
		var length = body.length; 
		if (body.length === 0) {
			bot.sendMessage(channel, "Search returned nothing.");
			return;
		};
		var random = randomWithRange(0,body.length-1);
        bot.sendMessage(channel, "https://danbooru.donmai.us" + body[random].large_file_url);
    };
	});
}

function randomWithRange(min, max)
{
   var range = (max - min) + 1;     
   return parseInt(Math.random() * range + min);
}

module.exports = DanbooruPlugin;