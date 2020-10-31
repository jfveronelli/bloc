module.exports = {
  configureWebpack: {
    performance: {
      hints: false
    },
    module: {
      noParse: /\.wasm$/,
      rules: [
        {
          test: /\.wasm$/,
          loaders: ["base64-loader"],
          type: "javascript/auto"
        }
      ]
    }
  },
  pwa: {
    name: "Bloc",
    workboxOptions: {
      exclude: ["app.yaml", "robots.txt", /\.map$/]
    }
  },
  lintOnSave: false
};
