var fs = require('fs');
var steam = require('steam');
var winston = require('winston');
var _ = require('underscore');
var http = require('http');
//var SteamTrade = require('steam-trade'); // change to 'steam-trade' if not running from the same directory

var TriggerFactory = require('./triggerFactory.js').TriggerFactory;

var serversFile = 'servers';

// Load latest servers from file
if (fs.existsSync(serversFile)) {
	steam.servers = JSON.parse(fs.readFileSync(serversFile));
}
else {
	winston.warn("No servers file found, using defaults");
}


// Bot should be usually created without options, it is a parameter mainly for testing
var ChatBot = function(username, password, options) {
	this.winston = new winston.Logger;
	this.winston.extend(this.log);
	this.options = options || {};

	this.steamClient = options.client || new steam.SteamClient();
//	this.steamTrade = new SteamTrade
	this.username = username;
	this.password = password;
	if(options.guardCode) this.guardCode = options.guardCode;
	else this.guardCode = false;
	this.sentryFile = undefined;
	this.games = [];
	this.logFile = undefined;
	this.cookie = undefined;
	this.autojoinFile = options.autojoinFile || 'bot.' + this.username+'.autojoin'; this.autojoinRooms = undefined;

	this.winston.add(winston.transports.Console,{
		handleExceptions: false,
		colorize: true,
		timestamp: true,
		level: "info",
		json: false
	});

	var that = this;
	if(!options.logFile || options.logFile != false)  {
		if(options.logFile==true) that.logFile = "bot."+that.username + ".log";
		else that.logFile = options.logFile;
		that.log.info("Logging output to: "+that.logFile);
		that.winston.add(winston.transports.File, { level: "info", colorize:false, timestamp:true, filename:that.logFile,json:false});
	}

	if(options.sentryFile) {
		this.sentryFile = options.sentryFile;
		if(fs.existsSync(options.sentryFile))
			this.log.info("Using sentryfile as defined by options: "+options.sentryfile);
		else
			this.log.warn("Sentry file defined in config does not exist. " + options.sentryFile + " will be created on successful login");
	} else {
		this.log.info("Config file does not define a sentryfile. Attempting to autodetect sentry...");
		if(fs.existsSync('sentry.'+this.username+'.hash'))       { this.sentryFile = 'sentry.'+this.username+'.hash'; this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentry.'+this.username))        { this.sentryFile = 'sentry.'+this.username;         this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('bot.'+this.username+'.hash'))   { this.sentryFile = "bot."+this.username+'.hash';    this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('bot.'+this.username+'.sentry')) { this.sentryFile = "bot."+this.username+'.sentry';  this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync(this.username+'.hash'))          { this.sentryFile = this.username+'.hash';           this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync(this.username+'.sentry'))        { this.sentryFile = this.username+'.sentry';         this.log.info("Sentry file "+this.sentryFile+" detected.");
		} else if(fs.existsSync('sentry'))                       { this.sentryFile = 'sentry'; this.log.warn("Sentry file sentry detected, but it may be incorrect as it does not claim a username. If correct, please rename to bot."+this.username+".sentry or another support sentry filename, or rename and define file name in config.");
		} else { this.sentryFile = "bot."+this.username+".sentry"; this.log.warn("Could not detect a sentryfile, and no guardCode defined. Using default sentryFile "+this.sentryFile+". I hope you have a guardCode defined or steamguard disabled. "); }
	}

	//steamtrade stuffs
//	this.inventory = undefined; this.scrap = undefined; this.weapons = undefined; this.addedScrap = undefined; this.client = undefined; this.trader = undefined;
		
	this.connected = false; // Bot is connected to the steam network
	this.muted = false; // Should not send any messages to a chat room when muted

	this.triggers = {};
	if (options.triggerFactory) {
		this.triggerFactory = options.triggerFactory;
	}
	else {
		this.triggerFactory = new TriggerFactory();
	}

	this.unmutedState = steam.EPersonaState.Online;
	this.mutedState = steam.EPersonaState.Snooze;

	if (options.autoConnect) {
		this.connect();
	}

	var that = this;

	// Connect relevant events
	this.steamClient.on('error', function(error) { that._onError(error); });
	this.steamClient.on('loggedOn',  function() { that._onLoggedOn(); });
	this.steamClient.on('loggedOff', function() { that._onDisconnected(); });
	this.steamClient.on('chatInvite', function(roomId, roomName, inviterId) { that._onChatInvite(roomId, roomName, inviterId); });
	this.steamClient.on('friend', function(userId, relationship) { that._onRelationship(userId, relationship); });
	this.steamClient.on('friendMsg', function(userId, message, type) { that._onFriendMsg(userId, message, type); });
	this.steamClient.on('chatMsg', function(roomId, message, type, chatterId) { that._onChatMsg(roomId, message, type, chatterId); });
	this.steamClient.on('chatStateChange', function(stateChange, chatterActedOn, steamChatId, actedOnBy) { that._onChatStateChange(stateChange, chatterActedOn, steamChatId, actedOnBy); });
	this.steamClient.on('sentry', function(sentry) { that._onSentry(sentry); });

/*
// These events exist in node-steam, but are only half-implemented in this file...
	this.steamClient.on('user', function(obscureData) {that._onUser(obscureData); });
	this.steamClient.on('group', function(group, clanRelationship) {that._onGroup(group, clanRelationship); });
	this.steamClient.on('announcement', function(groupId,headline) {that._onAnnouncement(groupId,headline); });
	this.steamClient.on('richPresence', function(steamId,status,obscureData) {that._onRichPresence(steamId,status,obscureData); });
*/
	
	// Store latest servers
	this.steamClient.on('servers', function(servers) {
		fs.writeFile(serversFile, JSON.stringify(servers));
	});
};


