const metalsmith = require('metalsmith')
const markdown = require('metalsmith-markdown')
const layouts = require('metalsmith-layouts')
const collections = require('metalsmith-collections')
const discoverPartials = require('metalsmith-discover-partials')
const permalinks  = require('metalsmith-permalinks')
const watch = require('metalsmith-watch')
const serve = require('metalsmith-serve')
const prism = require('metalsmith-prism')
const assets = require('metalsmith-assets')
const dateFormat = require('metalsmith-date-formatter')

const SRC = './src'
const DEST = './docs'
const META = {
    site: {
        name: 'hypercraft',
        description: 'A collection of Hyperapp tricks & patterns'
    }
}


metalsmith(__dirname)
.metadata(META)
.source(SRC)
.destination(DEST)
.use(markdown({
    gfm: true,
    tables: true,
    langPrefix: 'language-', 
}))
.use(function (files, metalsmith, done) {
    for (var file in files) {
        if (file.match(/articles\//g)) {
            files[file].relativeRoot = '../..'
        } else if (file.match(/about/g)) {
            files[file].relativeRoot = '..'
        } else {
            files[file].relativeRoot = '.'
        }
    }
    done()
})
.use(prism())
.use(collections({
    articles: {
        pattern: 'articles/**/*.html',
        sortBy: 'date',
        reverse: true,      
    }
}))
.use(dateFormat({dates: 'date'}))
.use(permalinks({
    relative: false,
    pattern: 'post/:title',
}))
.use(discoverPartials())
.use(layouts({ default: 'article.hbs' }))
.use(assets({
    source: './assets',
    destination: './assets'
}))
.use(serve({
    port: 8080,
    verbose: true,
}))
.use(watch({
    paths: {
        'src/**/*': true,
        'layouts/**/*': true,
        'partials/**/*': true,
    }
}))
.build(err => {
    err && console.log('ERROR:', err)
    !err && console.log('DONE')
})