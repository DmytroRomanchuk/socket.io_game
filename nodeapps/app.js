const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = 7654;

app.use(express.static('../public_html/'));
app.use(express.static('../public_html/libs'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '../public_html/index.html');
});

io.sockets.on('connection', socket => {
	socket.userData = {
		x: 0,
		y: 0,
		z: 0,
		heading: 0
	};

	console.log(`${socket.id} connected`);
	socket.emit('setId', {
		id: socket.id
	});

	socket.on('disconnect', () => {
		socket.broadcast.emit('deletePlayer', {
			id: socket.id
		});
	});

	socket.on('init', data => {
		console.log(`socket.init ${data.model}`);
		socket.userData.model = data.model;
		socket.userData.colour = data.colour;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb;
		socket.userData.action = "Idle";
	});

	socket.on('update', data => {
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb;
		socket.userData.action = data.action;
	});

	socket.on('chat message', data => {
		console.log(`chat message:${data.id} ${data.message}`);
		io.to(data.id).emit('chat message', {
			id: socket.id,
			message: data.message
		});
	})
});

http.listen(7654, () => {
	console.log(`listening on *:${port}`);
});

setInterval(() => {
	const nsp = io.of('/');
	let pack = [];

	for (let id in io.sockets.sockets) {
		const socket = nsp.connected[id];
		//only push sockets that have been initialised
		if (socket.userData.model !== undefined) {
			pack.push({
				id: socket.id,
				model: socket.userData.model,
				colour: socket.userData.colour,
				x: socket.userData.x,
				y: socket.userData.y,
				z: socket.userData.z,
				heading: socket.userData.heading,
				pb: socket.userData.pb,
				action: socket.userData.action
			});
		}
	}
	if (pack.length > 0) io.emit('remoteData', pack);
}, 40);