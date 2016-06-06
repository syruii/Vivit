/*
	this bot is a ping pong bot, and every time a message
	beginning with "ping" is sent, it will reply with
	"pong".
*/

var Discord = require("discord.js");

var util = require('util');

var yt = require("./youtube_plugin");
var youtube_plugin = new yt();

var gi = require("./google_image_plugin");
var google_image_plugin = new gi();

var wa = require("./wolfram_plugin");
var wolfram_plugin = new wa();

var dict = require("./dictionary_plugin");
var dictionary_plugin = new dict();

var poker = require("./poker_plugin.js");
var poker_plugin = new poker();

var danbooru = require("./danbooru_plugin");
var danbooru_plugin = new danbooru();

var weather = require("./weather_plugin");
var weather_plugin =  new weather();

// Get the email and password
var AuthDetails = require("./auth.json");
var qs = require("querystring");

var htmlToText = require('html-to-text');

var config = {
    "api_key": "dc6zaTOxFJmzC",
    "rating": "r",
    "url": "http://api.giphy.com/v1/gifs/search",
    "permission": ["NORMAL"]
};

var aliases;

//https://api.imgflip.com/popular_meme_ids
var meme = {
	"brace": 61546,
	"mostinteresting": 61532,
	"fry": 61520,
	"onedoesnot": 61579,
	"yuno": 61527,
	"success": 61544,
	"allthethings": 61533,
	"doge": 8072285,
	"drevil": 40945639,
	"skeptical": 101711,
	"notime": 442575,
	"yodawg": 101716,
	"ermahgerd": 101462,
	"hipsterariel": 86601,
	"imagination": 163573,
	"grumpycat": 405658,
	"morpheus": 100947,
	"1stworldproblems": 61539,
  "philosoraptor": 61516,
};

var game_abbreviations = {
    "cs": "Counter-Strike",
    "hon": "Heroes of Newerth",
    "hots": "Heroes of the Storm",
    "sc2": "Starcraft II",
    "gta": "Grand Theft Auto",
	"rl": "Rocket League"
};

