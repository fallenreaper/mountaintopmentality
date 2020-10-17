# Mountaintop Mentality.
## Its not a company, it's a Mind set
{ Blurb about MTM }

## Setting Up the Bot.
This requires both a Discord Access Token, AND node installed on your server.  After pulling the repository, you will simply call:

```
npm install
npm start
```

And it is as simple as that.  For Discord Access Token, while you can set it in the config.js file, you _can also_ set it in your local systems Environment Variables..

```
# Example
export DISCORD_TOKEN="sdfghjksdfghjdfguysdfgkuasdgkuag"
```

Added a Docker container so that way the app does not need to be deployed actively under your machine.  You can run the docker container and it will serve the Dicord bot for you.
- In order to use docker, you will need to visit their website and download their application.  After reading how it works, and you have access to docker in the command line (CLI) you can run:

```
docker build -t mountaintop-mentality .
docke run -it -d --name mtm-bot mountaintop-mentality:latest
```

## Utility and Functions
{ A list of Commands will go here.}
## Tasks and Goals
{ We will fill this out more later.}
## TODO List
[ ] Clean up the display of Message Embeds.

