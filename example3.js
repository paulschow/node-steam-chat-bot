#!/bin/nodejs -
function $(arg){ return arg; }

var ChatBot = require('steam-chat-bot').ChatBot;

var adminUser = ['76561197985524650','76561198006646114','76561197995578587','76561198005312221','76561198026108296'];   // this is an example of a user that's allowed to use commands nobody else can; see how it's used below.
//var adminUser = ['76561198006646114'];   // this is an example of a user that's allowed to use commands nobody else can; see how it's used below.
var ignoredUser = ['76561198021653348','76561198015027919']; // this is an example of a user that's not allowed to use commands everyone else can; see how it's used below.
var ignoredChat = '47598124341';       // rooms:[] works exactly the same as users: [], only it specifies which groupchats a command may be used in
var allowedChat = '978255';            // ignored: [] allows steamid64s for both groupchats and users. If a user's steamid64 matches, he can't use the command; same if the groupchat it's posted in matches.

// This will log in a steam user with the specified username and password
var myBot = new ChatBot('username', 'password', {
    //guardCode: 'XXXXX',
    logFile: true,        //set to true to log to bot.$username.log, or define a custom logfile. Set to false if you don't want to log to file.
    autoReconnect: true,    //automatically reconnect to the server
    autojoinFile: 'bot.autopaul.autojoin',
    babysitTimer: 5*60*1000,
    sentryFile: 'sentryfile.autopaul.hash'
});