// Public interface

ChatBot.prototype.connect = function() {
	// Continuously try to reconnect if started but not connected 
	// If someone logs in as the bot it will be disconnected, so this allows the bot to recover automatically when it can
	if (this.options.autoReconnect && !this.babysitInterval) {
		var babysitTimer = this.options.babysitTimer || 5*60*1000;
		var that = this;
		this.babysitInterval = setInterval(function() { that.connect(); }, babysitTimer);
	}

	if (!this.connected) {
		winston.info("Trying to connect chat bot " + this.username);

		try {
			if(this.guardCode) this.steamClient.logOn({
				accountName: this.username,
				password: this.password,
				authCode: this.guardCode,
				shaSentryfile: (fs.existsSync(this.sentryFile) ? fs.readFileSync(this.sentryFile) : undefined)
			}); else this.steamClient.logOn({
				accountName: this.username,
				password: this.password,
				shaSentryfile: (fs.existsSync(this.sentryFile) ? fs.readFileSync(this.sentryFile) : undefined)
			});
		}
		catch (err) {
			winston.error("Exception trying to connect chat bot " + this.username, err);
		}
	}
}

ChatBot.prototype.log = function(){};

ChatBot.prototype.mute = function() {
	this.muted = true;
	this._updatePersonaState();
}

ChatBot.prototype.unmute = function() {
	this.muted = false;
	this._updatePersonaState();
}

// Add or replace a trigger - return the trigger or null
ChatBot.prototype.addTrigger = function(name, type, options) {
	if (!name || !type) return false;

	this.removeTrigger(name);

	var trigger = this.triggerFactory.createTrigger(type, name, this, options || {}, true);
	if (trigger) {
		this.triggers[name] = trigger;
		return trigger;
	}
	return null;
}

// Any duplicate names will be replaced
// triggers is of the form [{name:'',type:'',options:{}}, {name:'',type:'',options:{}}, etc]
// Returns true if all were added, false if any couldn't be added
ChatBot.prototype.addTriggers = function(triggers) {
	var ok = true;
	var that = this;
	_.each(triggers, function(trigger) {
		ok = ok && (that.addTrigger(trigger.name, trigger.type, trigger.options) != null);
	});
	return ok;
}

// Returns true if the trigger was removed
ChatBot.prototype.removeTrigger = function(name) {
	if (name in this.triggers) {
		delete this.triggers[name];
		return true;
	}
	return false;
}

ChatBot.prototype.clearTriggers = function() {
	this.triggers = {};
}

// Returns triggers in the same form that can be used for addTriggers
// [{name:'',type:'',options:{}}, {name:'',type:'',options:{}}, etc]

