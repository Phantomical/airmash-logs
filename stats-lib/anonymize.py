#!/bin/python3

import logparser
import sys

if len(sys.argv) < 2:
    print("usage anonymize.py <logfile>")
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
        if 'id' in entry and entry['id'] in anon_users:
            entry['id'] = anon_id

        if entry['record_type'] == 'PLAYER_NEW' and entry['id'] == -1:
            entry['name'] = anon_name

        if entry['record_type'] == 'PLAYER_UPDATE' and entry['id'] == -1:
            continue

        if entry['record_type'] != 'ANONYMISE':
            print(logparser.build_entry(entry))

