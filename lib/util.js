module.exports.isMultiple = function isMultiple(argv) {
  return (
    argv.type === 'channels'
    || argv.type === 'blocks'
    || argv.multiple
  );
};

module.exports.defaultSelection = function defaultSelection(argv) {
  if (argv.link) return ['link'];
  switch (argv.command) {
    case 'get':
    case 'search':
      return ['title', 'author', 'slug'];
    case 'create':
    case 'edit':
      return ['slug'];
    default:
      return [];
  }
};

module.exports.chooseIterables = {
  create: 'titles',
  get: 'ids',
  search: 'query',
  default: 'ids',
};
