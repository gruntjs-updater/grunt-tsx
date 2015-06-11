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
            next: function() { //next no white space character
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
            expectWrappedValue: function(start, end, escape) {
                ctx.expect(start);
                var range = [ctx.start+start.length,];
                for(var n=range[0];n<src.length;n++) {
                    if(src.substr(n, end.length)==end) {
                        
                        if(escape && end.length==1 && src[n-1] == '\\')
                            continue;
                            
                        range[1] = n;
                        break;
                    }
                }
                if(range[1]!=undefined) {
                    ctx.start = range[1]+end.length-1;
                    var res = src.substr(range[0], range[1]-range[0]);
                    if(escape && end.length==1)
                        res = res.replace(new RegExp('\\\\'+end,'g'), end);
                    return res;
                }
                
                throw 'fail to parse wrapped value';
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
                var xml = ctx.expectWrappedValue('`', '`', true);
                out+=('('+JSX.transform(xml)+')');
                ctx.expect(')');
                
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