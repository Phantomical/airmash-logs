
import logparser
import sys

sys.argv = ['', 'log']

if len(sys.argv) < 2:
    print("usage parsechat <logfile>")
    sys.exit(-1)

with open(sys.argv[1], 'r', errors='ignore') as file:
    contents = file.read()

    players = {}
    blue = []
    red = []

    for entry in logparser.parse_log(contents):
        pass

