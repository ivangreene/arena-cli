#!/usr/bin/env node
const Yargs = require('yargs');
const fs = require('fs');
const isEqual = require('lodash.isequal');
const pick = require('lodash.pick');
const Arena = require('are.na');
const editor = require('external-editor');
const print = require('./lib/print');
const util = require('./lib/util');
const yaml = require('js-yaml');

const arena = new Arena({ accessToken: process.env.ARENA_ACCESS_TOKEN });

const types = yargs => yargs.positional('type', {
  choices: ['channel', 'channels', 'block', 'blocks'],
});

const commands = command => (argv) => {
  let { select, file } = argv;
  const multiple = util.isMultiple(argv);
  const method = argv.type.replace(/s$/, '');
  // let iterables = command === 'create' ? titles : ids;
  let iterables = [...(function chooseIterables() {
    switch (command) {
      case 'create':
        return argv.titles;
      case 'get':
        return argv.ids;
      case 'search':
        return argv.query;
      default:
        return argv.ids;
    }
  }())];
  if (!select && argv.link) select = ['link'];

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
    iterables = [...iterables, ...content];
  }

  let channel;
  let editable = ['title'];

  let promises = () => [];
  let log;

  switch (command) {
    case 'get':
      select = select || ['title', 'author', 'slug'];
      if (!multiple && iterables.length)
        iterables = [iterables.join(' ')];
      if (!iterables.length && argv.type === 'channels')
        iterables = [''];
      promises = () => iterables.map(id => (
        arena[method](id, pick(argv, ['page', 'per', 'status'])).get()
      ));
      break;

    case 'create':
      select = select || ['slug'];
      if (method === 'block')
        channel = iterables.shift();
      if (!multiple && iterables.length)
        iterables = [iterables.join(' ')];
      promises = () => iterables.map(item => (
        arena[method]().create(
          channel || item,
          channel ? item : argv.status,
        )
      ));
      break;

    case 'delete':
      promises = () => iterables.map(id => arena[method](id).delete());
      log = () => console.log('OK.');
      break;

    case 'search':
      select = select || ['title', 'author', 'slug'];
      if (!argv.multiple)
        iterables = [iterables.join(' ')];
      promises = () => iterables.map(query => (
        arena.search(query || undefined)[argv.type](pick(
          argv,
          ['page', 'per', 'status'],
        ))
          .then(d => ({ [argv.type]: d }))
      ));
      break;

    case 'edit':
      select = select || ['slug'];
      if (method === 'block')
        editable = ['content', 'title', 'description'];
      else if (method === 'channel')
        editable = ['title', 'status'];
      promises = () => iterables.map(slug => (
        arena[method](slug).get().then((item) => {
          let content = {};
          let before = {};
          if (argv.yaml) {
            before = pick(item, editable);
            content = yaml.safeLoad(editor.edit(yaml.safeDump(
              before,
              { lineWidth: 78 },
            )));
          } else {
            before[editable[0]] = item[editable[0]];
            content[editable[0]] = editor.edit(before[editable[0]])
              .replace(/[\r\n]+$/, '');
          }
          if (!isEqual(content, before)) {
            // Use Object.assign: currently a bug in are.na's API prevents
            // updating partially without wiping out the other fields (i.e.:
            // passing only "content" to be updated will wipe out title and
            // description if they are not set)
            return arena[method](item.id)
              .update(Object.assign({}, pick(item, editable), content))
              .then(result => (
                // Returns new object for channels, not blocks
                Promise.resolve(`${result ? result.id : slug}: OK.`)
              ));
          }
          return Promise.resolve(`${slug}: No change, not updated.`);
        })
      ));
      log = message => message.map(m => console.log(m));
      break;

    default:
      break;
  }

  if (argv.debug) {
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

Yargs // eslint-disable-line no-unused-expressions
  .command(
    ['get <type> [slugs|ids..]', '$0'],
    'retrieve channels or blocks',
    types,
    commands('get'),
  )
  .command(
    ['create <type> [titles|urls..]', 'new', 'add'],
    'create channels or blocks',
    types,
    commands('create'),
  )
  .command(
    'delete <type> [slugs|ids..]',
    'delete channels or blocks',
    types,
    commands('delete'),
  )
  .command(
    'search <type> [query..]',
    'search channels, blocks, or users',
    yargs => yargs.positional('type', {
      choices: ['channels', 'blocks', 'users'],
    }),
    commands('search'),
  )
  .command(
    'edit <type> <slugs|ids..>',
    'edit a block or channel',
    types,
    commands('edit'),
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
