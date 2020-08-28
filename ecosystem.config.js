module.exports = {
    apps: [{
        name: 'nts-router',
        script: './dist/server.js',
        watch: false,
        env: {
            'PORT': 3000,
            'NODE_ENV': 'production'
        }
    }]
};