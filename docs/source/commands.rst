
STATSBOT Public Chat Commands
=============================

STATSBOT has a number of public chat commands
that can be used by players in-game.

-game-time
----------

Makes STATSBOT print out the time since game start.
If STATSBOT was restarted during the game, then it
prints out the time since STATSBOT was started.

To use this in-game, say :code:`-game-time` in the
public chat.

-game-teams
-----------

Makes STATSBOT print out the number of players on 
each team.

To use this in-game, say :code:`-game-teams` in the 
public chat.

-last-win
---------

Makes STATSBOT print out the last team that won. If
STATSBOT was restarted since the last game, it will
respond that it doesn't know which team won the last
game.

To use this in-game, say :code:`-last-win` in the
public chat.

-bot-ping
---------

Makes STATSBOT whisper its name and owner to the user
which issued the ping.

-swam-ping
----------

STATSBOT will respond indicating that it is using 
StarMash with the theme STATSBOT.

-statsbot-help
--------------

Makes statsbot give a link to this documentation.

To use this in game, say :code:`-statsbot-help` in the 
chat box.


STATSBOT Whisper Commands
=========================

These are commands that are meant to be used by
players directly. For commands meant to be used
by bots or mods see `STATSBOT Whisper API`_.

To use these commands, whisper them to STATSBOT.

help
----

Makes statsbot give a link to this documentation.

To use this in game, type :code:`/w STATSBOT help`

-game-time
----------

Does the same as the public -game-time command, 
except whispers the time to the player that issued 
the command.

To use this in game, type :code:`/w STATSBOT -game-time`

-game-teams
-----------
Does the same as the public -game-teams command,
except whispers the time to the player that 
issued the command.

To use this in game, type :code:`/w STATSBOT -game-teams`

-last-win
---------

Does the same as the public -last-win command,
except whispers the time to the player that issued
the command.

To use this in-game, type :code:`/w STATSBOT -last-win`

-anon-me
--------

Anonymises the requesting player from all logs for the
current STATSBOT session. Note that this will have to 
be repeated each time the player logs on or STATSBOT
restarts. STATSBOT will respond indicating that the 
player has been anonymised.

To use this in-game, type :code:`/w STATSBOT -anon-me`

-anon-me-quiet
--------------

Also anonymises the requesting player, but suppresses any
response from STATSBOT.

To use this in-game, type :code:`/w STATSBOT -anon-me-quiet`


STATSBOT Whisper API
====================

These are commands that are meant to be used by mods or
bots. All Whisper API commands are prefixed with -api.

*All API commands must be whispered to statsbot*

-api-game-time
--------------

Returns the number of milliseconds that the current game 
has been running. This is returned as an integer. If
-api-firstgame returns true, it will instead return the
time since STATSBOT joined the current game.

To use this in-game, do :code:`/w STATSBOT -api-game-time`

-api-game-start
---------------

Returns the UTC time of the start of the current game as returned by 
`Date.getTime() <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime>`_.
If -api-firstgame returns true, it will instead return the time 
since STATSBOT joined the current game.

To use this in-game, do :code:`/w STATSBOT -api-game-start`

-api-firstgame
--------------

Returns whether statsbot has been restarted since this
game began. Returns "true" or "false". This can be used
to test whether the -api-game-time or -game-time will 
return a correct value.

To use this in-game, do :code:`/w STATSBOT -api-firstgame`





















