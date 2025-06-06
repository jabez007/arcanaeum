const path = require('path');

module.exports = {
  chainWebpack: (config) => {
    // alias to lib directory
    config.resolve.alias.set('_', path.resolve(__dirname, './src/lib'));
  },
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'service-worker.js',
    },
  },
};