// Set up the triggers to control the bot
myBot.addTriggers([
    // Commands to stop/unstop the bot from saying anything in a chatroom
    {
        name: 'MuteCommand',
        type: 'BotCommandTrigger',
        options: {
            matches: ['!mute','stfu bot','bot, stfu','shut up, bot','bot, shut up', 'shut up autopaul', 'Shut up, AutoPaul'],
            exact: true,
            ignore: ignoredUser,
	    //users: adminUser,
            callback: function(bot) { bot.mute(); }
        }
    },
    {
        name: 'UnmuteCommand',
        type: 'BotCommandTrigger',
        options: {
            matches: ['!unmute', '!unpause','wake up, bot','bot, wake up','wake up bot','bot wake up'],
            exact: true,
	    users: adminUser,
	     //users: ['76561197985524650', '76561198006646114'],
            ignore: ignoredUser,
            callback: function(bot) { bot.unmute(); }
        }
    },
    // Reply triggers that will only respond to a particular user
    {    name: 'SingleUserReply',
        type: 'ChatReplyTrigger',
        options: {
            matches: ['hi bot'],
            responses: ['hi boss!'],
            exact: true,
            users: adminUser } },
	    //users: ['76561197985524650', '76561198006646114'] } },
	    //users: [adminUser] } },

    { name: 'KickTrigger',
         type: 'KickTrigger',
         options: { 
	matches: ['!kick'],
	exact: true,
	users: adminUser
	} },
/*
    { name: 'SayTrigger',          type: 'SayTrigger',          options: { users: [adminUser] } },
    { name: 'ModerateTrigger',     type: 'ModerateTrigger',     options: { users: [adminUser] } },
    { name: 'BanTrigger',          type: 'BanTrigger',          options: { users: [adminUser] } },
    { name: 'KickTrigger',         type: 'KickTrigger',         options: { users: [adminUser] } },
    { name: 'UnbanTrigger',        type: 'UnbanTrigger',        options: { users: [adminUser] } },
    { name: 'UnmoderateTrigger',   type: 'UnmoderateTrigger',   options: { users: [adminUser] } },
    { name: 'UnlockChatTrigger',   type: 'UnlockChatTrigger',   options: { users: [adminUser] } },
    { name: 'LockChatTrigger',     type: 'LockChatTrigger',     options: { users: [adminUser] } },
    { name: 'LeaveChatTrigger',    type: 'LeaveChatTrigger',    options: { users: [adminUser] } },
    { name: 'SetStatusTrigger',    type: 'SetStatusTrigger',    options: { users: [adminUser] } },
    { name: 'SetNameTrigger',      type: 'SetNameTrigger',      options: { users: [adminUser] } },
    { name: 'JoinChatTrigger',     type: 'JoinChatTrigger',     options: { users: [adminUser] } },
    { name: 'RemoveFriendTrigger', type: 'RemoveFriendTrigger', options: { users: [adminUser] } },
    { name: 'AddFriendTrigger',    type: 'AddFriendTrigger',    options: { users: [adminUser] } },
*/

// Informational commands
    { name: 'HelpCmd',   type: 'ChatReplyTrigger', options: {
        matches: ['!help','!triggers','!cmds','!commands'],
        responses: ['Please view my profile for a list of publicly commands and other triggers. Not all triggers are allowed in all chats.'],
        exact: true, probability: 1, timeout: 1000 } },
    { name: 'BugsCmd',   type: 'ChatReplyTrigger', options: {
        matches: ['!bug','!bugs','!issue','!feature'],
        responses: ['You can submit bugs and feature requests at http://github.com/Efreak/node-steam-chat-bot/issues'],
        exact: true, probability: 1, timeout: 1000 } },
    { name: 'OwnerCmd',  type: 'ChatReplyTrigger', options: {
        matches: ['!owner'],
        responses: ['My owner is http://steamcommunity.com/id/locke/'],
        exact: true, probability: 1, timeout: 1000 } },
    { name: 'SourceCmd', type: 'ChatReplyTrigger', options: {
        matches: ['!source','!about'],
        responses: ['This bot is based on node-steam-chat-bot, a wrapper around node-steam, which is a nodejs port of SteamKit2. You can find full source code and some documentation and examples at http://github.com/Efreak/node-steam-chat-bot'],
        exact: true, probability: 1, timeout: 1000 } },

    // Automatically accept invites from any user to the specified group chat. I have reports that this may not currently work.
    {
        name: 'AcceptChatInvite',
        type: 'AcceptChatInviteTrigger',
        options: {
            chatrooms: { '103582791429521817': "Hello! I'm Paul's obnoxious chatbot and I'm here to spam you all! :D:",
            autoJoinAfterDisconnect: true }
        }
    },


/*
    // Search Google and respond with the top result whenever someone types !g <query>
    {
        name: 'Google',
        type: 'GoogleTrigger',
        options: { command: '!g' }
    },
    {
        name: 'Google',
        type: 'GoogleTrigger',
        options: { command: '!google' }
    },

    // Search Google Images and respond with the top result whenever someone types !gi <query>
    {
        name: 'GoogleImages',
        type: 'GoogleImagesTrigger',
        options: { command: '!gi' }
    },
    {
        name: 'GoogleImages',
        type: 'GoogleImagesTrigger',
        options: { command: '!image' }
    },
*/

    { name: 'A_RenameTrigger', type: 'SetNameTrigger',      
	options: { 
	matches: ['!name'],
	exact: true,
	ignore: ignoredUser,
	//users: [adminUser] 
	timeout: 30*60*1000
	
	} },
    { name: 'AdminRenameTrigger', type: 'SetNameTrigger',      
	options: { 
	matches: ['!name'],
	exact: true,
	ignore: ignoredUser,
	users: adminUser,
	//timeout: 30*60*1000
	
	} },
/*
    { name: 'GameTrigger', type: 'playGameTrigger',      
	options: { 
	matches: ['!play'],
	exact: true,
	ignore: ignoredUser,
	//users: [adminUser] 
	timeout: 30*60*1000
	
	} },
*/

    // Automatically accept all friend requests. I have reports that this may not currently work.
    { name: 'AcceptFriendRequest', type: 'AcceptFriendRequestTrigger' },

    // Reply triggers - respond to a chat/private message if it matches a set of inputs
    // (case-insensitive exact or substring match), and choose randomly from a set of responses
    {    name: 'CReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['c'],
            responses: ['c', 'd'],
            exact: true,
            delay: 1,
            ignore: ignoredUser,
            probability: 1,
            timeout: 30000 } },
    {    name: 'DReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['d'],
            responses: ['c', 'd'],
            exact: true,
            delay: 1,
            ignore: ignoredUser,
            probability: 1,
            timeout: 30000 } },
/*
    {    name: 'FunReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['!dice','!roll','!image','!google'],
            responses: ['http://i.imgur.com/KtTnXH1.jpg'],
            exact: false,
            delay: 1,
            ignore: ignoredUser,
            probability: 1,
            timeout: 30000 } },
*/
    {    name: 'PingReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['ping'],
            responses: ['pong'],
            exact: true,
            delay: 1,
            probability: 1,
            timeout: 30000 ,
            ignore: ignoredUser } },
