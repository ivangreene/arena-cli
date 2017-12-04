# are.na Command Line Interface

```bash
# Open the 3 most recent public channels in your browser:
$ arena channels -x3 -s link | xargs open
```

## Installation

Available from the npm registry. Requires [Node.js](https://nodejs.org/en/download/) to be installed.

```bash
$ npm i -g are.na-cli

# or:

$ yarn global add are.na-cli
```

You may optionally specify an access token for read/write access or retrieving private resources. Set the environment variable `ARENA_ACCESS_TOKEN` to your access token, as so:

```bash
$ export ARENA_ACCESS_TOKEN=abcd
$ arena create channel hmm
```

Add the `export` line to your `.bash_profile` or `.bashrc` to persist accross terminal sessions.

## Commands:
- `create`: Create...
  - `channel <title>`: A new channel
  - `channels <...titles>`: Shortcut to `channel -m`
<!---
  - `block [channel-slug] [url|-c [file]|content]`: A new block. You can specify the URL, or content (or -c to read content from a file)
  - `blocks`: Shortcut to `block -m`
  --->
- `get`: Fetch...
  - `channel <slug|id>`: A channel
  - `channels`: List of public channels
  - `channels <...slugs|ids>`: Multiple channels
  - `block <id>`: Block by ID
- `delete`: Delete...
  - `channel <slug|id>`: A channel
  - `channels <...slugs|ids>`: Multiple channels

## Options:
- `-m, --multiple`: accept multiple arguments (quoted) and execute the command for each: `arena create channel -m "Some Title" "Another One"`
- `-s slug author title, --select=author date`: Takes an list, and will only output the specified fields from the results (defaults to "slug" on creation, "title author slug" on fetch). Available fields: `title, author, date, slug, link`
- `-j=string, --join="string"`: Join individual fields with "string" (default: ", ")
- `-p n, --page=n`: Fetch page number `n`
- `-x n, --per=n`: Fetch `n` tems per page
- `-J, --json`: Output JSON instead of the default textual format
- `-P, --pretty`: Pretty print JSON
<!--- - `-c file.txt, --content=file.txt`: Read content from `file.txt`, or use `-` for STDIN --->

## Examples:

```bash
$ arena create channel Excellent Websites --select=link
https://are.na/excellent-websites

$ arena channels -x5 -p2 -s title slug
Motion Graphics, motion-graphics-1512356954
Lancing Ray, lancing-ray
Celeste Tsai, celeste-tsai
character sketches, character-sketches
plt, plt
```
<!---
```bash
$ arena create blocks excellent-websites-395298 http://archive.org/ http://are.na/
3982834
3849379

$ arena get channel excellent-websites-395298
Excellent Websites
  Contents:
  - http://archive.org/
  - http://are.na/
```
--->
