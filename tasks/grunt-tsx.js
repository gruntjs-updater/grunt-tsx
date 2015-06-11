module.exports = function(grunt) {
    var fs = require('fs');
    var JSX = require('react-tools');
    
    grunt.registerMultiTask('grunt-tsx', 'transform JSX(`<div></div>`) to React.createElement like calls', function() {
        var data = this.data;
        var cwd = data.cwd || process.cwd();
        var ext = data.ext || 'ts';
        var srcDir = data.srcDir || '';
        var dstDir = data.dstDir || '';
        var files = grunt.task.normalizeMultiTaskFiles([srcDir+'/**/*.'+ext]);
        
        files.forEach(function(files) {
            files.src.forEach(function(relFilePath) {
                transform(relFilePath, dstDir);
            })
        });
    });
    
    var parser = function(src) {
        var ctx = {
            start: 0,
            next: function() {
                ctx.start++;
                for(var n=ctx.start; n<src.length; n++) {
                    var chr = src[n];
                    if(chr!=' ' && chr!='\t' && chr!='\n') {
                        ctx.start = n;
                        break;
                    }
                }
            },
            match: function(s) {
                if(src.substr(ctx.start, s.length)!=s) {
                    throw "not match '"+s+"'";
                }
            },
            expect: function(s) {
                ctx.next();
                ctx.match(s);
            },
            parseJSX: function(wrap) {
                ctx.next();
                var end = -1;
                for(var n=ctx.start;n<src.length;n++) {
                    if(src[n]==wrap) {
                        end = n;
                        break;
                    }
                }
                
                if(end!=-1) {
                    var res = src.substr(ctx.start, end-ctx.start);
                    ctx.start = end;
                    ctx.expect(')');
                    return res;
                }
                
                throw 'parseJSX failed';
            },
            findKeyword: function(kWord) {
                var i = src.indexOf(kWord, ctx.start);
                if(i==-1)
                    return false;
                ctx.start = i + kWord.length-1;
                return true;
            }
        };
        return ctx;
    }

    var transform = function(file, dstDir) {
        var data = fs.readFileSync(file).toString();
        var ctx = parser(data);
        
        var out = '';
        var start = 0;
        var keyword = 'JSX';
        while(ctx.findKeyword(keyword)) {
            try {
                out+=(data.substr(start, ctx.start-start-keyword.length+1));
                
                ctx.expect('(');
                ctx.expect('`');
                
                out+=('('+JSX.transform(ctx.parseJSX('`'))+')');
                start = ctx.start+1;
            }
            catch(e) {
                grunt.log.error('fail to parse ', file,', ', e);
            }
        }
        out += data.substr(start);
        var f = file.split('/').map(function(s,i){ return i==0?dstDir:s; }).join('/');
        grunt.file.write(f, out);
    }
}