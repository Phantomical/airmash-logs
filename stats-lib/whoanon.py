#!/usr/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage whoanon.py <logfile>")
    sys.exit(-1)

anon_users = []
anon_id    = -1
anon_name  = "ANON_PLAYER"

with open(sys.argv[1], 'r', errors='ignore') as file:
    for entry in logparser.parse_log(file):
        if entry['record_type'] == 'ANONYMISE':
            anon_users.append(entry['id'])

with open(sys.argv[1], 'r', errors='ignore') as file:
    for entry in logparser.parse_log(file):

        if entry['record_type'] == 'PLAYER_NEW' and entry['id'] in anon_users:
            print(entry['name'] + " " + str(anon_users.count(entry['id'])))

