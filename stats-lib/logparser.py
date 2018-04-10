
import re
import sys

EOL    = 0
LBRACE = 1
RBRACE = 2
IDENT  = 3
STRING = 4
NUMBER = 5
COMMA  = 6
COLON  = 7
INT    = 8

def _tokenize(entry: str):
    tokens = []

    while entry != "":
        ident_match = re.match(r'^[A-Za-z_][A-Za-z_0-9]*', entry)
        num_match = re.match(r'^-?[0-9]+\.[0-9]+', entry)
        int_match = re.match(r'^-?[0-9]+', entry)
        str_match = re.match(r'^"(\\\\|\\"|[^"])*"', entry)

        if entry.startswith('['):
            yield (LBRACE, None)
            entry = entry[1:]
        elif entry.startswith(']'):
            yield (RBRACE, None)
            entry = entry[1:]
        elif entry.startswith(','):
            yield (COMMA, None)
            entry = entry[1:]
        elif entry.startswith(':'):
            yield (COLON, None)
            entry = entry[1:]
        elif ident_match:
            result = ident_match
            yield (IDENT, entry[result.start(0):result.end(0)])
            entry = entry[result.end(0):]
        elif num_match:
            result = num_match
            yield (NUMBER, float(entry[result.start(0):result.end(0)]))
            entry = entry[result.end(0):]
        elif str_match:
            result = str_match
            yield (STRING, entry[result.start(0)+1:result.end(0)-1])
            entry = entry[result.end(0):]
        elif int_match:
            result = int_match
            yield (INT, int(entry[result.start(0):result.end(0)]))
            entry = entry[result.end(0):]
        else:
            # Ignore unregocnized tokens
            entry = entry[1:]
    while True:
        yield (EOL, None)

class TokenList:
    def __init__(self, tokens):
        self._tokens = tokens
        self._next = None
        self.step()
        self.step()

    def current(self):
        return self._current
    def peek(self):
        return self._next
    def step(self):
        self._current = self._next
        self._next = self._tokens.__next__()
        
class ParseError(Exception):
    def __init__(self, msg=''):
        Exception.__init__(self, msg)

def _token_tostr(token):
    if token == EOL:
        return "EOL"
    if token == RBRACE:
        return "]"
    if token == LBRACE:
        return "["
    if token == IDENT:
        return "IDENT"
    if token == COLON:
        return ":"
    if token == STRING:
        return "STRING"
    if token == NUMBER:
        return "NUMBER"
    if token == COMMA:
        return ","
    if token == INT:
        return "INT"
    return None

def _parse_string(str):
    str = re.sub(r'\\\\', r'\\', str)
    str = re.sub(r'\\"', r'"', str)
    str = re.sub(r'\\n', r'\n', str)
    str = re.sub(r'\\r', r'\r', str)
    return str

def _parse_ident(tokens):
    (type, value) = tokens.current()
    if type != IDENT:
        raise ParseError()
    tokens.step()
    return value

def _parse_array(tokens):
    values = []
    while tokens.current()[0] != RBRACE:
        values.append(_parse_value(tokens))
        if tokens.current()[0] != COMMA and tokens.current()[0] != RBRACE:
            raise ParseError("Found: " + _token_tostr(tokens.current()[0]))
        elif tokens.current()[0] == COMMA:
            tokens.step()
    tokens.step()
    return values    

def _parse_value(tokens):
    (type, value) = tokens.current()
    tokens.step()

    if type == STRING:
        return _parse_string(value)
    if type == NUMBER:
        return value
    if type == LBRACE:
        return _parse_array(tokens)
    if type == INT:
        return value
    raise ParseError("Found: " + _token_tostr(type))

def _parse_entry(tokens):
    name = _parse_ident(tokens)

    (type, value) = tokens.current()
    if type != COLON:
        raise ParseError(_token_tostr(type))
    tokens.step()

    value = _parse_value(tokens)
    return (name, value)

def _parse_record(tokens):
    (type, value) = tokens.current()
    if type != LBRACE:
        raise ParseError(_token_tostr(type))
    tokens.step()

    obj = {}
    obj["record_type"] = _parse_ident(tokens)

    while tokens.current()[0] == COMMA:
        tokens.step()
        
        (name, value) = _parse_entry(tokens)
        obj[name] = value

    tokens.step()

    if tokens.current()[0] != EOL:
        raise ParseError("Found: " + _token_tostr(tokens.current()[0]))

    return obj

def _fixup_packet(entry):
    """Change PACKET to refer to the message type instead"""

    if entry['record_type'] == 'PACKET':
        entry['record_type'] = entry['c']

    return entry

def parse_entry(entry: str):
    """Parses a log entry into a dict"""
    tokens = _tokenize(entry.strip())
    
    return _fixup_packet(_parse_record(TokenList(tokens)))

def parse_log(log):
    """Parses a log into a list of entries"""

    lines = log
    if type(log) == str:
        lines = log.splitlines()

    for (i, line) in enumerate(lines):
        try:
            yield parse_entry(line)
        except ParseError as e:
            print("Error occurred at line " + str(i+1) + ", skipping entry.", file=sys.stderr)

def _escape_str(strval: str):
    return strval.translate(str.maketrans({
        '\\': '\\\\', 
        '"': '\\"',
        '\n': '\\n',
        '\r': '\\r'
    }))

def _escape_value(val):
    if type(val) is str:
        escaped = val.translate(str.maketrans({
            '\\': '\\\\', 
            '"': '\\"',
            '\n': '\\n',
            '\r': '\\r'
        }))

        return'"' + escaped + '"'

    if type(val) is list:
        return '[' + str.join(', ', [_escape_value(x) for x in val]) + ']'

    return str(val)


def build_entry(entry: dict):
    """Create an entry record from a dictionary, the
entry label is dictated by the 'record_type' field.
Will throw an excption if there is no 'record_type'
entry."""

    str = '[' + entry['record_type']

    for (key, val) in entry.items():
        if key == 'record_type':
            continue

        str += ', ' + key + ': ' + _escape_value(val)

    return str + ']'




