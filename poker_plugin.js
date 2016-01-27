var util = require('util');
var winston = require('winston');
var PokerEvaluator = require("poker-evaluator");
//Removed sidebet functionality - unsure of problems, will reimplement when there's spare time during sem.

function Poker () {
	this.game = false;
	this.deck = new Deck();
	this.players = [];
	this.current_player = null;
	this.community = [];
	this.bigblind = 50;
	this.smallblind = 25;
	this.small = null;
	this.bet = 0;
	this.pot = 0;
	this.big = null;
	this.hand = null;
	this.round = null;
	this.buyin = 0;
	this.activeChannel = null;
	this.players_left = 0;
	this.first_player = null;
};

function Card (rank, suit) {

    this.rank = rank;
    this.suit = suit;
	this.dealt = false;

};

function Deck() {

    this.deck = new Array();

    this.makeDeck = makeDeck;
    this.shuffle = shuffle;
	this.deal = deal;
}
function makeDeck() {

    var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9", "10",
                    "J", "Q", "K");
    var suits = new Array("Clubs", "Diamonds", "Hearts", "Spades");

    this.deck = [];

    var i, j;
    for (i = 0; i < suits.length; i++) {
        for (j = 0; j < ranks.length; j++) {
            this.deck.push(new Card(ranks[j], suits[i]));
        }
    }
};

function shuffle() {
    var counter = this.deck.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = this.deck[counter];
        this.deck[counter] = this.deck[index];
        this.deck[index] = temp;
    }
}


function deal() {

    if (this.deck.length > 0) {
        return this.deck.shift();
    }
    else return null;
};

Poker.prototype.money = function (msg, bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	var money,bet,i;
	for (i=0; i < this.players.length; i++) {
		money = this.players[i].money;
		bet = this.players[i].bet;
		bot.sendMessage(msg.author, this.players[i].user + " currently has $" + money +" on hand and $" + bet +" in the pot.");
	}	
}
Poker.prototype.cardShow = function (msg,bot,type){
	if (this.game != 'session') {
		bot.sendMessage(msg.author, "A game is not in session.");
		return;
	}
	if (type == "community") {
		switch (this.round) {
			case 0:
				bot.sendMessage(msg.author, "There are no cards on the table preflop.")
				break;
			case 1:
				bot.sendMessage(msg.author, "Cards on table: " + cardToText(this.community[0]) + " " + cardToText(this.community[1]) + " " + cardToText(this.community[2]));
				break;
			case 2:
				bot.sendMessage(msg.author, "Cards on table: " + cardToText(this.community[0]) + " " + cardToText(this.community[1]) + " " + cardToText(this.community[2]) + " " + cardToText(this.community[3]));
				break;
			case 3:
				bot.sendMessage(msg.author, "Cards on table: " + cardToText(this.community[0]) + " " + cardToText(this.community[1]) + " " + cardToText(this.community[2]) + " " + cardToText(this.community[3]) + " " + cardToText(this.community[4]));
				break;
		}
	} else if (type == "player_hand") {
		var i;
		for (i=0; i < this.players.length; i++) {
			if (msg.author.username === this.players[i].user.username) {
				bot.sendMessage(this.players[i].user, "["+this.hand+"] Your hand is: " + cardToText(this.players[i].hand[0]) + " " + cardToText(this.players[i].hand[1]) +".");
				return;
			}
		}
		bot.sendMessage(msg.author, "You are not currently in the game.")
	}
}
Poker.prototype.checkBet = function(msg, bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.author, "A game is not in session.");
		return;
	}
	
	for (i=0; i < this.players.length; i++) {
		if (msg.author.username === this.players[i].user.username) {
			bot.sendMessage(msg.author, "The current bet is $"+ this.pot+".\n" + "Your current bet is $" +this.players[i].bet + ".");
			return;
		}
	}
	bot.sendMessage(msg.author, "You are not currently in the game.")
}

