var util = require('util');
var winston = require('winston');

function Poker () = {
	this.game = false;
	this.deck = new Array(52);
	this.players = [];
	this.current_player : null;
	this.community = [];
	this.bigblind = 50;
	this.smallblind = 25;
	this.round = null;
	this.buyin = 0;
};


Poker.prototype.new = function (msg, channel, bot) {
	if (msg <= 500) {
		bot.sendMessage(msg.channel, "You will need more money than that to make it interesting.");
		return;
	}
	init_deck(this);
	this.game = true;
	bot.sendMessage(msg.channel, "@"+msg.author+" has started a Texas hold 'em with a buy in of "+ msg);
	this.buyin = msg;
	bot.sendMessage(msg.channel, "Small blinds will start at 25, and big blinds at 50.");
	bot.sendMessage(msg.channel, "Message !join into the chat to join the game (maximum 8 players).");
};

Poker.prototype.join = function (msg, channel, bot) {
	if (this.game = false) {
		bot.sendMessage(msg.channel, "A game is not currently in session, or is already in session and thus unjoinable.")
	}
	var player = {
		'user' : msg.author,
		'hand' : [];
	}
	player.money = this.buyin;
	bot.sendMessage(msg.channel, "@"+msg.author.username+" has entered the game.");
	
	this.players.push(player);
}
	
function randomWithRange(min, max)
{
   var range = (max - min) + 1;     
   return parseInt(Math.random() * range + min);
}

function init_deck (poker)
{
	var i;
    for (i = 0; i < 52; i++)
    {
        poker.deck[i].idx = i;

        if ((i + 1) % 13 != 0)
            poker.deck[i].value = (i + 1) % 13;
        else
            poker.deck[i].value = 13;
        
        poker.deck[i].suit = i / 13;
        poker.deck[i].dealt = 0;
    }
}

module.exports = Poker;