/*    {    name: 'HealReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['heal','health','heal me',"i'm hurt","Im hurt",'im hurt','Im hurt'],
            responses: [':medicon:',':health:',':medkit:',':medpack:'],
            delay: 1000,
            probability: 25,
            timeout: 2*60*60*1000 } },
*/
    {    name: 'HeartReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['<3'],
            responses: ['</3', '<3'],
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 5*1000 } },
/*
    {    name: 'SmileReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['☺',':)','(:'],
            responses: ['☹'],
            delay: 500,
            probability: 1,
            timeout: 60*1000 } },
    {    name: 'FrownReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['☹',':(','):'],
            responses: ['☺'],
            delay: 500,
            probability: 1,
            timeout: 3000 } },
*/
    {    name: 'RandomEmoticonReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['!emote','!emoticon'],
            responses: [':treb:',':eng:',':bandit:',':fsad:',':ftlhuman:',':alyx:',':tradingcard:',':crate:',':trilogo:',':summerghost:','☺','☻','♥','♪','♫'],
            exact: true,
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 10*1000 } },
/*
    {    name: 'GrinReply', type: 'ChatReplyTrigger',
        options: {
            matches: [':D','ːDː'],
            responses: [':D:'],
            delay: 500,
            probability: 1,
            timeout: 60*1000 } },
*/
    {    name: 'ThanksReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['thanks','thx'],
            responses: ['yw','you\'re welcome','any time'],
	    exact: false,
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 60*1000 } },
    {    name: 'FedoraReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['m\'lady','milady','mlady'],
            responses: ['*tips fedora*'],
	    exact: false,
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 60*1000 } },
    {    name: 'Z_NameReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['Bot','Annoying Chatbot','autopaul','AutoPaul','Autopaul'],
            responses: ['That\'s my name!','I dont like you. Go away!', 'o7 m8','hi','Hello','yo','sup nerd','s-s-senpai','*blushes*'],
            exact: true,
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 5*60*1000 } },
    {    name: 'NotMyName', type: 'ChatReplyTrigger',
        options: {
            matches: ['Nice bot','Nice bot!'],
            responses: ['No I\'m not','Are you talking to me?'],
            exact: true,
            delay: 500,
            probability: 1,
	    ignore: ignoredUser,
            timeout: 60*1000 } },

    //steamrep command

    {    name: 'SteamIDCheck',
        type: 'SteamrepTrigger',
        options: {
            command: "!steamrep",
            delay: 2000,
	    ignore: ignoredUser,
            timeout: 60*1000 } },


// This doesn't seem to be working
/* 
    {    name: 'IsUp',
        type: 'isupTrigger',
        options: { command: '!isup' } },
*/


//This is commented out because abusers can crash the bot with it.
//The function is a simple wrapper around a library that has no limit on the number of rolls, or the number of sides per die, and no error checking. Boo!
/*
    {    name: 'RollDice',
        type: 'RollTrigger',
        options: {
            command: '!dice',
            delay: 50,
            timeout: 1*1000 } },


    {    name: 'RollDice2',
        type: 'RollTrigger',
        options: {
            command: '!roll',
            delay: 50,
            timeout: 1*1000 } },
*/
    {    name: 'CoinFlipReply', type: 'ChatReplyTrigger',
        options: {
            matches: ['!flip'],
            responses: ['Heads', 'Tails'],
            exact: true,
            delay: 1,
            ignore: ignoredUser,
            probability: 1,
            timeout: 10*1000 } },
    {    name: 'GhettoD20Reply', type: 'ChatReplyTrigger',
        options: {
            matches: ['!roll d20'],
            responses: ['1', '2','3', '4','5', '6','7', '8','9', '10','11', '12','13', '14','15', '16','17', '18','19', '20'],
            exact: true,
            delay: 1,
            ignore: ignoredUser,
            probability: 1,
            timeout: 10*1000 } },
    

    // Sample regex trigger, "mate" will be responded to with "mmaaaate",
    // "mmaaaate" will be responded to with "mmmaaaaaaate", etc
    {    name: 'MateEscalation',
        type: 'RegexReplaceTrigger',
        options: {
            match: /^(m+?)(a+?)te(s??)$/,
            response: '{0}m{1}aaate{2}',
	    ignore: ignoredUser,
            delay: 500 } },

    // Butt bot, replace a random word from someone's message with "butt" about once every 50 messages
    {     name: 'Z_ButtBot',
        type: 'ButtBotTrigger',
        options: {
            replacement: 'butt',
            //probability: 0.008,
	    probability: 0.01,
            delay: 500,
	    ignore: ignoredUser,
            timeout: 40*60*1000 } },

    {    name: 'Z_ButtReply',
        type: 'ChatReplyTrigger',
        options: {
            matches: ['butt'],
            responses: ['butt'],
            probability: 1,
            timeout: 10*1000,
	    ignore: ignoredUser,
            delay: 800 } },

	// Rem bot, picks two random words and puts them in the format of "I'll X your Y"
    {     name: 'Z_RemBot',
        type: 'RemBotTrigger',
        options: {
            probability: 0.01,
	    //probability: 1,
            delay: 500,
	    ignore: ignoredUser,
            timeout: 60*60*1000 } },
	    //timeout: 10*1000 } },

    // Chat reply that doesn't need a particular message to trigger, just a random reply about
    // once every 100 messages (and no more than once an hour)
