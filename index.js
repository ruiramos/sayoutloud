'use strict';

const say = require('say');
const Hapi = require('hapi')
const spawn = require('child_process').spawn;

const SoundProvider = require('./sound');

const _play = function(url, cb){
  var process = spawn('omxplayer', ['--vol', '-2000', url]);
  process.on('exit', cb);
  return process;
}

const server = new Hapi.Server();
server.connection({
	host: '0.0.0.0',
	port: 4321
});

server.route({
	method: 'GET',
	path: '/say',
  handler: function(request, reply){	
	  var text = decodeURIComponent(request.query.text);
	  if(text && text.length) say.speak(text);
	  reply(JSON.stringify({said: text}));
  }
})

server.route({
  method: 'GET',
  path: '/sound',
  handler: function(req, reply){
    if(req.query.text){
      SoundProvider(req.query.text)
        .then(function(res){
          if(res){
            var ps = _play(res.previews['preview-hq-mp3'], function(){
                reply(JSON.stringify({played: res}));
            });
            req.raw.req.once('close', function(){ 
              console.log('req aborted')
              // request aborted
              ps.stdin.write('q'); 
            });

          }
        })
        .catch(function(err){
          console.log('error:', err);  
        })
    } 
  }
});

function playSound(text, cb){
  SoundProvider(text, {throw: false}).then(function(res){
    if(res){
      var ps = _play(res.previews['preview-hq-mp3'], cb);
    }
  })
  .catch(function(err){
    console.log('error:', err);  
  })
}

server.route({
  method: 'POST',
  path: '/slack',
  handler: function(req, res){
    var msg = req.payload.text;
    if(msg){
      var tags = msg.match(/#(\w+)/);
      if(tags){
        var tag = tags[1]; // the regexp match
        playSound(tag, (res) => { console.log('played', res)})       
      }
      say.speak(msg.replace(/#(\w+)/g, ''));
      res({done: 1});
    }
  }
})

// Start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

