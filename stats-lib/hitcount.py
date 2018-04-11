#!/usr/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage: hitcount.py <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:

    players = {}
    logs = {}

    for entry in logparser.parse_log(file):
        if entry['record_type'] == "PLAYER_NEW":
            players[entry['id']] = {
                'name': entry['name'],
                'fired': 0,
                'hit': 0
            }
        elif entry['record_type'] == 'PLAYER_LEAVE':
            if not entry['id'] in players:
                continue

            name = players[entry['id']]['name']
            if name in logs:
                logs[name]['hit']   += players[entry['id']]['hit']
                logs[name]['fired'] += players[entry['id']]['fired']
            else:
                logs[name] = {
                    'hit': players[entry['id']]['hit'],
                    'fired': players[entry['id']]['fired']
                }
            players.pop(entry['id'], None)
        elif entry['record_type'] == 'PLAYER_FIRE' and entry['id'] in players:
            players[entry['id']]['fired'] += 1
        elif entry['record_type'] == 'PLAYER_HIT' and entry['owner'] in players:
            players[entry['owner']]['hit'] += 1

    for tup in players.items():
        player = tup[1]
        name = player['name']

        if name in logs:
            logs[name]['hit']   += player['hit']
            logs[name]['fired'] += player['fired']
        else:
            logs[name] = {
                'hit': player['hit'],
                'fired': player['fired']
            }

    for player in logs.items():
        print(player)

