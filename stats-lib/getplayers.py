#!/usr/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage getplayers.py <logfile>")
    sys.exit(-1)

players = dict()

with open(sys.argv[1], 'r', errors='ignore') as file:
    for entry in logparser.parse_log(file):
        if entry['record_type'] == 'PLAYER_NEW':
            players[entry['id']] = entry['name']

for (id, name) in players.items():
    print(str(id) + ': ' + name)
