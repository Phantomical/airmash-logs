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
        if entry['record_type'] == 'LOGIN':
            teams - 

