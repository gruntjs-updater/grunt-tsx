# grunt-tsx

## TypeScript transformation Task for Grunt

grunt-tsx is a npm package that transform XML like syntax wrapped by JSX(``) in TypeScript files to React.createElement calls.

## Getting Started
This minimalist `Gruntfile.js` will transform `*.ts` files in all subdirectories of the ts folder and will copy results to out/jsx-out:

````javascript
module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                src: ["out/jsx-out/**/*.ts"],
                outDir: "out/js-out"
            },
            options: {
                module: "amd",
                target: 'es3'
            }
        },
        'grunt-tsx': {
            target: {
                ext: 'ts',
                srcDir: 'ts',
                dstDir: 'out/jsx-out'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-tsx');
    grunt.loadNpmTasks('grunt-ts');
    
    grunt.registerTask('default', ['grunt-tsx:target', 'ts']);
};

## License

Licensed under the MIT License.
