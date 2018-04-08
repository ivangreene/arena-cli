module.exports.isMultiple = function isMultiple(argv) {
  return (
    argv.type === 'channels'
    || argv.type === 'blocks'
    || argv.multiple
  );
};
