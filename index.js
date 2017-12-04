#!/usr/bin/env node
const yargs = require('yargs');
const Arena = require('are.na');
const arena = new Arena();

const argv = yargs.options({
  m: { 
    alias: 'multiple',
    type: 'boolean',
    describe: 'Accept multiple arguments and perform the command for each'
  },
  s: {
    alias: 'select',
    type: 'array',
    choices: ['title', 'author', 'date', 'slug'],
    describe: 'Items to select and print'
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
  j: { 
    alias: 'json',
    type: 'boolean',
    describe: 'Output JSON rather than the default textual format'
  },
  P: { 
    alias: 'pretty',
    type: 'boolean',
    describe: 'Pretty print JSON'
  },
  c: { 
    alias: 'content',
    type: 'string',
    describe: 'Read content from this file (use - for STDIN)'
  },
  v: {
    alias: 'version',
  },
  h: {
    alias: 'help',
  },
}).command(['get <type> [slugs|ids..]', '$0'], 'retrieve channels or blocks', (yargs) => {
  yargs.positional('type', {
    choices: ['channel', 'channels', 'block', 'blocks']
  });
}, (argv) => {
  if (argv.type === 'channels' || argv.type === 'blocks') {
    argv.m = true;
    argv.type = argv.type.replace(/s$/, '');
  }
  if (argv.m) { // Handle multiple requests
    Promise.all(argv.ids.map(id => arena[argv.type](id).get()))
      .then(datum => console.log(JSON.stringify(datum)))
      .catch(console.error);
  } else { // Handle a single request
    arena[argv.type](argv.ids.join(' ')).get()
      .then(datum => console.log(JSON.stringify(datum)))
      .catch(console.error);
  }
})
.argv;


/*.command('create <type>', 'create channels or blocks',
  (yargs) => {
    yargs.positional('type', {
      choices: ['channel', 'block', 'blocks']
    }, (yargs) => {
      console.log(yargs.argv);
    });
  }
)*/
