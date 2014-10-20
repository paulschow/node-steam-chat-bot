#!/usr/bin/env python

# This is a little python script that takes the logs, 
# renames them with the date, 
# and moves them to a logs folder.

# Use this with a cron that looks something like this

# 59 23 * * * /usr/bin/python /home/paul/node_modules/steam-chat-bot/movelogs.py
# 58 23 * * * killall nodejs
# 1 0 * * * cd /home/paul/node_modules/steam-chat-bot/ && /usr/bin/nodejs /home/paul/node_modules/steam-chat-bot/autopaul.js

# Then at midnight the bot will shut down, move logs, and restart
# There's probably a better way to do this


#import os
import shutil
import time
#import subprocess

date = time.strftime("%d%b%Y")
#print date

try:
    shutil.move('/home/paul/node_modules/node-steam-chat-bot/bot.autopaul.log',
         '/home/paul/node_modules/node-steam-chat-bot/logs/%s.txt' % date)
except IOError:
    print "Error: No Logs Found"

# Restart the bot
#p = subprocess.call(["killall", "nodejs"])
#time.sleep(1)
#o = subprocess.call(["nohup", "nodejs",
#     "/home/paul/node_modules/steam-chat-bot/autopaul.js", "&"])
