var util = require('util');

var BaseTrigger = require('./baseTrigger.js').BaseTrigger;

/*
Take two random words from a sentance
and make them into the format of "I'll X your Y"
I'll random your sentance
*/

var RemBotTrigger = function() {
	RemBotTrigger.super_.apply(this, arguments);
};

util.inherits(RemBotTrigger, BaseTrigger);

var type = "RemBotTrigger";
exports.triggerType = type;
exports.create = function(name, chatBot, options) {
	return new RemBotTrigger(type, name, chatBot, options);
};

// Return true if a message was sent
RemBotTrigger.prototype._respondToFriendMessage = function(userId, message) {
	return this._respond(userId, message);
}

// Return true if a message was sent
RemBotTrigger.prototype._respondToChatMessage = function(roomId, chatterId, message) {
	return this._respond(roomId, message);
}

RemBotTrigger.prototype._respond = function(toId, message) {
	if (this._messageTriggers(message)) {
		var replacement = this._replaceWord(message);
		this._sendMessageAfterDelay(toId, replacement);
		return true;
	}
	return false;
}

RemBotTrigger.prototype._messageTriggers = function(message) {
	var words = message.split(' ');
	return words.length >= 10 && words.length <= 30;
}

RemBotTrigger.prototype._replaceWord = function(message) {
	var words = message.split(' ');
	var wordToReplace = Math.floor(Math.random() * words.length);
	var word2ToReplace = Math.floor(Math.random() * words.length);
	var firstword = words[wordToReplace];
	var secondword = words[word2ToReplace];
	var newwords = ["I'll", firstword, "your", secondword];
	return newwords.join(' ');
}
