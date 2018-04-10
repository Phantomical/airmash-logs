
import logparser
import sys

if len(sys.argv) < 2:
    print("usage parsechat <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:
    count = 0

    for entry in logparser.parse_log(file):
        if entry['record_type'] == "EVENT_LEAVEHORIZON":
            count += 1

    print(count)

