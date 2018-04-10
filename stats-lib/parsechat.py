#!/usr/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage parsechat <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:
    names = {}

    for entry in logparser.parse_log(file):
        if entry['record_type'] == "PLAYER_NEW":
            names[entry['id']] = entry['name']
        elif entry['record_type'] == "PLAYER_LEAVE":
            names.pop(entry['id'], None)
        elif entry['record_type'] == "CHAT_PUBLIC":
            print(names[entry['id']] + ": " + entry['text'])

