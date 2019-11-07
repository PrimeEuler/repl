var repl            = require('../')
var shell           = new repl()
    shell.context   = shell
    shell.access    = { user:'', accept:false, failures:0 }
    shell.username  = function(text,callback){ return callback(true) }
    shell.password  = function(text,callback){ return callback(true) }
    shell.auth      = function(){ 
            shell.ask('username', function( username ){
                shell.username(username, function(accept){
                    shell.access.user = username
                    if(accept){
                        shell.ask('password', function( password ){
                            shell.password(password, function(accept){
                                shell.access.accept = accept
                                if(accept){
                                    shell.user      = username
                                    shell.at        = '@'
                                    shell.home      = 'sheldon' //global?'global':'window'
                                }else if(shell.access.failures < 2){
                                    shell.access.failures ++
                                    shell.auth()
                                }else{
                                    shell.kill()
                                }
                            })
                        },true)    
                    }else if(shell.access.failures < 2){
                        ldisc.access.failures ++
                        ldisc.auth()
                    }else{
                        ldisc.kill()
                    }
                })
                
            },false) }
    
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
//  authenticate 
    shell.auth()
//  sigkill
    shell.on('end',     function(){
        process.stdin.setRawMode( false )
        process.exit()
    } ) 

      
    
    
    