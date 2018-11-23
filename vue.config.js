module.exports = {
  configureWebpack: {
    performance: {
      hints: false
    }
  },
  pwa: {
    workboxOptions: {
      importWorkboxFrom: "local",
      importsDirectory: "cache",
      exclude: ["app.yaml", "favicon.ico", "manifest.json", "robots.txt", /\.map$/, /\.png$/, /\.svg$/]
    }
  },
  lintOnSave: false
};