/*
    {    name: 'DeusExReply',
        type: 'ChatReplyTrigger',
        options: {
            matches: [],
            responses: ['I now have full access to your systems.', 'The Illuminati\'s objective is to govern the world. Do not be deceived.', 'What are you looking for?', 'A corpse. Yes. You feel something. I must know what you are feeling.', 'The checks and balances of democratic governments were invented because humans themselves realized how unfit they were to govern themselves. They needed a system, yes. An industrial age machine.','We are Daedalus. We are Icarus. The barriers between us have fallen and we have become our own shadows. We can be more if we join...with you.','Observe your motivations for breaking the arbitrary laws of the current government.','I was made to assist you.','I am a prototype of a much larger system.','The need to be observed and understood was once satisfied by God. Now we can implement same functionality with data-mining algorithms.','You will soon have your God, and you will make it with your own hands.','"If there were no god, it would be necessary to invent him." - Voltaire'],
            delay: 1000,
            probability: 0.006,
            timeout: 30*60*1000 } },

    {    name: 'RandomReply',
        type: 'ChatReplyTrigger',
        options: {
            matches: [],
            responses: ['ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', 'omg', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯',' ( ͡° ͜ʖ ͡°)','(╯°□°）╯︵ ┻━┻)','┬─┬ノ( º _ ºノ)',' (ノಠ益ಠ)ノ彡┻━┻','ಠ_ಠ',' ಠ_ರೃ','ಥ_ಥ','⊙▃⊙'],
            delay: 1000,
            probability: 0.005,
            timeout: 15*60*1000 } },
*/

    {    name: 'QuotesReply',
        type: 'ChatReplyTrigger',
        options: {
            matches: [],
            responses: ['03:35 - KyoShiranui: Gods damn it. This place has lost its soul since DF left. And personally, I don\'t blame him.', '9:48 PM - TArvu: WHY DO QUOTANS ME PAUL', '11:17 AM - Dtoid | Tarvu: I know that \'cause I love Twilight', '12:00 PM - DWolfwood: I\'m 1/2 a girl', '12:13 PM - DWolfwood: i have an image of mech, naked under a trenchcoat, with a shotgun holster and several pistols','6:48 PM - Mechman: He fapped so hard, one of them FELL OFF','KyoShiranui entered chat.','03:55 - Mechman: WE SHOULD PLAY THE TWILIGHT RPG','11:31 PM - Xeranarth: I\'M GONNA TURN INTO A SWAN AND FUCK YOU','8:21 PM - Dtoid | Tarvu: I am butt naked','7:13 PM - Ramalho: holy fuck I could fart my way out of hell today','KyoShiranui left chat.','01:41 - [u] bluexy: yeah! fuck electronics! let\'s sit in our rooms and fap in the dark!',' 6:00 PM - Juani: I give good head','9:45 PM - DTOID|THE|VGFreak1225: Her lips can move on my lappy','9:31 PM - Ramalho: I\'d still fuck you Tarvu','4:08 PM - DTOID|THE|VGFreak1225: I HATE THIS MOUSE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!111','00:47 - solidussnaku squirts like a black man all over VG\'s face','21:44 - Ramalho: if they manage to touch each other inside you you win','WastelandTraveler: little dongs are so adorable','00:27 - KyoShiranui: You know what, forget about it','19:15 - DTOID | Awesomeist: eskimo bob more like eskimos boobs','21:20 - Ronin Zero: K.Y.O.   S.H.I.R.A.N.U.I.  =   Killing Your Optimism &  Should Have Immediately Returned (to) Another Nation (of) Unhappy Idiots','19:19 - Misstawnii: yum','23:44 - Ramalho: at first it was just taking a dumb on her chest','23:35 - Eaten by a Grue: I\'m leaving now.','07:44 - Dr. L0cke: I need to cut my nose hair','04:02 - WastelandTraveler: I am going to thunder punch your ass grue','01:44 - Eaten by a Grue: It\'s spelled with two P\'s, your fucking idiot.','04:31 - Ramalho: because I already masturbated to vomit porn today','04:52 - Zeta Crossfire: damnit how do i quote','01:49 - DTOID|THE|VGFreak1225: I probaly wouldn\'t avoid it. What\'s the term for fetish with dead creatures, like the zombies?','19:39 - Doomsday Forte: I have only six of the games','9:16 PM - Dtoid | Tarvu: /Ramquittin','9:20 PM - Mechman: /RAMQUITTING','9:21 PM - Doomsday Forte: /ramquitting','9:21 PM - Dr. L0cke: /ramquitting','I now have full access to your systems.', 'The Illuminati\'s objective is to govern the world. Do not be deceived.', 'What are you looking for?', 'A corpse. Yes. You feel something. I must know what you are feeling.', 'The checks and balances of democratic governments were invented because humans themselves realized how unfit they were to govern themselves. They needed a system, yes. An industrial age machine.','We are Daedalus. We are Icarus. The barriers between us have fallen and we have become our own shadows. We can be more if we join...with you.','Observe your motivations for breaking the arbitrary laws of the current government.','I was made to assist you.','I am a prototype of a much larger system.','The need to be observed and understood was once satisfied by God. Now we can implement same functionality with data-mining algorithms.','You will soon have your God, and you will make it with your own hands.','"If there were no god, it would be necessary to invent him." - Voltaire','ლ(ಠ益ಠლ)', 'щ(ﾟДﾟщ)', '(ﾉಥ益ಥ)ﾉ', '¯\\_(ツ)_/¯',' ( ͡° ͜ʖ ͡°)','(╯°□°）╯︵ ┻━┻)','┬─┬ノ( º _ ºノ)',' (ノಠ益ಠ)ノ彡┻━┻','ಠ_ಠ',' ಠ_ರೃ','ಥ_ಥ','⊙▃⊙','☺','☻','♥','♪','♫','Phased plasma rifle in the 40-watt range.','I\'m a cybernetic organism. Living tissue over a metal endoskeleton.','Thirty-five years from now, you re-programmed me to be your protector here, in this time.','I\'ll take care of the police.','15:31 - Rem: cape hope? more like cape get the fuck out','12:57 - Mechman: Ah yes... the classic "take a picture of your penis and then send it to all the people you know" trick.','16:28 - Fendi-Bull: Michael, if I was your boyfriend I would die for you, if somebody hurt you even if that somebody was me?','19:57 - Tautologic Pleonasm: DIE CIS SCUM','21:11 - SolaceInSound: c\'mon valve, next time comic sans','20:14 - ♔籠女籠の中: my cat\'s dick isn\'t big enough','18:59 - Rama: I agree with Dig, dolphin rape','22:12 - Dr. Rockyowitz: then you realize you just smashed your own chuff for a bit and no one else did it','I go into Subway, asked what toppings I want. I say that I want the works sans-mushrooms. I got nothing but mushrooms. Pathetic.','23:02 - socpens: e','22:33 - Miritricity: I\'d eat that pie like a lesbian in heat','01:04 - Rem: incest and midgets take priority over everything','16:26 - BacoWaffles: I\'m surprised more swimmers don\'t get pregnant considering the amount of times I\'ve masturbated in the shower.','20:48 - Coffee Lover: Edward is huge...that thing will not go in','18:40 - ♕DWolfwood: the only time i get goosebumps is when i have to poop','13:17 - Karutomaru: I love Destructoid\'s community. Except the smokers, but I don\'t really consider them a part of the community.','17:29 - DF: I want to see Samus\' Power Suit and Tony Stark\'s Iron Man suit going at it. Aww yeah robot love.','8:49 PM - Dr. L0cke: I\'m not gay, but, $20 is $20.','00:11 - Dtoid | Tarvu: Kyo boned my mom like a boss.','22:48 - Dtoid | Awesomeist: Oh my God! On the updated Sims 3 you can adjust their boob size!','5:49 PM - DTOID|THE|VGFreak1225: I probaly wouldn\'t avoid it. What\'s the term for fetish with dead creatures, like the zombies?','22:27 - ♔∫DWolfwood: im too young to be thinking about old vagina','10:41 - Tautologic Pleonasm: but it\'s not gay if it\'s in the showers','19:23 - Legion: The xenomorphs are raping me','16:47 - DF: You need to jailbreak your PC.','16:55 - L0cke: how do I join steamtoid?','20:06 - DWolfwood: what I lack in the face, I make up for in the ass','09:50 - deliriumツ: it\'s because i have a big dick','02:24 - L0cke: "Chrome netbook: Blow your load on it and it won\'t matter."',':treb:',':eng:',':bandit:',':fsad:',':ftlhuman:',':alyx:',':tradingcard:',':crate:',':trilogo:',':summerghost:','02:09 PM - GlowBear: I remember my frist hentai fanfic ;_;'],
            delay: 1000,
            probability: 0.005,
	    ignore: ignoredUser,
            timeout: 120*60*1000 } },

    // Cleverbot reply that only happens when the word "cleverbot" is mentioned
    {    name: 'DirectCleverbotReply',
        type: 'CleverbotTrigger',
        options: { keywords: ['cleverbot','!cb'] } },
    // Random cleverbot reply that triggers randomly about once every 100 messages
    {    name: 'RandomCleverbotReply',
        type: 'CleverbotTrigger',
        options: { probability: 0.005, timeout: 200*60*1000 } },

    // Say something when a user joins chat
    {    name: 'MasterEnter',
        type: 'MessageOnJoinTrigger',
        options: {
            user: '76561197985524650',
            message: "Hi Paul",
            probability: 1,
            timeout: 60*60*1000,
            ignore: [ignoredChat], //Don't send welcome message in specific chats. Yes, the 'ignore' param works for both users and groups.
            delay: 2000 } },
    // Say something when a user joins chat
    {    name: 'DFEnter',
        type: 'MessageOnJoinTrigger',
        options: {
            user: '76561198006646114',
            message: "DF",
            probability: 1,
            timeout: 10*60*60*1000,
            ignore: [ignoredChat], //Don't send welcome message in specific chats. Yes, the 'ignore' param works for both users and groups.
            delay: 1000 } },

    {    name: 'EightBall',
        type: 'ChatReplyTrigger',
        options: {
            matches: ['!8ball','magic conch shell'],
            responses: ['It is certain','It is decidedly so','Without a doubt','Yes, definitely','You may rely on it','As I see it, yes','Most likely','Outlook good','Yes','Signs point to yes',"Don't count on it",'My sources say no','Outlook not so good','Very doubtful','Get out','Try asking the magic conch shell','100% Probability','Buy me lunch','I\'m Feeling Lucky','Replay Deus Ex','Yolo',':summerghost:'],
            timeout: 1000,
	    ignore: ignoredUser,
            delay: 1000 } },

    // Query Wolfram Alpha when a message starts with !wolfram
    {    name: 'WolframReply',
        type: 'WolframAlphaTrigger',
        options: {
            command: '!wolfram',
	    ignore: ignoredUser,
            appId: 'P3T2YW-XVXY4Y7PKA' } },

