# are.na Command Line Interface

## `$ arena create channel Great Websites`

## Commands:
- `create`: Create...
  - `channel [title]`: A new channel
  - `block [channel-slug] [url|-c [file]|content]`: A new block. You can specify the URL, or content (or -c to read content from a file)
  - `blocks`: Shortcut to `block -m`
- `get`: Fetch...
  - `channel [slug|id]`: A channel
  - `channels`: List of public channels
  - `block [id]`: Block by ID

## Options:
- `-m, --multiple`: accept multiple arguments (quoted): `arena create channel -m "Some Title" "Another One"`
- `-p n, --page=n`: Fetch page number `n`
- `-x n, --per=n`: Fetch `n` tems per page
- `-j, --json`: Output JSON instead of the default textual format
- `-P, --pretty`: Pretty print JSON
- `-c file.txt, --content=file.txt`: Read content from `file.txt`, or use `-` for STDIN

## Examples:

```bash
$ arena create channel Excellent Websites
excellent-websites-395298

$ arena create blocks excellent-websites-395298 http://archive.org/ http://are.na/
3982834
3849379

$ arena get channel excellent-websites-395298
Excellent Websites
  Contents:
  - http://archive.org/
  - http://are.na/
```