ChatBot.prototype.getTriggerDetails = function() {
	var triggerDetails = [];

	_.each(this.triggers, function(trigger, name) {
		triggerDetails.push({ name: name, type: trigger.type, options: trigger.getOptions() });
	});

	return triggerDetails;
}

ChatBot.prototype.sendMessage = function(steamId, message) {
	this.steamClient.sendMessage(steamId, message);
}

//left this here because some configs might still be using it?
ChatBot.prototype.joinGame = function(appId) {
	this.games=[appId];				//update this.games
	this.steamClient.gamesPlayed([this.games]);
}

//this function will play all the games it's told to. This doesn't always show 
//the first game as the one being played, so there's another function that 
//plays the first game, then waits a fraction of a second to play the others
ChatBot.prototype.setGames = function(appIdArray) {
	this.games=appIdArray;				//update this.games
	this.log.info("Playing gameIDs " + this.games.toString());
	this.steamClient.gamesPlayed(this.games);	//play them!
}

ChatBot.prototype.setPrimaryGame = function(appId,delay) {
	this.log.info("Setting " + appId + " as primary game.");
	if(!this.games || this.games==undefined) this.games=[appId];
	else this.games.unshift(appId);			//update this.games
	this.log.info("Playing gameID " + appId);
	this.steamClient.gamesPlayed([appId]);		//first, play only this game, so it shows up
	var that = this;
	setTimeout(function(){
		that.log.info("Playing gameIDs " + that.games.toString());
		that.steamClient.gamesPlayed(that.games);	//play them!
	},delay);	//play all the games in 1 second.
}


ChatBot.prototype.joinChat = function(roomId, autoJoinAfterDisconnect) {
	this.log.info("Chat bot " + this.username + " joining room " + roomId + " with autoJoinAfterDisconnect " + autoJoinAfterDisconnect);
	this.steamClient.joinChat(roomId);
	if (autoJoinAfterDisconnect) {
		this._addChatToAutojoin(roomId)
	}
}

ChatBot.prototype.leaveChat = function(roomId) {
	this.log.info("Chat bot " + this.username + " leaving room " + roomId);
	this._removeChatFromAutojoin(roomId);
	this.steamClient.leaveChat(roomId);
}

ChatBot.prototype.addFriend = function(userId) {
	this.log.info("Chat bot " + this.username + " adding friend " + this._userString(userId));
	this.steamClient.addFriend(userId);
}

ChatBot.prototype.removeFriend = function(userId) {
	this.log.info("Chat bot " + this.username + " removing friend " + this._userString(userId));
	this.steamClient.removeFriend(userId);
}

ChatBot.prototype.setPersonaName = function(name) {
	this.log.info("Chat bot " + this.username + " changing name to " + name);
	this.steamClient.setPersonaName(name);
}

ChatBot.prototype.setPersonaState = function(state) {
	this.log.info("Chat bot " + this.username + " changing state to " + state);
	this.steamClient.setPersonaState(state);
}

ChatBot.prototype.lockChat = function(roomId) {
	this.log.info("Chat bot " + this.username + " locking chat " + roomId);
	this.steamClient.lockChat(roomId);
}

ChatBot.prototype.unlockChat = function(roomId) {
	this.log.info("Chat bot " + this.username + " unlocking chat " + roomId);
	this.steamClient.unlockChat(roomId);
}

ChatBot.prototype.setModerated = function(roomId) {
	this.log.info("Chat bot " + this.username + " moderating chat " + roomId);
	this.steamClient.setModerated(roomId);
}

ChatBot.prototype.setUnmoderated = function(roomId) {
	this.log.info("Chat bot " + this.username + " unmoderating chat " + roomId);
	this.steamClient.setUnmoderated(roomId);
}

ChatBot.prototype.kick = function(roomId, userId) {
	this.log.info("Chat bot " + this.username + " kicking " + this._userString(userId) + " from " + roomId);
	this.steamClient.kick(roomId, userId);
}

ChatBot.prototype.ban = function(roomId, userId) {
	this.log.info("Chat bot " + this.username + " banning " + this._userString(userId) + " from " + roomId);
	this.steamClient.ban(roomId, userId);
}

