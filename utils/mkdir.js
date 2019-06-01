const path = require('path'); 
const fs = require('fs'); 
const _0777 = parseInt('0777', 8); 

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    

    return new Promise((resolve, reject) => {
        xfs.mkdir(p, mode, (er) => {
            if (!er) {
                made = made || p;
                resolve();
                return cb(null, made);
            }
            switch (er.code) {
                case 'ENOENT':
                    mkdirP(path.dirname(p), opts, function (er, made) {
                        if (er) {
                            reject();
                            cb(er, made);
                        }
                        else 
                            mkdirP(p, opts, cb, made).then(resolve, reject);
                    }).then(resolve, reject);
                    break;
                // In the case of any other error, just see if there's a dir
                // there already.  If so, then hooray!  If not, then something
                // is borked.
                default:
                    xfs.stat(p, function (er2, stat) {
                        // if the stat fails, then that's super weird.
                        // let the original error be the failure reason.
                        if (er2 || !stat.isDirectory()) cb(er, made)
                        else {
                            resolve();
                            cb(null, made);
                        }
                    });
                    break;
            }
        });
    });
}