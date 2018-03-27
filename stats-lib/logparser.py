
import re

EOL    = 0
LBRACE = 1
RBRACE = 2
IDENT  = 3
STRING = 4
NUMBER = 5
COMMA  = 6
COLON  = 7

def _tokenize(entry: str):
    tokens = []

    while entry != "":
        ident_match = re.match(r'^[A-Za-z_][A-Za-z_0-9]*', entry)
        num_match = re.match(r'^[0-9]+(\.[0-9]+)?', entry)
        str_match = re.match(r'^"(\\"|[^"])*"', entry)

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
    return None

def _parse_string(str):
    str = re.sub(r'\\"', '"', str)
    str = re.sub(r'\\n', '\n', str)
    str = re.sub(r'\\r', '\r', str)
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
        else:
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

def parse_entry(entry: str):
    """Parses a log entry into a dict"""
    tokens = _tokenize(entry.strip())
    
    return _parse_record(TokenList(tokens))

def parse_log(log: str):
    """Parses a log into a list of entries"""

    for (i, line) in enumerate(log.splitlines()):
        try:
            yield parse_entry(line)
        except ParseError as e:
            import sys
            raise ParseError(str(e) + '\nParseError: Occurred at line ' + str(i+1) + '\n').with_traceback(sys.exc_info()[2])
        except Exception as e:
            import sys
            print(sys.exec_info())



