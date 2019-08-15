export default [...new Array(19).keys()]
  .map(e => ({
    title: `Entry ${e + 1}`,
    contents: require(`entry${e + 1}`);
  }));
