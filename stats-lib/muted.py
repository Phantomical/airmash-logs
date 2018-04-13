#!/usr/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage muted.py <logfile>")
    sys.exit(-1)

players = {}

with open(sys.argv[1], 'r', errors='ignore') as file:
    for entry in logparser.parse_log(file):
        if entry['record_type'] == 'CHAT_VOTEMUTEPASSED':
            print(players[entry['id']]) 
        elif entry['record_type'] == 'PLAYER_NEW':
            players[entry['id']] = entry['name']
