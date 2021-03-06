var util = require('util');
var winston = require('winston');
var AuthDetails = require("./auth.json");

function WeatherPlugin () {
	WeatherAPI = AuthDetails.open_weather_api_key;
	this.request = require('request');
};


WeatherPlugin.prototype.weather = function (query, channel, bot) {
	url = "http://api.openweathermap.org/data/2.5/weather?q=" + query + "&type=like&appid=" + WeatherAPI + "&units=metric"
	this.request(url, function(err, res, body) {
		var data;
		try {
			data = JSON.parse(body);
		} catch (error) {
			console.log(error)
			return;
		}
		if(data.hasOwnProperty('main') == false){
			bot.sendMessage(channel, "Error:\n" + data.message);
		}
		else {
			bot.sendMessage(channel, "**" + data.name + "**, *" + data.sys.country + "*\n" + data.weather[0].main +": " + data.weather[0].description + ".\n**" + data.main.temp + "**°C, max: **" + data.main.temp_max + "**°C, min: **" + data.main.temp_min + "**°C.\n" + "Wind speed of **" + data.wind.speed + "** m/s.");
		}
	});
};

WeatherPlugin.prototype.forecast = function (query, channel, bot) {
	

};

module.exports = WeatherPlugin;
