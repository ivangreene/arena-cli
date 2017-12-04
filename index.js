#!/usr/bin/env node
const yargs = require('yargs');
const loGet = require('lodash.get');
const Arena = require('are.na');
const arena = new Arena({ accessToken: process.env.ARENA_ACCESS_TOKEN });

const types = {
  choices: ['channel', 'channels', 'block', 'blocks']
};

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
    return ({
      title: { key: 'title' },
      author: { key: 'user.username' },
      date: { key: 'created_at' },
      slug: { key: 'slug' },
      link: { key: 'slug', method: x => 'https://www.are.na/channels/' + x },
      id: { key: 'id' },
      blockLink: { key: 'id', method: x => 'https://www.are.na/block/' + x }
    })[item];
  });
  data.map(d => {
    if (type === 'channels' && d.channels) {
      // d = d.channels;
      d.channels.map(d => {
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

yargs
  .example('$0 channels -x5 -p2 -s slug', 'Get page 2 of a list of 5 new channels, print their slugs')
  .example('$0 channel great-clothes-4295553', 'Get a channel by slug')
  .example('$0 create channel Math Problems', 'Create a new channel')
  .example('$0 delete channel math-problems-389752', 'Delete a channel by slug')
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
    describe: 'Status of a new or updated channel'
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
  /*c: { 
    alias: 'content',
    type: 'string',
    describe: 'Read content from this file (use - for STDIN)'
  },*/
  v: {
    alias: 'version',
  },
  h: {
    alias: 'help',
  },
}).command(['get <type> [slugs|ids..]', '$0'], 'retrieve channels or blocks', (yargs) => {
  yargs.positional('type', types);
}, (argv) => {
  let { type, per, page, ids, select, json, join, pretty } = argv;
  let multiple = isMultiple(argv);
  method = type.replace(/s$/, '');
  select = select || ['title', 'author', 'slug'];
  if (!multiple) {
    ids = [ids.join(' ')];
  }
  if (!ids.length && argv.type === 'channels') {
    ids = [''];
  }
  Promise.all(ids.map(id => arena[method](id, { page, per }).get()))
    .then(printOut({ multiple, select, type, json, join, pretty }))
    .catch(console.error);
 // } else { // Handle a single request
 //   arena[argv.type](argv.ids.join(' ')).get()
 //     .then(datum => console.log(JSON.stringify(datum)))
 //     .catch(console.error);
 // }
}).command(['create <type> <titles|urls..>', 'new', 'add'], 'create channels or blocks', (yargs) => {
  yargs.positional('type', types);
}, (argv) => {
  let { type, titles, status, select, json, join, pretty } = argv;
  let multiple = isMultiple(argv);
  let method = type.replace(/s$/, '');
  select = select || ['slug'];
  let channel;
  if (method === 'block') {
    channel = titles.shift();
  }
  if (!multiple) {
    titles = [titles.join(' ')];
  }
  Promise.all(titles.map(title => arena[method]().create(channel || title, channel ? title : status)))
    .then(printOut({ multiple, select, type, json, join, pretty }))
    .catch(console.error); 
  /*Promise.all(titles.map(title => arena[method](title).create(status)))
    .then(printOut({ multiple, select, type, json, join, pretty }))
    .catch(console.error);*/
}).command('delete <type> <slugs|ids..>', 'delete channels or blocks', (yargs) => {
  yargs.positional('type', types);
}, (argv) => {
  let { type, ids, status } = argv;
  let multiple = isMultiple(argv);
  type = type.replace(/s$/, '');
  Promise.all(ids.map(id => arena[type](id).delete()))
    .then(() => console.log('OK.'))
    .catch(console.error);
}).argv;
