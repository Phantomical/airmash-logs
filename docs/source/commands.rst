
STATSBOT Public Chat Commands
=============================

STATSBOT has a number of public chat commands
that can be used by players in-game.

-game-time
----------

Makes STATSBOT print out the time since game start.
If STATSBOT was restarted during the game, then it
prints out the time since STATSBOT was started.

-last-win
---------

Makes STATSBOT print out the last team that won. If
STATSBOT was restarted since the last game, it will
respond that it doesn't know which team won the last
game.

-bot-ping
---------

Makes STATSBOT whisper its name and owner to the user
which issued the ping.

-swam-ping
----------

STATSBOT will respond indicating that it is using 
StarMash with the theme STATSBOT.


STATSBOT Whisper Commands
=========================

These are commands that are meant to be used by
players directly. For commands meant to be used
by bots or mods see `STATSBOT Whisper API`_.

To use these commands, whisper them to STATSBOT.

-game-time
----------

Does the same as the public -game-time command, 
except whispers the time to the player that issued 
the command.

-last-win
---------

Does the same as the public -last-win command,
except whispers the time to the player that issued
the command.

-anon-me
--------

Anonymises the requesting player from all logs for the
current STATSBOT session. Note that this will have to 
be repeated each time the player logs on or STATSBOT
restarts. STATSBOT will respond indicating that the 
player has been anonymised.

-anon-me-quiet
--------------

Also anonymises the requesting player, but suppresses any
response from STATSBOT.


STATSBOT Whisper API
====================

These are commands that are meant to be used by mods or
bots. All Whisper API commands are prefixed with -api

-api-game-time
--------------

Returns the number of milliseconds that the current game 
has been running. This is returned as an integer. If
-api-firstgame returns true, it will instead return the
time since STATSBOT joined the current game.

-api-game-start
---------------

Returns the UTC time of the start of the current game as returned by 
`Date.getTime() <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime>`_.
If -api-firstgame returns true, it will instead return the time 
since STATSBOT joined the current game.

-api-firstgame
--------------

Returns whether statsbot has been restarted since this
game began. Returns "true" or "false". This can be used
to test whether the -api-game-time or -game-time will 
return a correct value.























