
var util = require('util');
var winston = require('winston');
var AuthDetails = require("./auth.json");
var xml2js = require('xml2js');
var http = require('http');

var parser = new xml2js.Parser({explicitArray : false});


function DictionaryPlugin () {
};



DictionaryPlugin.prototype.respond = function (args, channel, bot) {
	var url = "http://www.dictionaryapi.com/api/v1/references/collegiate/xml/"+args+"?key="+AuthDetails.dictionary_api_key;
	
	var req = http.get(url, function(res) {
	var xml = '';
	res.on('data', function(chunk) {
		xml += chunk;
	});
	
	res.on('end',function() {
		parser.parseString(xml, function (err, result) {
			//console.log(util.inspect(result.entry_list, false, null));
			if (result.entry_list.hasOwnProperty('entry') == false) {
				bot.sendMessage(channel, "Error: " + args + " was not found in the dictionary.");
				return;
			}
			if (result.entry_list.entry.constructor === Array) {
				var num_forms = result.entry_list.entry.length;
				bot.sendMessage(channel, "**" + args + "**");
				setTimeout(function() {
					for (var i = 0; i < num_forms; i++) {
						if (result.entry_list.entry[i].hasOwnProperty('def') == false || (result.entry_list.entry[i].$.id.length != args[0].length && result.entry_list.entry[i].$.id.search("]") == -1)) {
							continue;
						} //checks that there exists definitions
						var sx = "";
						var str = "";
						hasfl(result.entry_list.entry[i]);
						//if fl doesn't exist makes it 'other'
						if (result.entry_list.entry[i].def.dt.constructor === Array) {
							//check for multiple definitions under one def tag
							
							var k = nonemptyDef(result.entry_list.entry[i].def.dt);
							
							if (result.entry_list.entry[i].def.dt[k].hasOwnProperty('_')) {
								sx = sxflag(result.entry_list.entry[i].def.dt[k]);
								str = result.entry_list.entry[i].def.dt[k]._;
								while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
									str = str.slice(1,str.length);
								}
								bot.sendMessage(channel, "*" + result.entry_list.entry[i].fl + "*: " + str + result.entry_list.entry[i].def.dt[k].sx);
							} else {
								sx = sxflag(result.entry_list.entry[i].def.dt[k]);
								str = result.entry_list.entry[i].def.dt[k];
								while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
									str = str.slice(1,str.length);
								}
								bot.sendMessage(channel,"*" +result.entry_list.entry[i].fl + "*: " + str + sx);
							};
						} else {
							if (result.entry_list.entry[i].def.dt.hasOwnProperty('_')) {
								//bot.sendMessage(channel, result.entry_list.entry[i].fl[0]);
								sx = sxflag(result.entry_list.entry[i].def.dt);
								str = result.entry_list.entry[i].def.dt._;
								while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
									str = str.slice(1,str.length);
								}
								bot.sendMessage(channel, "*" +result.entry_list.entry[i].fl + "*: " + str + sx);
							} else {
								//bot.sendMessage(channel, result.entry_list.entry[i].fl[0]);
								sx = sxflag(result.entry_list.entry[i].def.dt);
								str = result.entry_list.entry[i].def.dt;
								while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
									str = str.slice(1,str.length);
								}
								if (hasDefinition(result.entry_list.entry[i].def.dt)) bot.sendMessage(channel, "*" + result.entry_list.entry[i].fl + "*: " + str + sx);
							};
						};
					};
				},300);
			} else {
				bot.sendMessage(channel, "**" + args + "**");
				setTimeout(function() {
					hasfl(result.entry_list.entry);
					var sx = "";
					if (result.entry_list.entry.def.dt.constructor === Array) {
						var k = nonemptyDef(result.entry_list.entry.def.dt);
						if (result.entry_list.entry.def.dt[k].hasOwnProperty('_')) {
							sx = sxflag(result.entry_list.entry.def.dt[k]);
							str = result.entry_list.entry.def.dt[k]._;
							while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
								str = str.slice(1,str.length);
							}
							bot.sendMessage(channel, "*" + result.entry_list.entry.fl + "*: " + str + sx);
						} else {
							sx = sxflag(result.entry_list.entry.def.dt[k]);
							str = result.entry_list.entry.def.dt[k];
							while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
								str = str.slice(1,str.length);
							}
							bot.sendMessage(channel,"*" + result.entry_list.entry.fl + "*: " + str + sx);
						};
					} else {
						if (result.entry_list.entry.def.dt.hasOwnProperty('_')) {
							//bot.sendMessage(channel, result.entry_list	.entry[i].fl[0]);
							sx = sxflag(result.entry_list.entry.def.dt);
							str = result.entry_list.entry.def.dt._;
							while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
								str = str.slice(1,str.length);
							}
							bot.sendMessage(channel, "*" + result.entry_list.entry.fl + "*: " + str + sx);
						} else {	
							//bot.sendMessage(channel, result.entry_list.entry[i].fl[0]);
							sx = sxflag(result.entry_list.entry.def.dt);
							str = result.entry_list.entry.def.dt;
							while (str.charAt(0) == ' ' || str.charAt(0) == ':') {
								str = str.slice(1,str.length);
							}
							if (hasDefinition(result.entry_list.entry.def.dt)) bot.sendMessage(channel, "*" + result.entry_list.entry.fl + "*: " + str + sx);
						};
					};
				},300);
			};
		});
	});
	
});
	
function hasDefinition (def_tag) {
	if (def_tag.constructor == String) {
		return true;
	} else {
		return false;
	};
};

function hasfl (entry) {
	if (entry.hasOwnProperty('fl') == false) {
		entry['fl'] = 'other';		
	};
}

function nonemptyDef (def_tag) {
	var defs = def_tag.length;
	for (var i = 0; i < def_tag.length; i++) {
		if (def_tag[i].hasOwnProperty('_')) {
			if (def_tag[i]._.length < 3) {
				continue;
			} else {
				return i;
			};
		} else {
			if (def_tag[i].length < 3) {
				continue;
			} else {
				return i;
			};
		};
	};
	
}

function sxflag (def_tag) {
	if (def_tag.hasOwnProperty('sx')) {
		return def_tag.sx;
	} else {
		return  "";
	};
};
	
	
/*	
	this.youtube.search(query, 1, function(error, result) {
			if (error) {
				//winston.error("Error querying youtube: " + error);
				bot.sendMessage(channel, "¯\\_(ツ)_/¯");
			}
			else {
				if (!result || !result.items || result.items.length < 1) {
					//winston.error("No results from youtube");
					bot.sendMessage(channel, "¯\\_(ツ)_/¯");
				} else {
					bot.sendMessage(channel, "http://www.youtube.com/watch?v=" + result.items[0].id.videoId );
				}
			}
		});
*/
};


module.exports = DictionaryPlugin;