#!/usr/bin/env node
const yargs = require('yargs');
const loGet = require('lodash.get');
const Arena = require('are.na');
const arena = new Arena({ accessToken: process.env.ARENA_ACCESS_TOKEN });

const logError = err => {
  if (err.response && err.response.data)
    console.error(`${err.response.data.code} Error: ${err.response.data.message} (${err.response.data.description})`);
  else console.error('Unknown Error');
  process.exit(1);
};

const selectable = {
  title: { key: 'title' },
  author: { key: 'user.username' },
  date: { key: 'created_at' },
  slug: { key: 'slug' },
  link: { key: 'slug', method: x => 'https://www.are.na/channels/' + x },
  id: { key: 'id' },
  blockLink: { key: 'id', method: x => 'https://www.are.na/block/' + x },
  userLink: { key: 'slug', method: x => 'https://www.are.na/' + x },
  userAuthor: { key: 'username' }
};

const types = yargs => yargs.positional('type', {
  choices: ['channel', 'channels', 'block', 'blocks']
});

const isMultiple = (argv) => {
  return ((argv.type === 'channels' || argv.type === 'blocks') || argv.multiple);
};

const printOut = ({ select, multiple, type, json, join, pretty }) => (data) => {
  if (json) {
    return console.log(JSON.stringify(multiple ? data : data[0], undefined, pretty ? 2 : 0));
  }
  select = select.map(item => {
    if (item === 'link' && type.match(/^block/))
      item = 'blockLink';
    else if (item === 'slug' && type.match(/^block/))
      item = 'id';
    else if (item === 'link' && type.match(/^user/))
      item = 'userLink';
    else if (item === 'author' && type.match(/^user/))
      item = 'userAuthor';
    return selectable[item];
  });
  data.map(d => {
    if (type.match(/s$/) && d[type]) {
      // d = d.channels;
      d[type].map(d => {
        let output = select.map(s => {
          return s.method ?
            s.method(loGet(d, s.key))
            : loGet(d, s.key);
        });
        console.log(output.join(join));
      });
    } else {
      let output = select.map(s => {
        return s.method ?
          s.method(loGet(d, s.key))
          : loGet(d, s.key);
      });
      console.log(output.join(join));
    }
  });
};

const commands = command => argv => {
  let { type, titles, status, per, page, ids, debug,
    select, json, join, pretty, file, query } = argv;
  let multiple = isMultiple(argv);
  let method = type.replace(/s$/, '');
  // let iterables = command === 'create' ? titles : ids;
  let iterables = (function () {
    switch (command) {
      case 'create':
        return titles;
      case 'get':
        return ids;
      case 'search':
        return query;
      default:
        return ids;
    }
  })();
  if (!select && argv.link)
    select = ['link'];
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
    let content = require('fs').readFileSync(file, 'utf8').trim();
    content = content.length ?
      (multiple ? content.split('\n') : [content])
      : [];
    iterables = [...iterables, ...content];
  }

  let channel;

  let promises = () => [];
  let log;

  switch (command) {

    case 'get':
      select = select || ['title', 'author', 'slug'];
      if (!multiple && iterables.length)
        iterables = [iterables.join(' ')];
      if (!iterables.length && argv.type === 'channels')
        iterables = [''];
      promises = () => iterables.map(id => arena[method](id, { page, per, status }).get());
      break;

    case 'create':
      select = select || ['slug'];
      if (method === 'block')
        channel = iterables.shift();
      if (!multiple && iterables.length)
        iterables = [iterables.join(' ')];
      promises = () => iterables.map(item => arena[method]().create(channel || item, channel ? item : status));
      break;

    case 'delete':
      promises = () => iterables.map(id => arena[method](id).delete())
      log = () => console.log('OK.');
      break;

    case 'search':
      select = select || ['title', 'author', 'slug'];
      if (!argv.multiple)
        iterables = [iterables.join(' ')];
      promises = () => iterables.map(query => arena.search(query || undefined)
        [type]({ per, page, status })
        .then(d => ({ [type]: d })));
      break;

  }

  if (debug) {
    log = () => {};
    arena.requestHandler = (...req) => new Promise((resolve, reject) => {
      console.log(req[0].toUpperCase(), ...req.slice(1));
      resolve({});
    });
  }

  log = log || printOut({ multiple, select, type, json, join, pretty });

  Promise.all(promises())
    .then(log)
    .catch(logError);
};

yargs
  .command(['get <type> [slugs|ids..]', '$0'], 'retrieve channels or blocks',
    types, commands('get'))
  .command(['create <type> [titles|urls..]', 'new', 'add'],
    'create channels or blocks', types, commands('create'))
  .command('delete <type> [slugs|ids..]', 'delete channels or blocks',
    types, commands('delete'))
  .command('search <type> [query..]', 'search channels, blocks, or users',
    yargs => yargs.positional('type', {
      choices: ['channels', 'blocks', 'users']
    }), commands('search'))
  .options({
  m: { 
    alias: 'multiple',
    type: 'boolean',
    describe: 'Accept multiple arguments and perform the command for each'
  },
  s: {
    alias: 'select',
    type: 'array',
    choices: ['title', 'author', 'date', 'slug', 'link', 'id'],
    describe: 'Fields to select and print'
  },
  l: {
    alias: 'link',
    type: 'boolean',
    describe: 'Print only link[s]'
  },
  j: {
    alias: 'join',
    type: 'string',
    default: ', ',
    describe: 'String to join fields by'
  },
  p: { 
    alias: 'page',
    type: 'number',
    describe: 'Get results from the specified page'
  },
  x: { 
    alias: 'per',
    type: 'number',
    describe: 'Get this many results per page'
  },
  S: {
    alias: 'status',
    type: 'string',
    choices: ['public', 'closed', 'private'],
    describe: 'Status of new, updated, or retrieved channel[s]'
  },
  J: { 
    alias: 'json',
    type: 'boolean',
    describe: 'Output JSON rather than the default textual format'
  },
  P: { 
    alias: 'pretty',
    type: 'boolean',
    describe: 'Pretty print JSON'
  },
  f: { 
    alias: 'file',
    type: 'string',
    describe: 'Read arguments from this file (use - for stdin)'
  },
  D: {
    alias: ['dry', 'debug'],
    type: 'boolean',
    describe: 'Don\'t make the requests, print them'
  },
  v: {
    alias: 'version',
  },
  h: {
    alias: 'help',
  },
}).example('$0 channels -x5 -p2 -s slug', 'Get page 2 of a list of 5 new channels, print their slugs')
  .example('$0 channel great-clothes-4295553', 'Get a channel by slug')
  .example('$0 create channel Math Problems', 'Create a new channel')
  .example('$0 delete channel math-problems-389752', 'Delete a channel by slug').argv;
