"use strict";

// code used from simple server collision by Cody Van De Mark
var directions = {
  DOWNLEFT: 0,
  DOWN: 1,
  DOWNRIGHT: 2,
  LEFT: 3,
  UPLEFT: 4,
  RIGHT: 5,
  UPRIGHT: 6,
  UP: 7
};

var spriteSizes = {
  WIDTH: 29,
  HEIGHT: 119
};

var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

var redraw = function redraw(time) {
  updatePosition();

  ctx.clearRect(0, 0, 1000, 1000);

  var keys = Object.keys(squares);

  for (var i = 0; i < keys.length; i++) {

    var square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.05
    if (square.alpha < 1) square.alpha += 0.05;

    if (square.hash === hash) {
      ctx.filter = "none";
    } else {
      ctx.filter = "hue-rotate(40deg)";
    }

    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);
    ball.x = lerp(ball.prevX, ball.destX, ball.alpha);
    ball.y = lerp(ball.prevY, ball.destY, ball.alpha);

    // if we are mid animation or moving in any direction
    if (square.frame > 0 || square.moveUp || square.moveDown) {
      square.frameCount++;

      if (square.frameCount % 8 === 0) {
        if (square.frame < 7) {
          square.frame++;
        } else {
          square.frame = 0;
        }
      }
    }

    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#1238CC';

    // draw ball and local paddle
    if (ball) {
      ctx.fillRect(ball.x - 15, ball.y - 15, 30, 30);
      ctx.strokeRect(ball.x - 15, ball.y - 15, 30, 30);
    }
    ctx.fillRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);

    if (squares[hash2]) {
      ctx.fillRect(squares[hash2].x, squares[hash2].y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
      ctx.strokeRect(squares[hash2].x, squares[hash2].y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
    }

    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }

  animationFrame = requestAnimationFrame(redraw);
};
'use strict';

// Credit to 590-Project1 by Aidan Kaufman and simple-server-collision by Cody Van De Mark
var canvas = void 0;
var ctx = void 0;
var walkImage = void 0;
var slashImage = void 0;
//our websocket connection
var socket = void 0;
var hash = void 0;
var hash2 = void 0;
var animationFrame = void 0;
var squares = {};
var attacks = [];
var myScore = void 0;
var oScore = void 0;
var myRoom = void 0;
var side = void 0;
var ball = void 0;
var ballMove = void 0;
var ballChangeCD = void 0;
var ballX = void 0;
var ballY = void 0;
var gameOver = void 0;

// The reload function. 
// Seperated due to the automatic initiation due to ES6 syntax
var reload = function reload() {
  window.location.reload();
};

var keyDownHandler = function keyDownHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = true;
  }
  // S OR DOWN
  else if (keyPressed === 83 || keyPressed === 40) {
      square.moveDown = true;
    }
};

var keyUpHandler = function keyUpHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // W OR UP
  if (keyPressed === 87 || keyPressed === 38) {
    square.moveUp = false;
  }
  // S OR DOWN
  else if (keyPressed === 83 || keyPressed === 40) {
      square.moveDown = false;
    }
};

var removeWaitMessage = function removeWaitMessage() {
  // update innerHTML
  var content = document.querySelector('#mainMessage');
  content.innerHTML = "";
  var displayScore = document.querySelector('#score');
  displayScore.innerHTML = '<div style="float: left; padding-left: 20%; padding-top: 2%;">' + myScore;
  displayScore.innerHTML += '</div> <div style="float: right; padding-right: 20%; padding-top: 2%;">' + oScore + "</div>";
  var signIn = document.querySelector('#signIn');
  signIn.innerHTML = "";
  var jButt = document.querySelector('#joinButton');
  jButt.innerHTML = "";
  var hrb = document.querySelector('#hostRoomButton');
  hrb.innerHTML = "";
  var jrb = document.querySelector('#joinRoomButton');
  jrb.innerHTML = "";

  if (side === 2) {
    ballX = 4;
    ballY = 4.5;
    socket.emit('sendP1Hash', { hash2: hash, room: myRoom });
  }

  // get the ball rolling
  ballMove = true;
};

var saveP1Hash = function saveP1Hash(data) {
  console.log('saving p1 hash');
  if (side === 1) {
    hash2 = data.hash2;
    console.log(hash2);
  }
};

var joinGame = function joinGame() {
  console.log('join GAME clicked');
  socket.emit('requestAccess', {});
};

