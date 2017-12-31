# are.na Command Line Interface

```bash
# Open the 3 most recent public channels in your browser:
$ arena channels -x3 -l | xargs open
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
```

Add the `export` line to your `.bash_profile` or `.bashrc` to persist accross terminal sessions.

## Commands:
- `get`: Fetch... (default command, run if no other is specified)
  - `channel <slug|id>`: A channel
  - `channels`: List of public channels
  - `channels <...slugs|ids>`: Multiple channels
  - `block <id>`: Block by ID
- `create`: Create... (aliases: `new` or `add`)
  - `channel <title>`: A new channel
  - `channels <...titles>`: Shortcut to `channel -m`
  - `block <channel-slug> <url|content>`: A new block. You can specify the URL, or content
  - `blocks <channel-slug> <...urls|content>`: Shortcut to `block -m`
- `delete`: Delete...
  - `channel <slug|id>`: A channel
  - `channels <...slugs|ids>`: Multiple channels
- `search`: Search...
  - `channels [query]`: Channels
  - `blocks [query]`: Blocks
  - `users [query]`: Users

## Options:
- `-m, --multiple`: accept multiple arguments (quoted) and execute the command for each: `arena create channel -m "Some Title" "Another One"`
- `-s slug author title, --select=author date`: Takes an list, and will only output the specified fields from the results (defaults to "slug" on creation, "title author slug" on fetch). Available fields: `title, author, date, slug, link`
- `-l, --link`: Print only link[s]
- `-j=string, --join="string"`: Join individual fields with "string" (default: ", ")
- `-p n, --page=n`: Fetch page number `n`
- `-x n, --per=n`: Fetch `n` tems per page
- `-S public, --status=private`: Status of new, updated, or retrieved channel[s]. One of `public`, `closed`, or `private`
- `-J, --json`: Output JSON instead of the default textual format
- `-P, --pretty`: Pretty print JSON
- `-f, --file`: Read arguments from this file (use `-` for stdin)
- `-D, --dry, --debug`: Don't make the requests, print them
- `-v, --version`: Show version
- `-h, --help`: Show help

## Examples:

```bash
$ arena create channel Excellent Websites --link
https://are.na/excellent-websites

$ arena channels -x5 -p2 -s title slug
Motion Graphics, motion-graphics-1512356954
Lancing Ray, lancing-ray
Celeste Tsai, celeste-tsai
character sketches, character-sketches
plt, plt

$ arena add blocks excellent-websites http://archive.org/ http://are.na/
3982834
3849379

$ arena search channels websites -x3
Websites, James Oates, websites--13
Websites, Ian Williams, websites-1506709551
Websites, Paul Gacon, websites--22
```
