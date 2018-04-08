#!/usr/bin/env node
const Yargs = require('yargs');
const fs = require('fs');
const Arena = require('are.na');
const print = require('./lib/print');
const util = require('./lib/util');

const arena = new Arena({ accessToken: process.env.ARENA_ACCESS_TOKEN });

const commands = require('./lib/commands')(arena);

const runCommand = command => (argv) => {
  let { select, file } = argv;
  // Determine if we run multiple operations, or just one
  const multiple = util.isMultiple(argv);
  // Find base method (remove plurality)
  const method = argv.type.replace(/s$/, '');

  // Get the iterable items from the arguments (different names for different
  // commands)
  let iterables = [...argv[
    util.chooseIterables[command] || util.chooseIterables.default
  ]];

  select = select || util.defaultSelection({ command, ...argv });

  // Disable automatic stdin reading for now...
  //  if (!file) {
  //    if ((command === 'get' && !iterables.length && argv.type !== 'channels') ||
  //        (command === 'create' && iterables.length <= (method === 'block' ?
  //        1 : 0))) {
  //      console.warn('Not enough arguments, reading from stdin...');
  //      file = '-';
  //    }
  //  }

  if (file) {
    if (file === '-') file = '/dev/stdin';
    let content = fs.readFileSync(file, 'utf8').trim();
    if (content.length) {
      content = multiple ? content.split('\n') : [content];
    } else {
      content = [];
    }
    // Append the contents of the file to our list of iterables
    iterables = [...iterables, ...content];
  }

  const run = commands[command]({
    ...argv,
    method,
    iterables,
  });

  // promises is a function, returning an Array of Promises
  const { promises } = run;

  let { log } = run;

  if (argv.debug) {
    // Dry-run/debug mode. No requests made, just printed
    log = () => {};
    arena.requestHandler = (...req) => new Promise((resolve) => {
      console.log(req[0].toUpperCase(), ...req.slice(1));
      resolve({});
    });
  }

  log = log || (data => print({
    multiple,
    select,
    ...argv,
  }, data));

  Promise.all(promises())
    .then(log)
    .catch(print.error);
};

const types = yargs => yargs.positional('type', {
  choices: ['channel', 'channels', 'block', 'blocks'],
});

Yargs // eslint-disable-line no-unused-expressions
  .command(
    ['get <type> [slugs|ids..]', '$0'],
    'retrieve channels or blocks',
    types,
    runCommand('get'),
  )
  .command(
    ['create <type> [titles|urls..]', 'new', 'add'],
    'create channels or blocks',
    types,
    runCommand('create'),
  )
  .command(
    'delete <type> [slugs|ids..]',
    'delete channels or blocks',
    types,
    runCommand('delete'),
  )
  .command(
    'search <type> [query..]',
    'search channels, blocks, or users',
    yargs => yargs.positional('type', {
      choices: ['channels', 'blocks', 'users'],
    }),
    runCommand('search'),
  )
  .command(
    'edit <type> <slugs|ids..>',
    'edit a block or channel',
    types,
    runCommand('edit'),
  )
  .options({
    m: {
      alias: 'multiple',
      type: 'boolean',
      describe: 'Accept multiple arguments and perform the command for each',
    },
    s: {
      alias: 'select',
      type: 'array',
      choices: ['title', 'author', 'date', 'slug', 'link', 'id'],
      describe: 'Fields to select and print',
    },
    l: {
      alias: 'link',
      type: 'boolean',
      describe: 'Print only link[s]',
    },
    j: {
      alias: 'join',
      type: 'string',
      default: ', ',
      describe: 'String to join fields by',
    },
    p: {
      alias: 'page',
      type: 'number',
      describe: 'Get results from the specified page',
    },
    x: {
      alias: 'per',
      type: 'number',
      describe: 'Get this many results per page',
    },
    S: {
      alias: 'status',
      type: 'string',
      choices: ['public', 'closed', 'private'],
      describe: 'Status of new, updated, or retrieved channel[s]',
    },
    J: {
      alias: 'json',
      type: 'boolean',
      describe: 'Output JSON rather than the default textual format',
    },
    P: {
      alias: 'pretty',
      type: 'boolean',
      describe: 'Pretty print JSON',
    },
    f: {
      alias: 'file',
      type: 'string',
      describe: 'Read arguments from this file (use - for stdin)',
    },
    y: {
      alias: 'yaml',
      type: 'boolean',
      default: true,
      describe: 'Edit blocks/channels using yaml',
    },
    D: {
      alias: ['dry', 'debug'],
      type: 'boolean',
      describe: 'Don\'t make the requests, print them',
    },
    v: {
      alias: 'version',
    },
    h: {
      alias: 'help',
    },
  })
  .example(
    '$0 channels -x5 -p2 -s slug',
    'Get page 2 of a list of 5 new channels, print their slugs',
  )
  .example('$0 channel great-clothes-4295553', 'Get a channel by slug')
  .example('$0 create channel Math Problems', 'Create a new channel')
  .example(
    '$0 delete channel math-problems-389752',
    'Delete a channel by slug',
  )
  .argv;
