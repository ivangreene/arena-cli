const pick = require('lodash.pick');
const isEqual = require('lodash.isequal');
const editor = require('external-editor');
const yaml = require('js-yaml');

module.exports = function commands(arena) {
  return {

    get(args) {
      let { iterables } = args;
      if (!args.multiple && iterables.length)
        iterables = [iterables.join(' ')];
      if (!iterables.length && args.type === 'channels')
        iterables = [''];
      return {
        promises: () => iterables.map(id => (
          arena[args.method](id, pick(args, ['page', 'per', 'status'])).get()
        )),
      };
    },

    create(args) {
      let { iterables } = args;
      let channel;
      if (args.method === 'block')
        channel = iterables.shift();
      if (!args.multiple && iterables.length)
        iterables = [iterables.join(' ')];
      return {
        promises: () => iterables.map(item => (
          arena[args.method]().create(
            channel || item,
            channel ? item : args.status,
          )
        )),
      };
    },

    delete(args) {
      return {
        promises: () => args.iterables.map(id => (
          arena[args.method](id).delete()
        )),
        log: () => console.log('OK.'),
      };
    },

    search(args) {
      let { iterables } = args;
      if (!args.multiple)
        iterables = [iterables.join(' ')];
      return {
        promises: () => iterables.map(query => (
          arena.search(query || undefined)[args.type](pick(
            args,
            ['page', 'per', 'status'],
          ))
            // Separate into categories for printing
            .then(d => ({ [args.type]: d }))
        )),
      };
    },

    edit(args) {
      let editable = ['title'];
      if (args.method === 'block')
        editable = ['content', 'title', 'description'];
      else if (args.method === 'channel')
        editable = ['title', 'status'];
      return {
        promises: () => args.iterables.map(slug => (
          arena[args.method](slug).get().then((item) => {
            let content = {};
            let before = {};
            if (args.yaml) {
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
              return arena[args.method](item.id)
                .update(Object.assign({}, pick(item, editable), content))
                .then(result => (
                  // Returns new object for channels, not blocks
                  Promise.resolve(`${result ? result.id : slug}: OK.`)
                ));
            }
            return Promise.resolve(`${slug}: No change, not updated.`);
          })
        )),
        log: message => message.map(m => console.log(m)),
      };
    },

  };
};
