
import logparser
import sys

sys.argv = ['', 'statsbot-log-2018-03-27-1']

if len(sys.argv) < 2:
    print("usage parsechat <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:
    contents = file.read()

    names = {}

    for entry in logparser.parse_log(contents):
        if entry['record_type'] == "PLAYER_NEW":
            names[entry['id']] = entry['name']
        elif entry['record_type'] == "PLAYER_LEAVE":
            names.pop(entry['id'], None)
        elif entry['record_type'] == "CHAT_PUBLIC":
            print(names[entry['id']] + ": " + entry['text'])

