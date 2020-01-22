var repl        = require('../')
var pty         = require('node-pty');
var os          = require('os')
var shell       = new repl()
var username    = function(text,callback){ return callback(true) }
var password    = function(text,callback){ return callback(true) }
var login       = function(sh){ 
        sh.access    = { user:'', accept:false, failures:0 }
        sh.ask('username', function( user ){
            username(user, function(accept){
                sh.access.user = user
                if(accept){
                    sh.ask('password', function( pass ){
                        password( pass , function(accept){
                            sh.access.accept = accept
                            if(accept){
                                init( sh )
                            }else if(sh.access.failures < 2){
                                sh.access.failures ++
                                login( sh )
                            }else{
                                sh.kill()
                            }
                        })
                    },true)    
                }else if(sh.access.failures < 2){
                    sh.access.failures ++
                    login( sh )
                }else{
                    sh.kill()
                }
            })
            
        },false) }
var init        = function(sh){
        sh.user      = sh.access.user // os.userInfo().username //username
        sh.at        = '@'
        sh.home      = os.hostname()
        sh.context.global   = global
        sh.context.shell    = sh
        sh.context.os       = os
        sh.context.exec     = function(){
            var spawn       = pty.spawn.apply( null, arguments );
            var resize      = function(size){ spawn.resize(size[0],size[1]) }
                sh.isRaw = true
                sh.io
                    .pipe( spawn, { end:false } )
                    .pipe( sh.io, { end:false } )
                sh.on('resize',resize)
                resize([sh.columns,sh.rows])
                spawn.on('exit',function(){
                    //cleanup pipe
                    sh.io.removeAllListeners('unpipe')
                    sh.io.removeAllListeners('drain')
                    sh.io.removeAllListeners('error')
                    sh.io.removeAllListeners('close')
                    sh.io.removeAllListeners('finish')
                    //cleanup terminal
                    sh.removeListener('resize',resize)
                    spawn.destroy()
                    sh.isRaw = false
                    sh.io.resume()
                    sh.loop()
                })
        }
        sh.context.login    = function(){
            login(sh)
        }
}


    /*
    shell.evil  = function(text){
            var result = shell.accessor.get(shell.context,text)
            if(text.indexOf('=') > -1){
                text = text.split('=')
                result = JSON.parse(text[1].trim())
                shell.accessor.set(shell.context, text[0].trim(), result )
            }
            
            switch(typeof result){
                case 'function':
                    try{
                        shell.print( result() ) 
                    }catch(e){
                        shell.print(e)
                    }
                    break;
                case 'undefined':
                    shell.loop()
                    break;
                default:
                    shell.print( result ) 
                
            }
            
        }
    */
    
    
    
    
//  terminal emulator process    
    if(process.stdin.isTTY){
        process.stdin.setRawMode( true )
    }
//  connect terminal emulator to line discipline
    process.stdin.pipe( shell ).pipe( process.stdout )
//  listen for terminal resizeing
    process.stdout.on('resize', function() {
        shell.setSize( process.stdout )
    })
//  set columns and rows
    shell.setSize( process.stdout )  
//  sigkill
    shell.on('end',     function(){
        process.stdin.setRawMode( false )
        process.exit()
    } ) 
//  authenticate 
    login( shell )

      
    
    
    