Poker.prototype.add = function (msg, bot) {
	var i;
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	var args = msg.split(" ");
	if (args.length < 2) {
		bot.sendMessage(this.activeChannel,"Invalid arguments provided.");
		return;
	}
	for (i=0; i < this.players.length; i++) {
		if (this.players[i].user.username == args[0]) {
			this.players[i].money += parseInt(args[1]);
			bot.sendMessage(this.activeChannel, "$" + args[1] + " given to " + this.players[i].user +".")
			return;
		}
	}
	bot.sendMessage(msg.author, "Player not found in this game.")
}
Poker.prototype.remove = function (msg, bot) {
	var i;
	if (this.game == 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	var args = msg.split(" ");
	if (args.length < 2) {
		bot.sendMessage(this.activeChannel,"Invalid arguments provided.");
		return;
	}
	for (i=0; i < this.players.length; i++) {
		if (this.players[i].user.username == args[0]) {
			this.players[i].money -= parseInt(args[1]);
			bot.sendMessage(this.activeChannel, "$" + args[1] + " removed from " + this.players[i].user +".")
			return;
		}
	}
	bot.sendMessage(msg.author, "Player not found in this game.")
}

Poker.prototype.leave = function (msg, bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	if (msg.author.username == this.players[this.current_player].user.username) {
		bot.sendMessage(msg.author, "You cannot leave the table while it is your turn.");
		return;
	}
	for (i=0; i < this.players.length; i++) {
		if (this.players[i].user.username == msg.author) {
			this.players.splice(i,1);
			bot.sendMessage(this.activeChannel,msg.author+" has left the game.");
			return;
		}
	}
	bot.sendMessage(msg.author, "You can't leave a game you aren't even in.")
}
Poker.prototype.new = function (query, msg, bot) {
	if (query.length == 0) {
		bot.sendMessage(msg.channel, "Please specify a buy in amount.");
		return;
	}
	if (this.game != false) {
		bot.sendMessage(msg.channel, "A game has already been created.");
		return;
	}
	var num = parseInt(query);
	if (num <= 500) {
		bot.sendMessage(msg.channel, "You will need more money than that to make it interesting.");
		return;
	}
	//Makes new game, after checking conditions
	//Initalises the deck, and sets buy in
	this.deck.makeDeck();
	this.game = true;
	this.activeChannel = msg.channel;
	
	this.buyin = num;
	bot.sendMessage(msg.channel, msg.author+" has started a Texas hold 'em with a buy in of $"+ num +"!\n" + "Small blinds will start at 25, and big blinds at 50.\n" + "Message !join into the chat to join the game (maximum 8 players).");
};

Poker.prototype.join = function (query, msg, bot) {
	if (this.game == false || this.game == 'session') {
		bot.sendMessage(msg.channel, "A game is not currently in session, or is already in session and thus unjoinable.")
		return;
	}
	var i;
	//console.log(util.inspect(msg.author, {showHidden: false, depth: 4}));
	for (i=0; i < this.players.length; i++){
		if (this.players[i].user.username === msg.author.username) {
			bot.sendMessage(msg.channel, msg.author+" is already in the game.");
			return;
		}
	}
	//Creates player object for joining player and adds to array
	var player = {
		'user' : msg.author,
		'hand' : [],
		'fold' : false,
		'bet' : 0,
		'last_move' : null,
		//'side_pot_ineligible' : false,
		'money': 0,
		'handResult' : null,
	}
	player.money = this.buyin;
	bot.sendMessage(msg.channel, msg.author+" has entered the game.");
	
	this.players.push(player);
}                                         

Poker.prototype.opening =  function (msg, bot) {
	if (this.game != true) {
		bot.sendMessage(msg.channel, "A game is not currently in recruitment, or is already in session.")
		return;
	}
	var playerCount = this.players.length;
	if (playerCount < 2) {
		bot.sendMessage(msg.channel, "There aren't enough players in the game!");
		return;
	}
	bot.sendMessage(msg.channel, msg.author + " has started the game. Opening hands are being dealt.");
	//Game starts at pre flop on hand 1
	this.deck.shuffle();
	this.game = 'session';
	this.hand = 1;
	this.round = 0;
	this.players_left = this.players.length;
	var i,j;
	//Deals opening hands via DM
	for (i=0; i < 2; i++){
		for (j=0; j < playerCount; j++){
			this.players[j].hand.push(this.deck.deal());
		}
	}
	for (j=0; j < playerCount;j++) {
		var card1 = cardToText(this.players[j].hand[0]);
		var card2 = cardToText(this.players[j].hand[1]);
		/*switch (this.players[j].hand[0].suit)   {
			case 'Clubs' :
				card1 = this.players[j].hand[0].rank + ":clubs:";
				break;
			case 'Spades' :
				card1 = this.players[j].hand[0].rank + ":spades:";
				break;
			case 'Diamonds' :
				card1 = this.players[j].hand[0].rank + ":diamonds:";
				break;
			case 'Hearts' :
				card1 = this.players[j].hand[0].rank + ":hearts:";
				break;
		}
		switch (this.players[j].hand[1].suit)   {
			case 'Clubs' :
				card2 = this.players[j].hand[1].rank + ":clubs:";
				break;
			case 'Spades' :
				card2 = this.players[j].hand[1].rank + ":spades:";
				break;
			case 'Diamonds' :
				card2 = this.players[j].hand[1].rank + ":diamonds:";
				break;
			case 'Hearts' :
				card2 = this.players[j].hand[1].rank + ":hearts:";
				break;
		}*/
		bot.sendMessage(this.players[j].user, "[1] Your hand is: " + card1 + " " + card2 +".");
	}
	//Randomly hands out big blind, gives small blind to person to the left in the array
	this.big = randomWithRange(0,this.players.length-1);
	this.players[this.big].blind = "big";
	if (this.big - 1 < 0) {
		this.small = this.players.length - 1;
	} else {
		this.small = this.big - 1;
	}
	sleep(300);
	bot.sendMessage(msg.channel, this.players[this.big].user +" starts off with the big blind. "+this.players[this.small].user+" starts off with the small blind.");
	//Money deducted from players and added to pot
	this.players[this.big].money -= this.bigblind;
	this.players[this.big].bet = this.bigblind;
	this.players[this.small].money -= this.smallblind;
	this.players[this.small].bet = this.smallblind
	this.pot = this.pot + this.bigblind + this.smallblind;
	sleep(400);
	bot.sendMessage(msg.channel, this.players[(this.big+1)%this.players.length].user+" to act first.");
	this.current_player = (this.big+1)%this.players.length;
	this.first_player = this.current_player;
	this.bet = this.bigblind;
	this.players_left = this.players.length;
}

Poker.prototype.raise = function (query, msg, bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	if (msg.author.username != this.players[this.current_player].user.username) {
		bot.sendMessage(msg.author, "It is not your turn to act.");
		return;
	}
	if (query.length == 0) {
		bot.sendMessage(msg.channel, "Please specify an amount to raise by.");
		return;
	}
	var num = parseInt(query)
	if (num < 1) {
		bot.sendMessage(msg.channel, "Please raise by a positive number.")
		return;
	}
	if (this.players[this.current_player].money - (this.bet + num - this.players[this.current_player].bet) < 0) {
		bot.sendMessage(msg.channel, "You don't have enough money to do this.");
		return;
	}
	this.bet += num;
	var loopcount = 0;
	//Raises bet by query amount, and deducts from money ana adds to pot
	this.players[this.current_player].money -= this.bet - this.players[this.current_player].bet;
	this.players[this.current_player].bet = this.bet;
	this.pot += num;
	this.players[this.current_player].last_move = "raise";
	bot.sendMessage(msg.channel, msg.author + " has raised by $" + num +". The total bet for the hand is $"+this.bet+".");
	//Finds next player to the right in array to pass turn
	this.current_player = (this.current_player+1)%this.players.length;
	while (this.players[this.current_player].fold == true || this.players[this.current_player].money <= 0) {
			this.current_player = (this.current_player+1)%this.players.length;
			if (loopcount > this.players.length){
				bot.sendMessage(msg.channel, "No one else had any money though, so there was no point.");
				break;
			}
	}
	if (endOfRoundCheck(this,bot) === true) {
		return;
	}
	sleep(500);
	bot.sendMessage(msg.channel, this.players[this.current_player].user +" to act.");
}	

Poker.prototype.fold = function (msg,bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	if (msg.author.username != this.players[this.current_player].user.username) {
		bot.sendMessage(msg.author, "It is not your turn to act.");
		return;
	}
	var loopcount = 0;
	bot.sendMessage(msg.channel, msg.author + " has folded.");
	//Changes player to folded, removes players from players left active
	this.players[this.current_player].fold = true;
	this.players_left--;
	this.players[this.current_player].last_move = "fold";
	if (this.players_left == 1) {
		var winner,i;
		for (i=0; i < this.players.length; i++) {
			if (this.players[i].fold == false){
				winner = i;
				endRound(winner,this,bot);
				return;
			}			
		}
	}
	//Finds next player to the right in array to pass turn
	this.current_player = (this.current_player+1)%this.players.length;
	while (this.players[this.current_player].fold == true || this.players[this.current_player].money <= 0) {
			this.current_player = (this.current_player+1)%this.players.length;
			if (loopcount > this.players.length){
				break;
			}
	}
	console.log("Fold: before endofRoundCheck")
	if (endOfRoundCheck(this,bot) === true) {
			console.log("Fold: after endofRoundCheck")
		return;
	}
	console.log("Fold: skip endofRoundCheck")
	sleep(500);
	bot.sendMessage(msg.channel, this.players[this.current_player].user +" to act.");
}

Poker.prototype.check = function (msg,bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	if (msg.author.username != this.players[this.current_player].user.username) {
		bot.sendMessage(msg.author, "It is not your turn to act.");
		return;
	}
	if (this.players[this.current_player].bet != this.bet) {
		bot.sendMessage(msg.channel, "You must call or further raise the bet.");
		console.log(this.players[this.current_player].bet);
		console.log(this.bet);
		return;
	}
	var loopcount = 0;
	bot.sendMessage(msg.channel, msg.author + " has checked.");
	this.players[this.current_player].last_move = "check";
	//Finds next player etc.
//	this.current_player = (this.current_player+1)%this.players.length;
	this.current_player = (this.current_player+1)%this.players.length;
	while (this.players[this.current_player].fold == true || this.players[this.current_player].money <= 0) {
			this.current_player = (this.current_player+1)%this.players.length;
			loopcount++;
			if (loopcount > this.players.length){
				break;
			}
	}
	if (endOfRoundCheck(this,bot) === true) {
		return;
	}
	sleep(500);
	bot.sendMessage(msg.channel, this.players[this.current_player].user +" to act.");
	
}

Poker.prototype.call = function (msg,bot) {
	if (this.game != 'session') {
		bot.sendMessage(msg.channel, "A game is not in session.");
		return;
	}
	if (msg.author.username != this.players[this.current_player].user.username) {
		bot.sendMessage(msg.author, "It is not your turn to act.");
		return;
	}
	if (this.bet == this.players[this.current_player.bet]) {
		this.check(msg,bot);
		return;
	}
	var loopcount = 0;
	//Sets player's current bet to the current round bet, and deducts difference from money and adds to pot
	if (this.players[this.current_player].money - (this.bet - this.players[this.current_player].bet) <= 0) {
		//sidepot created
		this.players[this.current_player].bet += this.players[this.current_player].money;
		this.pot += this.players[this.current_player].money;
		this.players[this.current_player].money = 0;
		//this.players[this.current_player].side_pot_ineligible = true;
		bot.sendMessage(msg.channel, msg.author + " calls the bet of $" + this.bet +". A side pot should be created.");
	} else {
		this.players[this.current_player].money = this.players[this.current_player].money - (this.bet - this.players[this.current_player].bet);
		this.pot = this.pot + (this.bet - this.players[this.current_player].bet);
		this.players[this.current_player].bet = this.bet;
		bot.sendMessage(msg.channel, msg.author + " calls the bet of $" + this.bet +".");
	}
	console.log("bet passed")
	this.players[this.current_player].last_move = "call";
	//Finds next player etc.
//	this.current_player = (this.current_player+1)%this.players.length;
	this.current_player = (this.current_player+1)%this.players.length;
	while (this.players[this.current_player].fold == true || this.players[this.current_player].money <= 0) {
			this.current_player = (this.current_player+1)%this.players.length;
			loopcount++;
			if (loopcount > this.players.length){
				break;
			}
	}
	if (endOfRoundCheck(this,bot) === true) {
		return;
	}
	sleep(500);
	bot.sendMessage(msg.channel, this.players[this.current_player].user +" to act.");
}


function endOfRoundCheck (poker,bot) {
	if (poker.players[poker.current_player].bet == poker.bet && poker.players[poker.current_player].last_move != null) {
		console.log("EORC: true")
		nextRound(poker,bot);
		return true;
	} else {
		console.log("EORC: false")
		return false;
	}
}	
function sleep(miliseconds) {
    var currentTime = new Date().getTime();

    while (currentTime + miliseconds >= new Date().getTime()) {
    }
 }
	
function nextRound(poker,bot) {
	//from preflop to flop
	var i = 0;
	var players_active = 0;
	console.log("nextRound")
	sleep(500);
	if (poker.round === 0) {
		var card1 = poker.deck.deal();
		var card2 = poker.deck.deal();
		var card3 = poker.deck.deal();
		poker.community.push (card1);
		poker.community.push (card2);
		poker.community.push (card3);
		
		for (i=0; i < poker.players.length; i++){
			poker.players[i].last_move = null;
			if (poker.players[i].money > 0){
				players_active++;
			}
		}
		poker.round++;
		poker.current_player = poker.first_player;
		if (players_active < 2) {
			nextRound(poker,bot);
			return;
		}
        while (poker.players[poker.current_player].fold == true || poker.players[poker.current_player].money <= 0) {
			poker.current_player = (poker.current_player+1)%poker.players.length;	
		}
		bot.sendMessage(poker.activeChannel, "Preflop round has ended. Now dealing flop.\nCards on table: " + cardToText(poker.community[0]) + " " + cardToText(poker.community[1]) + " " + cardToText(poker.community[2]));
		sleep(400);
		bot.sendMessage(poker.activeChannel, poker.players[poker.current_player].user+" to act first.");

	} 
	//from flop to turn
	else if (poker.round === 1) {
		var card4 = poker.deck.deal();
		poker.community.push (card4);
		for (i=0; i < poker.players.length; i++){
			poker.players[i].last_move = null;
			if (poker.players[i].money > 0){
				players_active++;
			}
		}
		poker.current_player = poker.first_player;
		poker.round++;
		if (players_active < 2) {
			nextRound(poker,bot);
			return;
		}
		while (poker.players[poker.current_player].fold == true || poker.players[poker.current_player].money <= 0) {
			poker.current_player = (poker.current_player+1)%poker.players.length;
		}
		bot.sendMessage(poker.activeChannel, "Flop round has ended. Now dealing turn.\nCards on table: " + cardToText(poker.community[0]) + " " + cardToText(poker.community[1]) + " " + cardToText(poker.community[2]) + " " + cardToText(poker.community[3]));
		sleep(400);
		bot.sendMessage(poker.activeChannel, poker.players[poker.current_player].user+" to act first.");
	}
	//from river to river
	else if (poker.round === 2) {
		var card5 = poker.deck.deal();
		poker.community.push (card5);
				for (i=0; i < poker.players.length; i++){
			poker.players[i].last_move = null;
			if (poker.players[i].money > 0){
				players_active++;
			}
		}
		poker.current_player = poker.first_player;
		poker.round++;
		if (players_active < 2) {
			nextRound(poker,bot);
			return;
		}
		while (poker.players[poker.current_player].fold == true || poker.players[poker.current_player].money <= 0) {
			poker.current_player = (poker.current_player+1)%poker.players.length;
		}
		bot.sendMessage(poker.activeChannel, "River round has ended. Now dealing river.\nCards on table: " + cardToText(poker.community[0]) + " " + cardToText(poker.community[1]) + " " + cardToText(poker.community[2]) + " " + cardToText(poker.community[3]) + " " + cardToText(poker.community[4]));
		sleep(400);
		bot.sendMessage(poker.activeChannel, poker.players[poker.current_player].user+" to act first.");
	}
	//from turn to reveal
	else if (poker.round === 3) {
		console.log("nextRound: Revealing cards")
		bot.sendMessage(poker.activeChannel, "Betting has ended. Now revealing cards.\n" + "Cards on table: " + cardToText(poker.community[0]) + " " + cardToText(poker.community[1]) + " " + cardToText(poker.community[2]) + " " + cardToText(poker.community[3]) + " " + cardToText(poker.community[4]));
		for (i=0; i < poker.players.length; i++)
		{ //Presents everyone's hands.
		console.log("nextRound: inside revealing for loop")
			if (poker.players[i].fold == false){
				console.log("nextRound: Revealing a player's cards")
				poker.players[i].handResult = PokerEvaluator.evalHand([String(cardToEval(poker.community[0])), String(cardToEval(poker.community[1])), String(cardToEval(poker.community[2])), String(cardToEval(poker.community[3])), String(cardToEval(poker.community[4])), String(cardToEval(poker.players[i].hand[0])), String(cardToEval(poker.players[i].hand[1]))]);
				bot.sendMessage(poker.activeChannel, poker.players[i].user + " has: " + cardToText(poker.players[i].hand[0]) + " " + cardToText(poker.players[i].hand[1]) +"." + " A " + poker.players[i].handResult.handName+".");
			}
		}
		console.log("nextRound: before endRound")
		endRound(findWinner(poker),poker,bot);
	}
}

function findWinner (poker){
	console.log("inside finding winner")
	var bestHand = 0;
	var i = 0;
	while (poker.players[i].fold == true) {
		bestHand++;
		i++;
	}
	for (i=0; i < poker.players.length; i++) {
		if (poker.players[i].fold == false){
			if (poker.players[i].handResult.handType > poker.players[bestHand].handResult.handType){
				bestHand = i;
			} else if (poker.players[i].handResult.handType == poker.players[bestHand].handResult.handType && poker.players[i].handResult.handRank > poker.players[bestHand].handResult.handRank) {
				bestHand = i;
			}
		}
	}
	console.log("returning from finding winner")
	return bestHand;
}

function endRound (winner, poker, bot){
	var i;
	console.log("in endRound")
	//if (poker.players[winner].side_pot_ineligible == false) {
		console.log("in endRound, side pot false")
		bot.sendMessage(poker.activeChannel, poker.players[winner].user+ " wins the hand! The pot of $" + poker.pot + " is added to their stack. Please sort out side pot yourself.");
		poker.players[winner].money += poker.pot;
	/*
	} else {
		var main_pot = 0;
		for (i=0; i < poker.players.length; i++) {
			if (poker.player[i].bet >= poker.players[winner].bet) {
				poker.players[i].bet -=  poker.players[winner].bet
				main_pot +=  poker.players[winner].bet;
			} else {
				main_pot += poker.player[i].bet;
				poker.player[i].bet = 0;
			}
		}
		bot.sendMessage(poker.activeChannel, poker.players[winner].user+ " wins the hand! The pot of $" + main_pot + " is added to their stack.");
		var side_pot = poker.pot - main_pot;
		if (side_pot > 0){
			poker.players[winner].money += main_pot;
			poker.player[winner].fold = true;
			var side_winner = findWinner(poker);
		
			bot.sendMessage(poker.activeChannel, poker.players[side_winner].user+ " wins the side pot of $" + side_pot + ".");
			poker.players[side_winner].money += side_pot;
		}
	}
	*/
	console.log("before nextHand")
	nextHand(poker,bot);
}

function nextHand(poker,bot){
	var i,j;
	console.log("in nextHand")
	poker.deck = new Deck();
	poker.deck.makeDeck();
	poker.deck.shuffle();
	for (i=0; i < poker.players.length; i++) {
		if (poker.players[i].money < 1) {
			bot.sendMessage(poker.activeChannel, poker.players[i].user + " has been eliminated.");
			poker.players.splice(i,1);
			continue;
		}
		poker.players[i].hand.length = 0;
		poker.players[i].fold = false;
		poker.players[i].bet = 0;
		poker.players[i].last_move = null;
		//poker.players[i].side_pot_ineligible = false;
	}
	if (poker.players.length < 2) {
		bot.sendMessage(poker.activeChannel, poker.players[0].user + " has won. Game is now finished.");
		poker.game = false;
		return;
	}

	poker.community.length = 0;
	poker.hand++;
	poker.round = 0;
	poker.pot = 0;
console.log("before dealing cards");
	for (i=0; i < 2; i++){
		for (j=0; j < poker.players.length; j++){
			poker.players[j].hand.push(poker.deck.deal());
		}
	}
	for (j=0; j < poker.players.length;j++) {
		var card1 = cardToText(poker.players[j].hand[0]);
		var card2 = cardToText(poker.players[j].hand[1]);
		bot.sendMessage(poker.players[j].user, "["+poker.hand+"] Your hand is: " + card1 + " " + card2 +".");
	};
	console.log("after dealing");
	poker.big = (poker.big + 1) % poker.players.length;
	poker.small = (poker.small + 1) % poker.players.length;
	bot.sendMessage(poker.activeChannel, poker.players[poker.big].user +" now has the big blind. "+poker.players[poker.small].user+" now has the small blind.");
	//Money deducted from players and added to pot
	console.log("before money deduction")
	if (poker.players[poker.big].money < poker.bigblind){
		poker.players[poker.big].bet += poker.players[poker.big].money;
		poker.pot += poker.players[poker.big].money;
		poker.players[poker.big].money = 0;
		//poker.players[poker.big].side_pot_ineligible = true;
		bot.sendMessage(msg.channel, poker.players[poker.big].user + " has insufficient money for the big blind. A side pot should be created.");
    } else  {
		poker.players[poker.big].money -= poker.bigblind;
		poker.players[poker.big].bet = poker.bigblind;
		poker.pot = poker.pot + poker.bigblind;
	}
	
	if (poker.players[poker.small].money < poker.smallblind){
		poker.players[poker.small].bet += poker.players[poker.small].money;
		poker.pot += poker.players[poker.small].money;
		poker.players[poker.small].money = 0;
		//poker.players[poker.small].side_pot_ineligible = true;
		bot.sendMessage(msg.channel, poker.players[poker.small].user + " has insufficient money for the small blind. A side pot should be created.");
    } else  {
		poker.players[poker.small].money -= poker.smallblind;
		poker.players[poker.small].bet = poker.smallblind
		poker.pot = poker.pot + poker.smallblind;
	}
	console.log("after money duction")
	sleep(400);
	bot.sendMessage(poker.activeChannel, "Hand has been complete. Dealing new round.\n" + poker.players[(poker.big+1)%poker.players.length].user+" to act first.");
	poker.current_player = (poker.big+1)%poker.players.length;
	poker.first_player = poker.current_player;
	poker.bet = poker.bigblind;
	poker.players_left = poker.players.length;
	
}


function cardToText (card) {
	var cardText;
	switch (card.suit)   {
			case 'Clubs' :
				cardText = card.rank + ":clubs:";
				break;
			case 'Spades' :
				cardText = card.rank + ":spades:";
				break;
			case 'Diamonds' :
				cardText = card.rank + ":diamonds:";
				break;
			case 'Hearts' :
				cardText = card.rank + ":hearts:";
				break;
		}
	return cardText;
	
}
function cardToEval (card) {
	 var cardEval;
	 switch (card.suit)   {
			case 'Clubs' :
				if (card.rank == '10') {
					cardEval = "Tc";
				} else {
					cardEval = card.rank + "c";
				}
				break;
			case 'Spades' :
				if (card.rank == '10') {
					cardEval = "Ts";
				} else {
					cardEval = card.rank + "s";
				}
				break;
			case 'Diamonds' :
				if (card.rank == '10') {
					cardEval = "Td";
				} else {
					cardEval = card.rank + "d";
				}
				break;
			case 'Hearts' :
				if (card.rank == '10') {
					cardEval = "Th";
				} else {
					cardEval = card.rank + "h";
				}
				break;
		}
	return cardEval;
}
function randomWithRange(min, max) {
   var range = (max - min) + 1;     
   return parseInt(Math.random() * range + min);
}


module.exports = Poker;