ChatBot.prototype.unban = function(roomId, userId) {
	this.log.info("Chat bot " + this.username + " unbanning " + this._userString(userId) + " from " + roomId);
	this.steamClient.unban(roomId, userId);
}

ChatBot.prototype.users = function() {
	return this.steamClient.users;
}

ChatBot.prototype.rooms = function() {
	return this.steamClient.chatRooms;
}

ChatBot.prototype.friends = function() {
	return this.steamClient.friends;
}

ChatBot.prototype.groups = function() {
	return this.steamClient.groups;
}

// "Private" functions

ChatBot.prototype._updatePersonaState = function() {
	this.steamClient.setPersonaState(this.muted ? this.mutedState : this.unmutedState);
}

ChatBot.prototype._userString = function(id) {
	var result = (this.steamClient.users && id in this.steamClient.users) ? (this.steamClient.users[id].playerName + "/") : "";
	result += id;

	return result;
};

ChatBot.prototype._autojoinChatrooms = function() {
	// Auto-join chat rooms that the bot was previously invited to (and not removed from)
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
		var that = this;
		_.each(that.autojoinRooms, function(value, roomId) {
			that.log.info("Chat bot " + that.username + " auto-joining room " + roomId);
			that.steamClient.joinChat(roomId);
		});
	}
}

ChatBot.prototype._addChatToAutojoin = function(roomId) {
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
	}
	else {
		this.autojoinRooms = {};
	}
	this.autojoinRooms[roomId] = true;

	fs.writeFileSync(this.autojoinFile, JSON.stringify(this.autojoinRooms));
}

ChatBot.prototype._removeChatFromAutojoin = function(roomId) {
	if (fs.existsSync(this.autojoinFile)) {
		this.autojoinRooms = JSON.parse(fs.readFileSync(this.autojoinFile));
		if (this.autojoinRooms[roomId]) {
			delete this.autojoinRooms[roomId];
			fs.writeFileSync(this.autojoinFile, JSON.stringify(this.autojoinRooms));
		}
	}
}

// Steam Events

ChatBot.prototype._onError = function(error) { 
	this.log.error("Caught error", error);
	this.log.error(error); // don't know why parameter to winston.error isn't working
	this.connected = false;
};

ChatBot.prototype._onLoggedOn = function() {
	this.log.info("ChatBot " + this.username + " logged on");
	this.connected = true;
	this._updatePersonaState();
	this._autojoinChatrooms();
	this.steamClient.gamesPlayed(this.games);
//	setTimeout("this.steamClient.gamesPlayed([this.games[1]])",14400000);
}

ChatBot.prototype._onDisconnected = function() {
	this.log.warn("ChatBot " + this.username + " disconnected");
	this.connected = false;
}

ChatBot.prototype._onChatInvite = function(roomId, roomName, inviterId) { 
	this.log.info("ChatBot " + this.username + " was invited to chat in " + roomName + " (" + roomId + ")" + " by " + this._userString(inviterId));

	_.each(this.triggers, function(trigger) {
		trigger.onChatInvite(roomId, roomName, inviterId);
	});
};

ChatBot.prototype._onRelationship = function(userId, relationship) { 
	this.log.info("ChatBot " + this.username + " relationship event for " + this._userString(userId) + " type " + relationship);

	if (relationship == steam.EFriendRelationship.PendingInvitee) {
		_.each(this.triggers, function(trigger) {
			trigger.onFriendRequest(userId);
		});
	}
};