var joinRoom = function joinRoom() {
  if (document.querySelector('.joinName').value) {
    var roomName = document.querySelector('.joinName').value;
    console.log('join ROOM clicked');
    socket.emit('joinRoom', { roomName: roomName });
  } else {
    return;
  }
};

var hostRoom = function hostRoom() {
  if (document.querySelector('.hostName').value) {
    var roomName = document.querySelector('.hostName').value;
    console.log('host ROOM clicked');
    socket.emit('hostRoom', { roomName: roomName });
  } else {
    return;
  }
};

var scorePoint = function scorePoint(data) {
  if (side === 2) {
    if (data.hash === hash) {
      console.log('left player score');
      myScore++;

      if (myScore > 9) {
        console.log('p1 wins!');
        socket.emit('sendVictor', { room: myRoom, side: 2 });
      }
    } else if (data.hash === hash2) {
      console.log('right player score');
      oScore++;

      if (oScore > 9) {
        console.log('p2 wins!');
        socket.emit('sendVictor', { room: myRoom, side: 1 });
      }
    } else {
      console.log('scorePoint method is not registering who got the point correctly');
    }

    var displayScore = document.querySelector('#score');
    displayScore.innerHTML = '<div style="float: right; padding-right: 20%; padding-top: 2%;">' + oScore;
    displayScore.innerHTML += '</div> <div style="float: left; padding-left: 20%; padding-top: 2%;">' + myScore + "</div>";
  } else {
    if (data.hash === hash) {
      console.log('left player score');
      myScore++;
    } else if (data.hash === hash2) {
      console.log('right player score');
      oScore++;
    } else {
      console.log('scorePoint method is not registering who got the point correctly');
    }

    var _displayScore = document.querySelector('#score');
    _displayScore.innerHTML = '<div style="float: right; padding-right: 20%; padding-top: 2%;">' + myScore;
    _displayScore.innerHTML += '</div> <div style="float: left; padding-left: 20%; padding-top: 2%;">' + oScore + "</div>";
  }
};

var init = function init() {

  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  socket = io.connect();

  socket.on('connect', function () {

    console.log('connected');

    socket.on('joined', setUser);
    socket.on('removeWaitMessage', removeWaitMessage);
    socket.on('saveP1Hash', saveP1Hash);
    socket.on('updatedMovement', update);
    socket.on('addPoint', scorePoint);
    socket.on('endGame', endGame);

    document.querySelector('#joinButton').onclick = joinGame;
    document.querySelector('.hostNameButton').onclick = hostRoom;
    document.querySelector('.joinNameButton').onclick = joinRoom;
    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
  });
};

window.onload = init;
'use strict';

// code used from simple server collision by Cody Van De Mark
var update = function update(data) {

  // if the square doesn't already exist, make it so!
  if (!squares[data.square.hash]) {
    console.log('new square created: ' + data.square.hash);
    squares[data.square.hash] = data.square;
    return;
  }

  // if it's the same hash as the client, skip this because you already moved locally
  if (data.square.hash === hash) {
    return;
  }

  // if lastUpdate didn't work correctly skip
  if (squares[data.square.hash].lastUpdate >= data.lastUpdate) {
    console.log('lastUpdate did not work correctly');
    return;
  }

  var square = squares[data.square.hash];
  square.prevX = data.square.prevX;
  square.destX = data.square.destX;
  square.prevY = data.square.prevY;
  square.destY = data.square.destY;
  square.direction = data.square.direction;
  square.moveLeft = data.square.moveLeft;
  square.moveRight = data.square.moveRight;
  square.moveDown = data.square.moveDown;
  square.moveUp = data.square.moveUp;
  square.alpha = 0.05;

  if (side === 1) {
    ball.prevX = data.ball.prevX;
    ball.destX = data.ball.destX;
    ball.prevY = data.ball.prevY;
    ball.destY = data.ball.destY;
    ball.alpha = 0.5;
  }
};

