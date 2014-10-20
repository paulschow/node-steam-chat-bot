#!/usr/bin/env python

#import os
import shutil
import time
#import subprocess

date = time.strftime("%d%b%Y")
#print date

try:
    shutil.move('/home/paul/node_modules/steam-chat-bot/bot.autopaul.log',
         '/home/paul/node_modules/steam-chat-bot/logs/%s.txt' % date)
except IOError:
    print "Error: No Logs Found"

# Restart the bot
#p = subprocess.call(["killall", "nodejs"])
#time.sleep(1)
#o = subprocess.call(["nohup", "nodejs",
#     "/home/paul/node_modules/steam-chat-bot/autopaul.js", "&"])