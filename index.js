//  dependencies
var ansi    = require('ansi-escape-sequences');
var lineman = require('@primeeuler/lineman');

function repl(){
    var ldisc           = new lineman()
    var store           = [];
        ldisc.user      = '';
        ldisc.at        = '';
        ldisc.home      = '';
        ldisc.prompt    = '>';
        ldisc.debug     = false
        ldisc.respond   = false;
        ldisc.request   = false;
        ldisc.context   = {}
        ldisc.accessor  = require('./object-path');
        ldisc.inspect   = require('util').inspect;
        ldisc.io.cleanup = []
        ldisc.io.on('newListener',function(event,listener){
            //ldisc.io.cleanup.push([event,listener])
        })
        
        ldisc.READ  = function(text){
            ldisc.io.write(ldisc.echo(text))
        }
        ldisc.evil  = function(text){
            var result
            function evalInScope(js, contextAsScope) {
                //# Return the results of the in-line anonymous function we .call with the passed context
                return function() { with(this) { return eval(js); }; }.call(contextAsScope);
            }
            try{ result = evalInScope( text, ldisc.context ) }catch( e ){ result = e }
            if( typeof result === "undefined" ){
                ldisc.loop()
            }else if(result == null){
                ldisc.io.write('\n')
                ldisc.loop()
            }
            
            else{
                ldisc.print( result ) 
            }
            
        }
        ldisc.print = function(object){
            ldisc.io.write('\r\n' + ldisc.inspect(object,false,10,true) + '\r\n')
        }
        ldisc.loop  = function(){
            ldisc.io.write( ldisc.echo( ldisc.getText() ) )
        }
        ldisc.echo  = function(text){
        //  horizontal scrolling
            var prompt  = ldisc.user.length 
                        + ldisc.at.length 
                        + ldisc.home.length 
                        + ldisc.prompt.length
            var columns = ldisc.columns
            var range   = columns - prompt
            var end     = prompt + text.buffer.length
            var scroll  = end - columns
            var tail    = text.buffer.length - text.index 
            var head    = scroll  
            var cursor  = prompt + text.index + 1
            var line    = text.buffer
                if(scroll > 0){ 
                    cursor = (columns - tail) + 1
                    if( tail > range ){
                        head = scroll - (tail - range);
                        cursor = prompt + 1
                    }
                    line = text.buffer.slice( head, head+range) ;
                }
        // TODO: multi-line support    
            
        //  ansi echo
        // prompt phrase = ldisc.user + ldisc.at + ldisc.home + ldisc.prompt
        // line phrase  = prompt phrase + line
        //lexer/parser
        var phrase = {
            user:   { type: 'identifier',   value:ldisc.user,   color: [255,128,0]    },
            at:     { type: 'at',           value:ldisc.at,     color: 'cyan'         },
            home:   { type: 'identifier',   value:ldisc.home,   color: [255,128,0]    },
            prompt: { type: 'prompt',       value:ldisc.prompt, color: 'magenta'      },
            line:   { type: 'string',       value:line,         color: 'cyan'         }
            
        }
            return  ansi.erase.inLine(2) + 
                    ansi.cursor.horizontalAbsolute(1) + 
                    ansi.rgb(255,128,0) +
                    ldisc.user + 
                    ansi.style.cyan +
                    ldisc.at + 
                    ansi.rgb(255,128,0) +
                    ldisc.home +
                    ansi.style.magenta +
                    ldisc.prompt + 
                    ansi.style.cyan +
                    line + 
                    ansi.cursor.horizontalAbsolute(cursor) +
                    ansi.style.reset 
        }
        ldisc.ask   = function(text, callback, silent){
            text            = text.toString()
            ldisc.silent    = silent || false
            ldisc.request   = true
            store           = [ ldisc.user, ldisc.at, ldisc.home, ldisc.prompt ]
            ldisc.user      = ''
            ldisc.at        = ''
            ldisc.home      = text
            ldisc.prompt    = ':'
            ldisc.respond = function(response){
                ldisc.silent = false
                ldisc.io.write('\r\n')
                ldisc.user      = store[0]
                ldisc.at        = store[1]
                ldisc.home      = store[2]
                ldisc.prompt    = store[3]
                ldisc.request   = false
                ldisc.respond   = false
                callback?callback(response):ldisc.print(response);
            }
            ldisc.setText({ buffer:'', index:0  })
            ldisc.loop()
        }
        ldisc.kill  = function(){
            ldisc.end()
            ldisc.destroy()
        }
        ldisc.auto  = function(){
            var paths =  ldisc.accessor.getPaths(ldisc.context, ldisc.getText().buffer)
                ldisc.debug?ldisc.print(paths):null
                ldisc.setText( { buffer:paths.path, index:paths.path.length })
                if(paths.siblings.length > 0){
                    ldisc.print( paths.siblings )
                }
        }

        
        
        ldisc.on('keypress',    ldisc.READ )
        ldisc.on('mousepress',  function(info){
            ldisc.debug?ldisc.print({mousepress:info}):null
        })
        ldisc.on('cursor',      function(info){
            ldisc.debug?ldisc.print({cursor:info}):null
        })
        ldisc.on('resize',      function(info){
             ldisc.debug?ldisc.print({ size:info }):null
        })
        ldisc.on('ctrl',        function(key){
            ldisc.debug?ldisc.print(key):null
            //node readline defaults
            switch (key.name) {
                    case 'c':
                        ldisc.kill()
                        break;
                    case 'h': // delete left
                        break;
                    case 'd': // delete right or EOF
                        break;
                    case 'u': // delete the whole line
                        break;
                    case 'k': // delete from cursor to end of line
                        break;
                    case 'a': // go to the start of the line
                        break;
                    case 'e': // go to the end of the line
                        break;
                    case 'b': // back one character
                        break;
                    case 'f': // forward one character
                        break;
                    case 'l': // clear the whole screen
                        break;
                    case 'm': // return
                        break;
                    case 'n': // next history item
                        break;
                    case 'p': // previous history item
                        break;
                    case 'z':
                        break;
                    case 'w': // delete backwards to a word boundary
                    case 'backspace':
                        break;
                    case 'delete': // delete forward to a word boundary
                        break;
                    case 'left':// move word left
                        break;
                    case 'right'://move word right
                        break;
                    }
        })
        ldisc.on('ctrl-shift',  function(key){
            ldisc.debug?ldisc.print(key):null
            //node readline defaults
            switch (key.name) {
              case 'backspace'://_deleteLineLeft();
                break;
              case 'delete'://_deleteLineRight();
                break;
            }
        })
        ldisc.on('meta',        function(key){
            ldisc.debug?ldisc.print(key):null;
            //node readline defaults
            switch (key.name) {
                case 'b': // move left one word
                    break;
                case 'f': // move right one word
                    break;
                case 'd': // delete word right
                case 'delete':
                    break;
                case 'backspace': // delete word left
                    break;
            }
        })
        ldisc.on('navigate',    function(key){
            ldisc.debug?ldisc.print(key):null
            //node readline defaults
            switch( key.name ){
                case 'up'://default previous history
                    break;
                case 'down'://default next history
                    break;
                case 'left'://default cursor left
                    break;
                case 'right'://default cursor right
                    break;
                case 'pageup':    
                    break;
                case 'pagedown':
                    break;
                case 'home':
                    break;
                case 'end': 
                    break;
                case 'tab':
                    if(ldisc.request===false){
                       ldisc.auto()
                    }
                    break;
            }
                    
        })
        ldisc.on('edit',        function(key){
            ldisc.debug?ldisc.print(key):null
            switch(key.name){
                case 'delete'://delete character rigth
                    break;
                case 'backspace'://delete character left
                    break;
                case 'insert'://insert mode
                    break;
            }
        })
        ldisc.on('csi',         function(key){
            ldisc.debug?ldisc.print(key):null
        })
        ldisc.on('crlf',        function(text){
            if( ldisc.request===true ){ 
                ldisc.respond( text.buffer )
            }else{
                if(!text.buffer){
                    ldisc.io.write('\n\r')//os.EOL
                    return
                }
                ldisc.evil( text.buffer )
            }
        })
        ldisc.on('close',       ldisc.kill )
    
        return ldisc
}

module.exports  = repl