var setUser = function setUser(data) {

  if (!hash) {

    console.log('setting user, first instance of hash');

    myScore = 0;
    oScore = 0;
    hash = data.player.hash;
    myRoom = data.room;
    squares[hash] = data.player;
    side = data.side;

    console.log(side);

    if (data.side === 1) {
      squares[hash].prevX = 940;
      squares[hash].x = 940;
      squares[hash].destX = 940;
      socket.emit('waitMessage', data);
    } else {
      gameOver = false;
      squares[hash].prevX = 30;
      squares[hash].x = 30;
      squares[hash].destX = 30;
      var score = document.querySelector('#score');
      score.innerHTML = "<p>Waiting for your opponent...</p>";
      var signIn = document.querySelector('#signIn');
      signIn.innerHTML = "";
      var jButt = document.querySelector('#joinButton');
      jButt.innerHTML = "";
      var hrb = document.querySelector('#hostRoomButton');
      hrb.innerHTML = "";
      var jrb = document.querySelector('#joinRoomButton');
      jrb.innerHTML = "";

      ballMove = false;
    }

    // make the ball
    ball = {};
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.prevX = canvas.width / 2;
    ball.prevY = canvas.height / 2;
    ball.destX = canvas.width / 2;
    ball.destY = canvas.height / 2;
    ball.alpha = 0.5;
    ballChangeCD = false;

    requestAnimationFrame(redraw);
  } else {

    hash2 = data.player.hash;
    squares[hash2] = data.player;
  }
};

var endGame = function endGame(data) {
  console.log('endgame accomplished!');
  gameOver = true;
  console.log(data.side);

  // update innerHTML
  var displayScore = document.querySelector('#score');
  if (data.side === side) {
    ball.x = 0;
    ball.y = 0;
    ball.prevX = 0;
    ball.prevY = 0;
    ball.destX = 0;
    ball.destY = 0;
    displayScore.innerHTML = 'You win!';
  } else {
    ball.x = 0;
    ball.y = 0;
    ball.prevX = 0;
    ball.prevY = 0;
    ball.destX = 0;
    ball.destY = 0;
    displayScore.innerHTML = 'You lose...';
  }
};

var updatePosition = function updatePosition() {
  var square = squares[hash];

  square.prevY = square.y;

  if (square.moveUp && square.destY > 0) {
    square.destY -= 10;
  }
  if (square.moveDown && square.destY < 480) {
    square.destY += 10;
  }

  square.alpha = 0.05;

  var squareData = {};

  if (side === 2 && ballX && ballY) {

    ball.prevX = ball.x;
    ball.prevY = ball.y;

    if (ballMove) {
      ball.destX += ballX;
      ball.destY += ballY;
    }

    // hitting left paddle
    if (ball.destX <= squares[hash].x + 45 && ball.destX <= squares[hash2].x + 75 && ball.destY <= squares[hash].y + 120 && ball.destY >= squares[hash].y && ballChangeCD === false && gameOver === false) {
      ballX *= -1;
      ballChangeCD = true;
      console.log('hit left paddle');
    } else {
      ball.x = ball.destX;
      ball.y = ball.destY;
    }

    // hitting right paddle
    if (ball.destX >= squares[hash2].x && ball.destX <= squares[hash2].x + 30 && ball.destY <= squares[hash2].y + 120 && ball.destY >= squares[hash2].y && ballChangeCD === false && gameOver === false) {
      ballX *= -1;
      ballChangeCD = true;
      console.log('hit right paddle');
    } else {
      ball.x = ball.destX;
      ball.y = ball.destY;
    }

    // ball cannot change direction again until it passes the middle
    if (ball.x < canvas.width / 2 + 20 && ball.x > canvas.width / 2 - 20) {
      console.log('ball can now change direction again');
      ballChangeCD = false;
    }

    // hitting top or bottom of the canvas
    if (ball.destY > 585 || ball.destY < 15) {
      console.log('hit top/bot');
      ballY *= -1;
    }

    // hitting left or right of the canvas
    if (ball.destX > 1000) {
      socket.emit('goal', { hash: hash, room: myRoom });
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.prevX = canvas.width / 2;
      ball.prevY = canvas.height / 2;
      ball.destX = canvas.width / 2;
      ball.destY = canvas.height / 2;
      ballX = 4;
      ballY = Math.random() * 2 + 3;
    } else if (ball.destX < 0) {
      socket.emit('goal', { hash: hash2, room: myRoom });
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.prevX = canvas.width / 2;
      ball.prevY = canvas.height / 2;
      ball.destX = canvas.width / 2;
      ball.destY = canvas.height / 2;
      ballX = 4;
      ballY = Math.random() * 2 + 3;
    }

    squareData.square = square;
    squareData.room = myRoom;
    squareData.ball = ball;
  } else {

    squareData.square = square;
    squareData.room = myRoom;
  }

  socket.emit('movementUpdate', squareData);
};
