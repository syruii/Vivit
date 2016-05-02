var util = require('util');
var winston = require('winston');
var AuthDetails = require("./auth.json");

function GoogleImagePlugin () {
	this.request = require('request');
}

// Return true if a message was sent
GoogleImagePlugin.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
GoogleImagePlugin.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

GoogleImagePlugin.prototype.respond = function(query, channel, bot) {
	//just gets the first result
	var num = 1; //looks like 4 results each 'page'
	this.request("https://www.googleapis.com/customsearch/v1?q=" + (query.replace(/\s/g, '+')) + "&cx=" + AuthDetails.custom_search_cx + "&num=1&searchType=image&start=1&key=" + AuthDetails.custom_search_api_key, function(err, res, body) {
		var data, error;
		try {
			data = JSON.parse(body);
		} catch (error) {
			console.log(error)
			return;
		}
		if(!data.items){
                   if('error' in data) {
                        bot.sendMessage(channel, "Error:\n" + data.error.message);
	           } else {
                        bot.sendMessage(channel, "Undefined error occured.");
                   }
               }
		else if (!data.items || data.items.length == 0){	
			bot.sendMessage(channel, "No result for '" + query + "'");

			return
		}
		else if("link" in data.items[0]){
			bot.sendMessage(channel, data.items[0].link);
		}
	});
	
}

GoogleImagePlugin.prototype._stripCommand = function(message) {
	if (this.options.command && message && message.toLowerCase().indexOf(this.options.command.toLowerCase() + " ") == 0) {
		return message.substring(this.options.command.length + 1);
	}
	return null;
}

module.exports = GoogleImagePlugin;