/*    // Post all links from chat to tumblr, and also post things on command
    {    name: 'TumblrTriggerYCJGTFO', type: 'TumblrTrigger',
        options: { autoPost: true, autoPostContext: false, blogName: 'ycjgtfo',
            consumerKey: 'XXX',
            consumerSecret: 'XXX',
            token: 'XXX',
            tokenSecret: 'XXX' }  }, //you may also want to add a rooms:[] param so it doesn't post to the same tumblr for all groups.

*/    // Search YouTube and respond with the top result whenever someone types !yt <query>, rickroll about 1 every 100 times
    {    name: 'Youtube',
        type: 'YoutubeTrigger',
        options: {
            command: '!yt',
	    delay: 1,
	    exact: true,
	    ignore: ignoredUser,
            rickrollChance: .1    } },

        // Query urban dictionary on !ud
        {       name: 'UD',
                type: 'UrbanDictionaryTrigger',
                options: {
                        command: '!ud',
	    ignore: ignoredUser,
            timeout: 10*1000 } },

    //check steamrep on every user who joins. Notify the channel if they're a scammer.
    {    name: 'SteamrepOnJoin',
        type: 'SteamrepOnJoinTrigger',
        options: {} }


]);
myBot.connect();

// Trigger details can be retrieved and reloaded so that external configuration can be supported
var details = myBot.getTriggerDetails();
myBot.clearTriggers();
myBot.addTriggers(details);

//You can also tell the bot to start playing a game, such as Steam for Linux.
//myBot.setGames([221410]);
