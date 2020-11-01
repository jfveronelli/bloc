# Bloc
Progressive Web Application for note taking, featuring GitHub Flavored Markdown, tags, synchronization and encryption.

## Project setup
```
npm install
```

### Compile and hot-reload for development
```
npm run serve
```

### Compile and minify for production
```
npm run build
```

### Lint and fix files
```
npm run lint
```

### Deploy to Google App Engine
```
npm run build
cd dist
gcloud auth login
gcloud config set project <projectID>
gcloud app deploy --version=<version> --quiet
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