ChatBot.prototype._onFriendMsg = function(userId, message, type) { 
	this.log.info("ChatBot " + this.username + " friendMsg " + type + " <" + this._userString(userId) + ">: " + message);

	if (type == steam.EChatEntryType.ChatMsg) {
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onFriendMessage(userId, message, haveSentMessage);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatMsg = function(roomId, message, type, chatterId) { 
	this.log.info("ChatBot " + this.username + " chatMsg " + type + " in " + roomId + " <" + this._userString(chatterId) + ">: " + message);

	if (type == steam.EChatEntryType.ChatMsg) {
		var that = this;
		var haveSentMessage = false;
		_.each(this.triggers, function(trigger) {
			var sentMessageThisTrigger = trigger.onChatMessage(roomId, chatterId, message, haveSentMessage, that.muted);
			haveSentMessage = haveSentMessage || sentMessageThisTrigger;
		});
	}
};

ChatBot.prototype._onChatStateChange = function(stateChange, chatterActedOn, steamChatId, chatterActedBy) { 
	this.log.info("ChatBot " + this.username + " chatStateChange " + stateChange + " in " + steamChatId + " " + chatterActedOn + " acted on by " + chatterActedBy);

	if ((stateChange & steam.EChatMemberStateChange.Kicked) > 0 && chatterActedOn == this.steamClient.steamID) {
		this.log.info("ChatBot was kicked from chat room " + steamChatId + " by " + this._userString(chatterActedBy));

		// Kicked from chat - don't autojoin
		//this._removeChatFromAutojoin(steamChatId);
		this.steamClient.joinChat(steamChatId);
	}

	if ((stateChange & steam.EChatMemberStateChange.Entered) > 0) {
		this.log.info(this._userString(chatterActedOn) + " joined " + steamChatId);

		var that = this;
		_.each(this.triggers, function(trigger) {
			trigger.onEnteredChat(steamChatId, chatterActedOn, that.muted);
		});
	}
};

ChatBot.prototype._onSentry = function(sentry) {
	if(this.sentryFile) {
		this.log.info("Obtained sentry. Writing to "+this.sentryFile);
		fs.writeFileSync(this.sentryFile, sentry);
	} else {
		this.log.info("Obtained sentry. Writing to "+this.username+'.hash', sentry);
		fs.writeFileSync("bot."+this.username+'.sentry', sentry);
	}
}


/*
 * This crap is possibly not implemented correctly/fully. Don't expect it to work right without testing it. For info, see https://github.com/seishun/node-steam

	ChatBot.prototype._onLoggedOff = function() {
		this.log.warning("ChatBot " + this.username + " logged off!");
		_.each(this.triggers, function(trigger) {
			trigger.onLoggedOff();
		});
	}
	
	ChatBot.prototype._onUser = function(obscureData) {
		this.log.info("ChatBot " + this.username + " - User event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onUserEvent(obscureData);
		});
	}
	
	ChatBot.prototype._onFriend = function(steamId,friendRelationship) {
		this.log.info("ChatBot " + this.username + " - Friend relationship event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onFriendEvent(steamId,friendRelationship);
		});
	}
	
	ChatBot.prototype._onGroup = function(steamId,clanRelationship) {
		this.log.info("ChatBot " + this.username + " - Group relationship event detected");
		_.each(this.triggers, function(trigger) {
			trigger.onGroupEvent(steamId,clanRelationship);
		});
	}

	ChatBot.prototype._onAnnouncement = function(groupId,headline) {
		this.log.info("ChatBot " + this.username + " Announcement in " + groupId + ": " + headline);
		_.each(this.triggers, function(trigger) {
			trigger.onAnnouncement(groupId,headline);
		});
	}

	ChatBot.prototype._onRichPresence = function(steamId,status,obscureData) {
		this.log.info("ChatBot " + this.username + " - Rich presence event detected for user " + this._userString(steamId) + " - Status: " + status);
		_.each(this.triggers, function(trigger) {
			trigger.onRichPresence(steamId,status,obscureData);
		});
	}
*/

/* 
// This is disabled because all steamTrade functionality was removed. Cookie
// does not work correctly, so this does not work. Leaving code here anyways.
ChatBot.prototype.makeAnnouncement = function(head, body, source) {
	var that = this;
	that.post_data = querystring.stringify({
		'sessionID' : that.steamTrade.sessionID,
		'action' : 'post',
		'headline' : head,
		'body' : body
	});
	var post_options = {
		host: 'steamcommunity.com',
		port: '80',
		method: 'POST',
		headers: {
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : post_data.length,
			'cookie' : that.cookie
		}
	};
	var post_req = http.request(post_options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			that.log.info("Announcement created: " + head);
			that.steamClient.sendMessage(source, "Announcement created: " + head);
		});
	});
	post_req.write(post_data);
	post_req.end();
}
*/

exports.ChatBot = ChatBot;
