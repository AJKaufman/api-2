// Credit to 590-Project1 by Aidan Kaufman and simple-server-collision by Cody Van De Mark
const xxh = require('xxhashjs');
const Player = require('./classes/Player.js');
const physics = require('./physics.js');

const players = {};
// num to hold all of our connected users
const roomList = {};
let nextRoom = 0;
let currentRoomCount = 1;

let io;


const setupSockets = (ioServer) => {
  io = ioServer;

  io.on('connection', (sock) => {
    const socket = sock;

    socket.on('requestAccess', () => {
      // new user in this room
      currentRoomCount++;

      // send the user to their room
      socket.join(`room${nextRoom}`);

      // if the room isn't in the roomList
      if (!roomList[`room${nextRoom}`]) {
        console.log(`adding room${nextRoom} to roomList`);
        roomList[`room${nextRoom}`] = {};
      }

      // generate the user's unique hash code
      const idString = `${socket.id}${new Date().getTime()}`;
      const hash = xxh.h32(idString, 0xCAFEBABE).toString(16);

      socket.hash = hash;
      players[hash] = new Player(hash);

      console.log(`room${nextRoom}`);

      io.sockets.in(`room${nextRoom}`).emit('joined', {
        player: players[hash],
        side: currentRoomCount,
        room: `room${nextRoom}`,
      });

      // create the playerData and send back left or right side
      if (currentRoomCount >= 2) {
        currentRoomCount = 0;

        console.log('left');
      } else {
        nextRoom++;

        console.log('right');
      }
    });

    socket.on('hostRoom', (data) => {
      // send the user to their room
      socket.join(data.roomName);

      // if the room isn't in the roomList
      if (!roomList[data.roomName]) {
        console.log(`adding ${data.roomName} to roomList`);
        roomList[data.roomName] = {};
      }

      // generate the user's unique hash code
      const idString = `${socket.id}${new Date().getTime()}`;
      const hash = xxh.h32(idString, 0xCAFEBABE).toString(16);

      socket.hash = hash;
      players[hash] = new Player(hash);

      console.log(data.roomName);

      io.sockets.in(data.roomName).emit('joined', {
        player: players[hash],
        side: 2,
        room: data.roomName,
      });
    });


    socket.on('joinRoom', (data) => {
      // send the user to their room
      socket.join(data.roomName);

      // if the room isn't in the roomList
      if (!roomList[data.roomName]) {
        console.log('room doesn\'t exist');
        return;
      }

      // generate the user's unique hash code
      const idString = `${socket.id}${new Date().getTime()}`;
      const hash = xxh.h32(idString, 0xCAFEBABE).toString(16);

      socket.hash = hash;
      players[hash] = new Player(hash);

      console.log(data.roomName);

      io.sockets.in(data.roomName).emit('joined', {
        player: players[hash],
        side: 1,
        room: data.roomName,
      });
    });


    socket.on('waitMessage', (data) => {
      io.sockets.in(data.room).emit('removeWaitMessage', { data });
    });

    // allows player 2 to save the hash of player 1
    socket.on('sendP1Hash', (data) => {
      io.sockets.in(data.room).emit('saveP1Hash', { hash2: data.hash2, player: players[data.hash2] });
    });

    socket.on('movementUpdate', (data) => {
      players[socket.hash] = data.square;
      players[socket.hash].lastUpdate = new Date().getTime();

      physics.setPlayer(players[socket.hash]);

      let serverData = {};

      if (data.ball) {
        serverData = {
          square: players[socket.hash],
          lastUpdate: players[socket.hash].lastUpdate,
          ball: data.ball,
        };
      } else {
        serverData = {
          square: players[socket.hash],
          lastUpdate: players[socket.hash].lastUpdate,
        };
      }

      io.sockets.in(data.room).emit('updatedMovement', serverData);
    });

    socket.on('goal', (data) => {
      io.sockets.in(data.room).emit('addPoint', { hash: data.hash });
    });

    socket.on('sendVictor', (data) => {
      console.log(data.side);
      io.sockets.in(data.room).emit('endGame', { side: data.side });
    });
  });
};

console.log('Websocket server started');


module.exports.setupSockets = setupSockets;
