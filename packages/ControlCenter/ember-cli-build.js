'use strict';

// eslint-ignore-newt-line @typescript-eslint/no-var-requires
const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
console.log('PLOP', path.resolve(__dirname, 'dist'));

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    autoImport: {
      webpack: {
        plugins: [
          new CopyPlugin({
            patterns: [
              {
                from: path.resolve(
                  __dirname,
                  '../../node_modules/@shoelace-style/shoelace/dist/assets',
                ),
                // For some reason copying to dist does not work...
                to: path.resolve(__dirname, 'public/assets/shoelace/assets'),
              },
            ],
          }),
        ],
      },
    },
  });

  return app.toTree();
};
