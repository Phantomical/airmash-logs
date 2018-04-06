#!/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage gameteams.py <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:
    contents = file.read()

    teams = (set(), set())
    teamnames = ["red", "blue"]

    names = dict()

    for entry in logparser.parse_log(contents):
        if entry['record_type'] == 'PLAYER_NEW':
            names[entry['id']] = entry['name']
            teams[entry['team']-1].add(entry['id'])
        elif entry['record_type'] == 'PLAYER_LEAVE':
            for i in range(0, 1):
                teams[i].discard(entry['id'])
                names.pop(entry['id'])

        elif entry['record_type'] == 'PLAYER_RETEAM':
            for i in range(0, 1):
                teams[i].discard(entry['id'])

            teams[entry['team']-1].add(entry['id'])

        elif entry['record_type'] == 'GAME_WIN':
            print(teamnames[entry['team']] + " won,"
                  + " bounty: " + entry['bounty']
                  + " num players: " + 
                 str(len(teams[0]) + len(teams[1])))
            
            print("red team:")
            for member in teams[0]:
                if member in names:
                    print('\t' + names[member])

            print("blue team:")
            for member in teams[1]:
                if member in names:
                    print('\t' + names[member])

            teams = (set(), set())

                 
        elif entry['record_type'] == 'SERVER_CUSTOM':
            print(teamnames[int(entry['data'][5])-1] +
                 " won, num players: " +
                 str(len(teams[0]) + len(teams[1])))
             
            print("red team:")
            for member in teams[0]:
                if member in names:
                    print('\t' + names[member])

            print("blue team:")
            for member in teams[1]:
                if member in names:
                    print('\t' + names[member])

            teams = (set(), set())
        elif entry['record_type'] == 'LOGIN':
            teams = (set(), set())


