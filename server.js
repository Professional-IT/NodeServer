// Server side script adapted from the video tutorial series for unity multiplayer networking with socket io riginally by Adam Carnagey
// Link to original video tutorial series: https://www.youtube.com/watch?v=tn3cWcSYmHE&list=PLH83kaN0EWK5wkiNhGlhfSI_nGDcR1DX8&index=1
// Link to original github repo: https://github.com/acarnagey/Unity-Multiplayer-Networking-NodeJS
// Link to this adaptation: https://github.com/arigbs/Simple-Unity-Multiplayer-with-NodeJS-for-WebGL-Builds.git

// Adapted by Ayodele Arigbabu in January 2019 and provided under an ISC license (https://en.wikipedia.org/wiki/ISC_license), 
// to work with the asset 'SocketIO for Native and Webgl builds' by Daspete
// assetstore link here: https://assetstore.unity.com/packages/tools/network/socketio-for-native-and-webgl-builds-76508

var express = require('express'),
app = express(),
server = require('http').createServer(app),
port = process.env.PORT || 3000,
io = require('socket.io')(server);

// var port = process.env.PORT || 3000,
 //   io = require('socket.io')(port),
    gameSocket = null;

    // global variables for the server
var enemies = [];
var playerSpawnPoints = [];
var clients = []; // Store Client list
var sockets = [];

// Allow express to serve static files in folder structure set by Unity Build
//app.use("/TemplateData",express.static(__dirname + "/TemplateData"));
//app.use("/Release",express.static(__dirname + "/Release"));
app.use("/TemplateData",express.static(__dirname + "/TemplateData"));
app.use("/Build",express.static(__dirname + "/Build"));
//app.use(express.static('public'));
app.use(express.static(__dirname));

// Start server
// server.listen(port);
server.listen(3000, function(){
	console.log('listening on *:3000  \n --- server is running ...');
});


// Redirect response to serve index.html
app.get('/',function(req, res)
        {
            res.sendFile(__dirname + '/index.html');
        });   
        
// Implement socket functionality
gameSocket = io.on('connection', function(socket){
    
    var currentPlayer = {};
	currentPlayer.name = 'unknown';
    
    console.log('socket connected: ' + socket.id);

    socket.on('disconnect', function(){
        console.log('socket disconnected: ' + socket.id);
    });
    


	/////////////////////////////////



	sockets.push(socket)

	socket.on('click', function(data) {
		console.log('clicked == ' + data.index );
		sockets.map( (s) => {
			if(socket !== s)
			{
				s.emit('other player turned', data);
				console.log(' === connected === ');
			}
		});
		//socket.broadcast.emit('other player turned', data);
	})

    ////////////////////////////////////////////////////




    socket.on('player linked', function() {
		
		console.log(' recv: player linked');
        
     });
     
     socket.on('player connect', function() {
		console.log(currentPlayer.name+' recv: player connect');
		for(var i =0; i<clients.length;i++) {
			var playerConnected = {
				name:clients[i].name,
				position:clients[i].position,
				rotation:clients[i].position,
				health:clients[i].health
			};
		//	in your current game, we need to tell you about the other players.
			socket.emit('other player connected', playerConnected);
			console.log(currentPlayer.name+' emit: other player connected: '+JSON.stringify(playerConnected));
		} 
        
     });
     
     socket.on('play', function(data) {
		console.log(currentPlayer.name +' recv: play: '+ JSON.stringify(data));
		// if this is the first person to join the game init the enemies
		if(clients.length === 0) {
			numberOfEnemies = data.enemySpawnPoints.length;
			enemies = [];
			data.enemySpawnPoints.forEach(function(enemySpawnPoint) {
				var enemy = {
					name: guid(),
					position: enemySpawnPoint.position,
					rotation: enemySpawnPoint.rotation,
					health: 100
				};
				enemies.push(enemy);
			});
			playerSpawnPoints = [];
			data.playerSpawnPoints.forEach(function(_playerSpawnPoint) {
				var playerSpawnPoint = {
					position: _playerSpawnPoint.position,
					rotation: _playerSpawnPoint.rotation
				};
				playerSpawnPoints.push(playerSpawnPoint);
			});
		}

		var enemiesResponse = {
			enemies: enemies
		};
		// we always will send the enemies when the player joins
		console.log(currentPlayer.name+' emit: enemies: '+JSON.stringify(enemiesResponse));
		socket.emit('enemies', enemiesResponse);
		var randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)];
		currentPlayer = {
			name:data.name,
			position: randomSpawnPoint.position,
			rotation: randomSpawnPoint.rotation,
			health: 100
		};
		clients.push(currentPlayer);
		// in your current game, tell you that you have joined
		console.log(currentPlayer.name+' emit: play: '+JSON.stringify(currentPlayer));
		socket.emit('play', currentPlayer);
		// in your current game, we need to tell the other players about you.
		socket.broadcast.emit('other player connected', currentPlayer);
	});
    
    socket.on('player move', function(data) {
		console.log('recv: move: '+JSON.stringify(data));
		currentPlayer.position = data.position;
		socket.broadcast.emit('player move', currentPlayer);
	});

	socket.on('player turn', function(data) {
		console.log('recv: turn: '+JSON.stringify(data));
		currentPlayer.rotation = data.rotation;
		socket.broadcast.emit('player turn', currentPlayer);
	});

	socket.on('player shoot', function() {
		console.log(currentPlayer.name+' recv: shoot');
		var data = {
			name: currentPlayer.name
		};
		console.log(currentPlayer.name+' bcst: shoot: '+JSON.stringify(data));
		socket.emit('player shoot', data);
		socket.broadcast.emit('player shoot', data);
	});

	socket.on('health', function(data) {
		console.log(currentPlayer.name+' recv: health: '+JSON.stringify(data));
		// only change the health once, we can do this by checking the originating player
		if(data.from === currentPlayer.name) {
			var indexDamaged = 0;
			if(!data.isEnemy) {
				clients = clients.map(function(client, index) {
					if(client.name === data.name) {
						indexDamaged = index;
						client.health -= data.healthChange;
					}
					return client;
				});
			} else {
				enemies = enemies.map(function(enemy, index) {
					if(enemy.name === data.name) {
						indexDamaged = index;
						enemy.health -= data.healthChange;
					}
					return enemy;
				});
			}

			var response = {
				name: (!data.isEnemy) ? clients[indexDamaged].name : enemies[indexDamaged].name,
				health: (!data.isEnemy) ? clients[indexDamaged].health : enemies[indexDamaged].health
			};
			console.log(currentPlayer.name+' bcst: health: '+JSON.stringify(response));
			socket.emit('health', response);
			socket.broadcast.emit('health', response);
		}
	});

	socket.on('disconnect', function() {
		console.log(currentPlayer.name+' recv: disconnect '+currentPlayer.name);
		socket.broadcast.emit('other player disconnected', currentPlayer);
		console.log(currentPlayer.name+' bcst: other player disconnected '+JSON.stringify(currentPlayer));
		for(var i=0; i<clients.length; i++) {
			if(clients[i].name === currentPlayer.name) {
				clients.splice(i,1);
			}
		}
	});


});

function guid() {
	function s4() {
		return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}