var commands = {
	"gif": {
		usage: "<image tags>",
        description: "returns a random gif matching the tags passed",
		process: function(bot, msg, suffix) {
		    var tags = suffix.split(" ");
		    get_gif(tags, function(id) {
			if (typeof id !== "undefined") {
			    bot.sendMessage(msg.channel, "http://media.giphy.com/media/" + id + "/giphy.gif [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
			else {
			    bot.sendMessage(msg.channel, "Invalid tags, try something different. [Tags: " + (tags ? tags : "Random GIF") + "]");
			}
		    });
		}
	},
	
    "ping": {
        description: "responds pong, useful for checking if bot is alive",
        process: function(bot, msg, suffix) {
            bot.sendMessage(msg.channel, msg.sender+" pong!");
            if(suffix){
                bot.sendMessage(msg.channel, "note that !ping takes no arguments!");
            }
        }
    },
    "game": {
        usage: "<name of game>",
        description: "pings channel asking if anyone wants to play",
        process: function(bot,msg,suffix){
            var game = game_abbreviations[suffix];
            if(!game) {
                game = suffix;
            }
            bot.sendMessage(msg.channel, "@everyone Anyone up for " + game + "?");
            console.log("sent game invites for " + game);
        }
    },
    "servers": {
        description: "lists servers bot is connected to",
        process: function(bot,msg){bot.sendMessage(msg.channel,bot.servers);}
    },
	"topic": {
		usage: "<new topic>",
        description: "sets topic of connected channel",
        process: function(bot,msg,suffix){
			bot.setTopic(msg.channel,suffix);
		}
    },
    "channels": {
        description: "lists channels bot is connected to",
        process: function(bot,msg) { bot.sendMessage(msg.channel,bot.channels);}
    },
    "myid": {
        description: "returns the user id of the sender",
        process: function(bot,msg){bot.sendMessage(msg.channel,msg.author.id);}
    },
	"weather": {
		usage: "<city>",
		description: "fetches current weather for selected city",
		process: function(bot,msg,suffix){weather_plugin.weather(suffix,msg.channel,bot);}
	},
    "idle": {
        description: "sets bot status to idle",
        process: function(bot,msg){ bot.setStatusIdle();}
    },
    "online": {
        description: "sets bot status to online",
        process: function(bot,msg){ bot.setStatusOnline();}
    },
    "youtube": {
        usage: "<video tags>",
        description: "gets youtube video matching tags",
        process: function(bot,msg,suffix){
            youtube_plugin.respond(suffix,msg.channel,bot);
        }
    },
	"define": {
        usage: "<phrase>",
        description: "finds a definition for the phrase",
        process: function(bot,msg,suffix){
            dictionary_plugin.respond(suffix,msg.channel,bot);
        }
    },
    "say": {
        usage: "<message>",
        description: "bot says message",
        process: function(bot,msg,suffix){ 
			bot.sendMessage(msg.channel,suffix,true);
		}
	},
	
	//Poker stuff
	"poker": {
        usage: "<buy in>",
        description: "starts a new poker game",
        process: function(bot,msg,suffix){
			poker_plugin = new poker();			
			poker_plugin.new(suffix,msg,bot,true);
		}
	},
	"join": {
        usage: "",
        description: "joins a poker game in the recruitment phase",
        process: function(bot,msg,suffix){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.join(suffix,msg,bot,true);
		}
	},
	"start": {
        usage: "",
        description: "ends recruitment and begins poker game",
        process: function(bot,msg,suffix){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.opening(msg,bot,true);
		}
	},
	"raise": {
        usage: "<amount>",
        description: "bets/raises BY amount for current betting round (includes blinds)",
        process: function(bot,msg,suffix){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.raise(suffix,msg,bot,true);
		}
	},
	"fold": {
        usage: "",
        description: "fold your hand",
        process: function(bot,msg){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.fold(msg,bot,true);
		}
	},
	"check": {
        usage: "",
        description: "these trips",
        process: function(bot,msg){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.check(msg,bot,true);
		}
	},
	"call": {
        usage: "",
        description: "call the current bet",
        process: function(bot,msg){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.call(msg,bot,true);
		}
	},
	"money": {
        usage: "",
        description: "find out how much dosh you have",
        process: function(bot,msg){ 
			poker_plugin.money(msg,bot,true);
		}
	},
	"add": {
        usage: "<player> <money>",
        description: "add money to given player.",
        process: function(bot,msg,suffix){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.add(suffix,bot,true);
		}
	},
	"remove": {
        usage: "<player> <money>",
        description: "remove money from given player.",
        process: function(bot,msg,suffix){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.remove(suffix,bot,true);
		}
	},
	"leave": {
        usage: "",
        description: "removes you from a poker game",
        process: function(bot,msg){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin.leave(msg,bot,true);
		}
	},
	"pot": {
        usage: "",
        description: "gives you the current (total) pot size",
        process: function(bot,msg){
		if (poker_plugin.game != 'session') {
			bot.sendMessage(msg.author, "A game is not in session.");
			return;
		}					
			bot.sendMessage(msg.author, "The pot size is $"+ poker_plugin.pot+".");
		}
	},
	"hand": {
        usage: "",
        description: "messages you your hand again",
        process: function(bot,msg){ 
			poker_plugin.cardShow(msg,bot,"player_hand",true);
		}
	},	
	"table": {
        usage: "",
        description: "messages you the current cards on the table",
        process: function(bot,msg){
			poker_plugin.cardShow(msg,bot,"community",true);
		}
	},
	"bet": {
        usage: "",
        description: "messages you the current bet",
        process: function(bot,msg){ 
			poker_plugin.checkBet(msg,bot,true);;
		}
	},		
	"reinit": {
        usage: "",
        description: "resets poker bot",
        process: function(bot,msg){ 
			if (msg.channel != poker_plugin.activeChannel) {
				return;
			}
			poker_plugin = new poker();
			bot.sendMessage(msg.channel, "Poker game has been reset.")
		}
	},	
	
	// End poker stuff
	
	
	"goodshit": {
        description: 	"thats some good shit",
        process: function(bot,msg,suffix){ 
			bot.sendMessage(msg.channel,"sign me the FUCK up 👌👀👌👀👌👀👌👀👌👀 good shit go౦ԁ sHit👌 thats ✔ some good👌👌shit right👌👌there👌👌👌 right✔there ✔✔if i do ƽaү so my self 💯 i say so 💯 thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ💯 👌👌 👌НO0ОଠOOOOOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ👌 👌👌 👌 💯 👌 👀 👀 👀 👌👌Good shit",true);
		}	
		
    },
	"badshit": {
        description: 	"thats not good shit",
        process: function(bot,msg,suffix){ 
			bot.sendMessage(msg.channel,"do NOT sign me the FUCK up 👎👀👎👀👎👀👎👀👎👀 bad shit ba̷̶ ԁ sHit 👎 thats ❌ some bad 👎👎shit right 👎👎 th 👎 ere 👎👎👎 right ❌ there ❌ ❌ if i do ƽaү so my selｆ🚫 i say so 🚫 thats not what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ 🚫 👎 👎👎НO0ОଠＯOOＯOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ 👎 👎👎 👎 🚫 👎 👀 👀 👀 👎👎Bad shit",true);
		}	
		
    },
	"dice": {
        usage: "<number of dice> <type of dice>",
        description: "rolls specified dice and gives you the total",
        process: function(bot,msg,suffix){
			var args = suffix.split(" ");
			var total = 0;
			var rolled = 0;
			if (args[0] > 1000) {
				bot.sendMessage(msg.channel,"My hands aren't big enough to roll that many dice :(",true);
				return;
			}
			for (rolled = 0; rolled < args[0]; rolled++) {
				total += randomWithRange(1,args[1]);
			}
			bot.sendMessage(msg.channel,total,true);
		}
    },
	"choose": {
        usage: "<options> ...",
        description: "bot chooses out of your specified options",
        process: function(bot,msg,suffix){
			var args = suffix.split(" ");
			var num = args.length;
			var str = "I choose ";
			var rand = randomWithRange(0,num-1);

			var response = str.concat(args[rand]);
			response = response.concat("!");
			bot.sendMessage(msg.channel,response,true); 
		}
    },
	"askbot": {
        usage: "<question>",
        description: "bot gives you an answer to all your questions",
        process: function(bot,msg,suffix){ 
			var rand = randomWithRange(0,19);
			/*rand = parseInt(rand,10);*/
			if (rand == 0) {
				bot.sendMessage(msg.channel,"It is certain.",true); 
			} else if (rand == 1) {
				bot.sendMessage(msg.channel,"It is decidedly so.",true);
			} else if (rand == 2) {
				bot.sendMessage(msg.channel,"Without a doubt.",true);
			} else if (rand == 3) {
				bot.sendMessage(msg.channel,"Yes, definitely.",true);
			} else if (rand == 4) {
				bot.sendMessage(msg.channel,"You may rely on it.",true);
			} else if (rand == 5) {
				bot.sendMessage(msg.channel,"As I see it, yes.",true);
			} else if (rand == 6) {
				bot.sendMessage(msg.channel,"Most likely.",true);
			} else if (rand == 7) {
				bot.sendMessage(msg.channel,"Outlook good.",true);
			} else if (rand == 8) {
				bot.sendMessage(msg.channel,"Yes.",true);
			} else if (rand == 9) {
				bot.sendMessage(msg.channel,"Sign points to yes.",true);
			} else if (rand == 10) {
				bot.sendMessage(msg.channel,"Reply hazy try again.",true);
			} else if (rand == 11) {
				bot.sendMessage(msg.channel,"Ask again later.",true);
			} else if (rand == 12) {
				bot.sendMessage(msg.channel,"Better not tell you now.",true);
			} else if (rand == 13) {
				bot.sendMessage(msg.channel,"Cannot predict now.",true);
			} else if (rand == 14) {
				bot.sendMessage(msg.channel,"Concentrate and ask again.",true);
			} else if (rand == 15) {
				bot.sendMessage(msg.channel,"Don't count on it.",true);
			} else if (rand == 16) {
				bot.sendMessage(msg.channel,"My reply is no.",true);
			} else if (rand == 17) {
				bot.sendMessage(msg.channel,"My sources say no.",true);
			} else if (rand == 18) {
				bot.sendMessage(msg.channel,"Outlook not so good.",true);
			} else if (rand == 19) {
				bot.sendMessage(msg.channel,"Very doubtful.",true);
			}
		}
    },
    "image": {
        usage: "<image tags>",
        description: "gets image matching tags from google",
        process: function(bot,msg,suffix){ google_image_plugin.respond(suffix,msg.channel,bot);}
    },
    "pullanddeploy": {
        description: "bot will perform a git pull master and restart with the new code",
        process: function(bot,msg,suffix) {
            bot.sendMessage(msg.channel,"fetching updates...",function(error,sentMsg){
                console.log("updating...");
	            var spawn = require('child_process').spawn;
                var log = function(err,stdout,stderr){
                    if(stdout){console.log(stdout);}
                    if(stderr){console.log(stderr);}
                };
                var fetch = spawn('git', ['fetch']);
                fetch.stdout.on('data',function(data){
                    console.log(data.toString());
                });
                fetch.on("close",function(code){
                    var reset = spawn('git', ['reset','--hard','origin/master']);
                    reset.stdout.on('data',function(data){
                        console.log(data.toString());
                    });
                    reset.on("close",function(code){
                        var npm = spawn('npm', ['install']);
                        npm.stdout.on('data',function(data){
                            console.log(data.toString());
                        });
                        npm.on("close",function(code){
                            console.log("goodbye");
                            bot.sendMessage(msg.channel,"brb!",function(){
                                bot.logout(function(){
                                    process.exit();
                                });
                            });
                        });
                    });
                });
            });
        }
    },
    "meme": {
        usage: 'meme "top text" "bottom text"',
		description: "make shitty memes",
        process: function(bot,msg,suffix) {
            var tags = msg.content.split('"');
            var memetype = tags[0].split(" ")[1];
            //bot.sendMessage(msg.channel,tags);
            var Imgflipper = require("imgflipper");
            var imgflipper = new Imgflipper(AuthDetails.imgflip_username, AuthDetails.imgflip_password);
            imgflipper.generateMeme(meme[memetype], tags[1]?tags[1]:"", tags[3]?tags[3]:"", function(err, image){
                //console.log(arguments);
                bot.sendMessage(msg.channel,image);
            });
        }
    },
    "memehelp": { //TODO: this should be handled by !help
        description: "returns available memes for !meme",
        process: function(bot,msg) {
            var str = "Currently available memes:\n"
            for (var m in meme){
                str += m + "\n"
            }
            bot.sendMessage(msg.channel,str);
        }
    },
    "version": {
        description: "returns the git commit this bot is running",
        process: function(bot,msg,suffix) {
            var commit = require('child_process').spawn('git', ['log','-n','1']);
            commit.stdout.on('data', function(data) {
                bot.sendMessage(msg.channel,data);
            });
            commit.on('close',function(code) {
                if( code != 0){
                    bot.sendMessage(msg.channel,"failed checking git version!");
                }
            });
        }
    },
    "log": {
        usage: "<log message>",
        description: "logs message to bot console",
        process: function(bot,msg,suffix){console.log(msg.content);}
    },
	"avatar": {
        usage: "<username>",
        description: "prints url to avatar or specified user",
        process: function(bot,msg,suffix){
			var usr = 0;
			while (usr < bot.users.length) {
				if (bot.users[usr].username == suffix){
					if (bot.users[usr].avatar === null){
						bot.sendMessage(msg.channel,"Specified user does not have an avatar.");
						return;
					}
					bot.sendMessage(msg.channel,bot.users[usr].avatarURL);
					return;
				}
				usr++;
			}
			bot.sendMessage(msg.channel,"Specified user not found in any channel.");
			}
    },
    "wiki": {
        usage: "<search terms>",
        description: "returns the summary of the first matching search result from Wikipedia",
        process: function(bot,msg,suffix) {
            var query = suffix;
            if(!query) {
                bot.sendMessage(msg.channel,"usage: !wiki search terms");
                return;
            }
            var Wiki = require('wikijs');
            new Wiki().search(query,1).then(function(data) {
                new Wiki().page(data.results[0]).then(function(page) {
                    page.summary().then(function(summary) {
                        var sumText = summary.toString().split('\n');
                        var continuation = function() {
                            var paragraph = sumText.shift();
                            if(paragraph){
                                bot.sendMessage(msg.channel,paragraph,continuation);
                            }
                        };
                        continuation();
                    });
                });
            },function(err){
                bot.sendMessage(msg.channel,err);
            });
        }
    },
    "join-server": {
        usage: "<invite>",
        description: "joins the server it's invited to",
        process: function(bot,msg,suffix) {
            console.log(bot.joinServer(suffix,function(error,server) {
                console.log("callback: " + arguments);
                if(error){
                    bot.sendMessage(msg.channel,"failed to join: " + error);
                } else {
                    console.log("Joined server " + server);
                    bot.sendMessage(msg.channel,"Successfully joined " + server);
                }
            }));
        }
    },
    "create": {
        usage: "<text|voice> <channel name>",
        description: "creates a channel with the given type and name.",
        process: function(bot,msg,suffix) {
            var args = suffix.split(" ");
            var type = args.shift();
            if(type != "text" && type != "voice"){
                bot.sendMessage(msg.channel,"you must specify either voice or text!");
                return;
            }
            bot.createChannel(msg.channel.server,args.join(" "),type, function(error,channel) {
                if(error){
                    bot.sendMessage(msg.channel,"failed to create channel: " + error);
                } else {
                    bot.sendMessage(msg.channel,"created " + channel);
                }
            });
        }
    },
    "delete": {
        usage: "<channel name>",
        description: "deletes the specified channel",
        process: function(bot,msg,suffix) {
            var channel = bot.getChannel("name",suffix);
            bot.sendMessage(msg.channel.server.defaultChannel, "deleting channel " + suffix + " at " +msg.author + "'s request");
            if(msg.channel.server.defaultChannel != msg.channel){
                bot.sendMessage(msg.channel,"deleting " + channel);
            }
            bot.deleteChannel(channel,function(error,channel){
                if(error){
                    bot.sendMessage(msg.channel,"couldn't delete channel: " + error);
                } else {
                    console.log("deleted " + suffix + " at " + msg.author + "'s request");
                }
            });
        }
    },
    "stock": {
        usage: "<stock to fetch>",
        process: function(bot,msg,suffix) {
            var yahooFinance = require('yahoo-finance');
            yahooFinance.snapshot({
              symbol: suffix,
              fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
            }, function (error, snapshot) {
                if(error){
                    bot.sendMessage(msg.channel,"couldn't get stock: " + error);
                } else {
                    //bot.sendMessage(msg.channel,JSON.stringify(snapshot));
                    bot.sendMessage(msg.channel,snapshot.name
                        + "\nprice: $" + snapshot.lastTradePriceOnly);
                }  
            });
        }
    },
	"wolfram": {
		usage: "<search terms>",
        description: "gives results from wolframalpha using search terms",
        process: function(bot,msg,suffix){
			if(!suffix){
				bot.sendMessage(msg.channel,"Usage: !wolfram <search terms> (Ex. !wolfram integrate 4x)");
			}
            wolfram_plugin.respond(suffix,msg.channel,bot);
        }
	},
	"danbooru": {
		usage: "<search terms>",
        description: "gives latest post from danbooru with a maximum of two tags",
        process: function(bot,msg,suffix){
			if(!suffix){
				bot.sendMessage(msg.channel,"Usage: !danbooru <search terms> (Ex. !danbooru noire stockings)");
			}
            danbooru_plugin.respond(suffix,msg.channel,bot);
        }
	},
    "rss": {
        description: "lists available rss feeds",
        process: function(bot,msg,suffix) {
            /*var args = suffix.split(" ");
            var count = args.shift();
            var url = args.join(" ");
            rssfeed(bot,msg,url,count,full);*/
            bot.sendMessage(msg.channel,"Available feeds:", function(){
                for(var c in rssFeeds){
                    bot.sendMessage(msg.channel,c + ": " + rssFeeds[c].url);
                }
            });
        }
    },
    "reddit": {
        usage: "[subreddit]",
        description: "Returns the top post on reddit. Can optionally pass a subreddit to get the top post there instead",
        process: function(bot,msg,suffix) {
            var path = "/.rss"
            if(suffix){
                path = "/r/"+suffix+path;
            }
            rssfeed(bot,msg,"https://www.reddit.com"+path,1,false);
        }
    },
	"announce": {
        usage: "<message>",
        description: "bot says message with text to speech",
        process: function(bot,msg,suffix){ bot.sendMessage(msg.channel,suffix,true);}
	},
	"alias": {
		usage: "<name> <actual command>",
		description: "Creates command aliases. Useful for making simple commands on the fly",
		process: function(bot,msg,suffix) {
			var args = suffix.split(" ");
			var name = args.shift();
			if(!name){
				bot.sendMessage(msg.channel,"!alias " + this.usage + "\n" + this.description);
			} else if(commands[name] || name === "help"){
				bot.sendMessage(msg.channel,"overwriting commands with aliases is not allowed!");
			} else {
				var command = args.shift();
				aliases[name] = [command, args.join(" ")];
				//now save the new alias
				require("fs").writeFile("./alias.json",JSON.stringify(aliases,null,2), null);
				bot.sendMessage(msg.channel,"created alias " + name);
			}
		}
	}
};
try{
var rssFeeds = require("./rss.json");
function loadFeeds(){
    for(var cmd in rssFeeds){
        commands[cmd] = {
            usage: "[count]",
            description: rssFeeds[cmd].description,
            url: rssFeeds[cmd].url,
            process: function(bot,msg,suffix){
                var count = 1;
                if(suffix != null && suffix != "" && !isNaN(suffix)){
                    count = suffix;
                }
                rssfeed(bot,msg,this.url,count,false);
            }
        };
    }
}
} catch(e) {
    console.log("Couldn't load rss.json. See rss.json.example if you want rss feed commands. error: " + e);
}

try{
	aliases = require("./alias.json");
} catch(e) {
	//No aliases defined
	aliases = {};
}

function rssfeed(bot,msg,url,count,full){
    var FeedParser = require('feedparser');
    var feedparser = new FeedParser();
    var request = require('request');
    request(url).pipe(feedparser);
    feedparser.on('error', function(error){
        bot.sendMessage(msg.channel,"failed reading feed: " + error);
    });
    var shown = 0;
    feedparser.on('readable',function() {
        var stream = this;
        shown += 1
        if(shown > count){
            return;
        }
        var item = stream.read();
        bot.sendMessage(msg.channel,item.title + " - " + item.link, function() {
            if(full === true){
                var text = htmlToText.fromString(item.description,{
                    wordwrap:false,
                    ignoreHref:true
                });
                bot.sendMessage(msg.channel,text);
            }
        });
        stream.alreadyRead = true;
    });
}

function randomWithRange(min, max)
{
   var range = (max - min) + 1;     
   return parseInt(Math.random() * range + min);
}

var bot = new Discord.Client();

bot.on("ready", function () {
    loadFeeds();
	console.log("Ready to begin! Serving in " + bot.channels.length + " channels");
});

bot.on("disconnected", function () {

	console.log("Disconnected!");
	process.exit(1); //exit node.js with an error
	
});

bot.on("message", function (msg) { 
    //console.log(util.inspect(roles, false, 2));
    //var banished[] = server.usersWithRole(
         
	//check if message is a command
	if(msg.author.id != bot.user.id && (msg.content[0] === '!' || msg.content.indexOf(bot.user.mention()) == 0)){
  
            for (i = 0; i < msg.channel.server.roles.length; i++) {
              // console.log(msg.channel.server.roles[i].name);
              if (msg.channel.server.roles[i].name == "Banished"){
                  var banished_role = msg.channel.server.roles[i];
                  var user_roles = msg.channel.server.rolesOfUser(msg.author);
                  for (i = 0; i < user_roles.length; i++) {
                      if (banished_role.id == user_roles[i].id) {
                        bot.sendMessage(msg.channel,msg.author + ", you have been banished and cannot use any commands :(");
                        return;
                        //temporary ban list follows
                      } else if (msg.author.id == 117025232333701128  || msg.author.id == 115717131085021185) {
                      	bot.sendMessage("Can't let you do that," + msg.channel,msg.author + "!");
			return;
                       }
                  }
              break;
              }
            }      
         console.log("treating " + msg.content + " from " + msg.author + " as command");
	 var cmdTxt = msg.content.split(" ")[0].substring(1);
         var suffix = msg.content.substring(cmdTxt.length+2);//add one for the ! and one for the space
         if(msg.content.indexOf(bot.user.mention()) == 0){
            cmdTxt = msg.content.split(" ")[1];
            suffix = msg.content.substring(bot.user.mention().length+cmdTxt.length+2);
         }
		alias = aliases[cmdTxt];
		if(alias){
			cmdTxt = alias[0];
			suffix = alias[1] + " " + suffix;
		}
		var cmd = commands[cmdTxt];
        if(cmdTxt === "help"){
            //help is special since it iterates over the other commands
            for(var cmd in commands) {
                var info = "!" + cmd;
                var usage = commands[cmd].usage;
                if(usage){
                    info += " " + usage;
                }
                var description = commands[cmd].description;
                if(description){
                    info += "\n\t" + description;
                }
                bot.sendMessage(msg.author,info);
            }
        }
		else if(cmd) {
            cmd.process(bot,msg,suffix);
		} else {
			//other bots may use same delimiter
		}
	} else {
		//message isn't a command or is from us
        //drop our own messages to prevent feedback loops
        if(msg.author == bot.user){
            return;
        }
        
        if (msg.author != bot.user && msg.isMentioned(bot.user)) {
                bot.sendMessage(msg.channel,msg.author + ", you called?");
        }
    }
});
 

//Log user status changes
bot.on("presence", function(data) {
	//if(status === "online"){
	//console.log("presence update");
	console.log(data.username+" went "+data.status);
	//}
});

function get_gif(tags, func) {
        //limit=1 will only return 1 gif
        var params = {
            "api_key": config.api_key,
            "rating": config.rating,
            "format": "json",
            "limit": 1
        };
        var query = qs.stringify(params);

        if (tags !== null) {
            query += "&q=" + tags.join('+')
        }

        //wouldnt see request lib if defined at the top for some reason:\
        var request = require("request");
        //console.log(query)

        request(config.url + "?" + query, function (error, response, body) {
            //console.log(arguments)
            if (error || response.statusCode !== 200) {
                console.error("giphy: Got error: " + body);
                console.log(error);
                //console.log(response)
            }
            else {
                var responseObj = JSON.parse(body)
                console.log(responseObj.data[0])
                if(responseObj.data.length){
                    func(responseObj.data[0].id);
                } else {
                    func(undefined);
                }
            }
        }.bind(this));
    }

bot.login(AuthDetails.email, AuthDetails.password);
