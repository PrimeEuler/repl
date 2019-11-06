var repl            = require('../')
var opath           = require('object-path')
var shell           = new repl()
    shell.context   = shell //global?global:window;
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
                                    shell.home      = 'shell' //global?'global':'window'
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
    shell.evil      = function(text){
        var result
        try{ result = evalInScope( text, shell.context ) }catch( e ){ result = e }
        
        //shell.loop()
        
        if( typeof result === "undefined" ){
            shell.loop()
        }else{
            shell.print( result ) 
        }
        
    }
    shell.access    = { user:'', accept:false, failures:0 }
    shell.on('navigate',function(key){
        switch(key.name){
            case 'tab':
                if(shell.request===false){
                   complete()
                }
                break;
        }
    })
    
    function evalInScope(js, contextAsScope) {
        //# Return the results of the in-line anonymous function we .call with the passed context
        return function() { with(this) { return eval(js); }; }.call(contextAsScope);
    }
    function commonPrefix(candidates, index) {
        var i, ch, memo
        do {
            memo = null
            for (i = 0; i < candidates.length; i++) {
                ch = candidates[i].charAt(index)
                if (!ch) break;
                if (!memo) memo = ch
                else if (ch != memo) break;
            }
        } while (i == candidates.length && ++index)

        return candidates[0].slice(0, index)
    }
    function getPaths(object,path){
            var nodes       = (typeof path === 'string')? path.split('.',-1) : [];
            var n           = -1
            var siblings    = []
            var nested      = {}
            var defined     = false;
            var isNode      = false;
            var isLast      = false;
            function startsWith(child){
                 return child.startsWith( nodes[n] )
            }
            // walk the path of nodes
            while(siblings.length === 0 && n < nodes.length){
                n++;
                path        = nodes.slice(0, n).join('.');
                nested      = opath.get(object, path,'DEFAULT_VAL');
                defined     = ( nested === 'DEFAULT_VAL' )? false : true;
                nested      = nested || object
                //step back to parent node branch if subTree is undefined
                //path        = defined? path : nodes.slice(0, n-1).join('.');
                //strings that start the same as current string (node[n])
                //adjacency matches
                siblings    = Object.getOwnPropertyNames(nested).filter( startsWith )//node[n]
                //is a valid string
                isNode      = siblings.indexOf( nodes[n] ) > -1;
                //is last string
                isLeaf      = ( n === nodes.length-1 );
                //longest string in common with siblings
                //autocomplete string
                if( siblings.length > 1 ){
                    nodes[n] = commonPrefix(siblings, nodes[n].length);
                    path     = nodes.slice(0, n+1).join('.');
                }
                //go to next node if not leaf
                if( siblings.length > 1 && isNode && !isLeaf ){
                    //child
                    siblings = [nodes[n]]
                }
                //set path if leaf node
                //only child
                if( siblings.length === 1 ){
                    nodes[n] = siblings.shift();
                    path   = nodes.slice(0, n+1).join('.');
                }
            }
            return { path:path, siblings:siblings }
        }
    function complete(){
        var paths =  getPaths(shell.context, shell.getText().buffer)
            shell.setText( { buffer:paths.path, index:paths.path.length })
            if(paths.siblings.length > 0){
                shell.print( paths.siblings )
            }
    }
    
//  terminal emulator process    
    if(process.stdin.isTTY){
        process.stdin.setRawMode( true )
    }
//  connect terminal emulator to line discipline
    process.stdin.pipe( shell  ).pipe( process.stdout )
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

      
    
    
    