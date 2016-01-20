var util = require('util');
var winston = require('winston');
var AuthDetails = require("./auth.json");

function WeatherPlugin () {
	WeatherAPI = AuthDetails.open_weather_api_key;
	this.request = require('request');
};


WeatherPlugin.prototype.weather = function (query, channel, bot) {
	url = "http://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + WeatherAPI + "&units=metric"
	this.request(url, function(err, res, body) {
		var data;
		try {
			console.log("A")
			data = JSON.parse(body);
		} catch (error) {
			console.log("B")
			console.log(error)
			return;
		}
		if(!data.main){
			console.log("C")
			bot.sendMessage(channel, "Error:\n" + data.message);
		}
		else {
			bot.sendMessage(channel, "**" + data.name + "**, " + data.sys.country + "\n" + data.weather.main +": " + data.weather.description + ".\n" + data.main.temp + "°C, max: " + data.main.temp_max + "°C, min: " + data.main.temp_min + ".\n" + "Wind speed of " + data.wind.speed + "m/s.");
		}
	});
};

WeatherPlugin.prototype.forecast = function (query, channel, bot) {
	

};

module.exports = WeatherPlugin;
