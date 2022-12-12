# so-loader

This project is an auto-loader for FFIs. It only supports the `so` format and the Linux OS.

Instead of having to manually write out the functions and types for functions, this library will automatically read the debug symfols from the `so` file and generate the FFI for you.

## Building and runnning

To build the project run `yarn build`. The outputs of the build will be available in the `dist` directory. To watch the source and build on change run `yarn build --watch`.

The project targets Node as it's runtime, so it's as easy as `node .` to run it. (This starts `dist/index.js`).
