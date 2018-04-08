const get = require('lodash.get');

const selectable = {
  title: { key: 'title' },
  author: { key: 'user.username' },
  date: { key: 'created_at' },
  slug: { key: 'slug' },
  link: { key: 'slug', method: x => `https://www.are.na/channels/${x}` },
  id: { key: 'id' },
  blockLink: { key: 'id', method: x => `https://www.are.na/block/${x}` },
  userLink: { key: 'slug', method: x => `https://www.are.na/${x}` },
  userAuthor: { key: 'username' },
};

module.exports = function print({
  select,
  multiple,
  type,
  json,
  join,
  pretty,
}, data) {
  if (json) {
    return console.log(JSON.stringify(
      multiple ? data : data[0],
      undefined,
      pretty ? 2 : 0,
    ));
  }

  const selected = select.map((item) => {
    let selectedItem = item;
    if (item === 'link' && type.match(/^block/)) {
      selectedItem = 'blockLink';
    } else if (item === 'slug' && type.match(/^block/)) {
      selectedItem = 'id';
    } else if (item === 'link' && type.match(/^user/)) {
      selectedItem = 'userLink';
    } else if (item === 'author' && type.match(/^user/)) {
      selectedItem = 'userAuthor';
    }
    return selectable[selectedItem];
  });

  data.forEach((dataItem) => {
    if (type.match(/s$/) && dataItem[type]) {
      // d = d.channels;
      dataItem[type].forEach((item) => {
        const output = selected.map(selector => (
          selector.method ?
            selector.method(get(item, selector.key))
            : get(item, selector.key)
        ));
        console.log(output.join(join));
      });
    } else {
      const output = selected.map(selector => (
        selector.method ?
          selector.method(get(dataItem, selector.key))
          : get(dataItem, selector.key)
      ));
      console.log(output.join(join));
    }
  });
  return null;
};

module.exports.error = function error(err) {
  if (err.response && err.response.data) {
    console.error(`${err.response.data.code} Error: ${err.response.data.message} (${err.response.data.description})`);
  } else {
    console.error(err);
  }
  process.exit(1);
};
