// code used from simple server collision by Cody Van De Mark
const update = (data) => {
  
  
  // if the square doesn't already exist, make it so!
  if(!squares[data.square.hash]) {
    console.log('new square created: ' + data.square.hash);
    squares[data.square.hash] = data.square;
    return;
  }
  
  // if it's the same hash as the client, skip this because you already moved locally
  if(data.square.hash === hash) {
    return;
  }

  // if lastUpdate didn't work correctly skip
  if(squares[data.square.hash].lastUpdate >= data.lastUpdate) {
    console.log('lastUpdate did not work correctly');
    return;
  }
  
  const square = squares[data.square.hash];
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
  
  if(side === 1){
    ball.prevX = data.ball.prevX;
    ball.destX = data.ball.destX;
    ball.prevY = data.ball.prevY;
    ball.destY = data.ball.destY;
    ball.alpha = 0.5;
  }
  
};



const setUser = (data) => {
    
  if(!hash){
    
    console.log('setting user, first instance of hash');
    
    myScore = 0;
    oScore = 0;
    hash = data.player.hash;
    myRoom = data.room;
    squares[hash] = data.player;
    side = data.side;
    
    console.log(side);
    
    if(data.side === 1) {
      squares[hash].prevX = 940;
      squares[hash].x = 940;
      squares[hash].destX = 940;
      socket.emit('waitMessage', (data));
    } else {
      gameOver = false;
      squares[hash].prevX = 30;
      squares[hash].x = 30;
      squares[hash].destX = 30;
      const score = document.querySelector('#score');
      score.innerHTML = "<p>Waiting for your opponent...</p>";
      const signIn = document.querySelector('#signIn');
      signIn.innerHTML = "";
      const jButt = document.querySelector('#joinButton');
      jButt.innerHTML = "";  
      const hrb = document.querySelector('#hostRoomButton');
      hrb.innerHTML = "";
      const jrb = document.querySelector('#joinRoomButton');
      jrb.innerHTML = "";
      
      ballMove = false;
    }
    
    // make the ball
    ball = {};
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.prevX = canvas.width/2;
    ball.prevY = canvas.height/2;
    ball.destX = canvas.width/2;
    ball.destY = canvas.height/2;
    ball.alpha = 0.5;
    ballChangeCD = false;

    
    requestAnimationFrame(redraw);
  } else {
    
    hash2 = data.player.hash;
    squares[hash2] = data.player;
  }
  
  
};

const endGame = (data) => {
  console.log('endgame accomplished!');
  gameOver = true;
  console.log(data.side);
  
  // update innerHTML
  let displayScore = document.querySelector('#score');
  if(data.side === side) {
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

const updatePosition = () => {
  const square = squares[hash];

  
  square.prevY = square.y;

  if(square.moveUp && square.destY > 0) {
    square.destY -= 10;
  }
  if(square.moveDown && square.destY < 480) {
    square.destY += 10;
  }

  square.alpha = 0.05;

  const squareData = {};
  
  if(side === 2 && ballX && ballY) {
    
    ball.prevX = ball.x;
    ball.prevY = ball.y;
    
    if(ballMove) {
      ball.destX += ballX;
      ball.destY += ballY;
    }
    
    // hitting left paddle
    if(ball.destX <= squares[hash].x + 45 && ball.destX <= squares[hash2].x + 75 && ball.destY <= squares[hash].y + 120 && ball.destY >= squares[hash].y && ballChangeCD === false && gameOver === false) {
      ballX *= -1;
      ballChangeCD = true;
      console.log('hit left paddle');
    } else {
      ball.x = ball.destX;
      ball.y = ball.destY;
    }
    
    // hitting right paddle
    if(ball.destX >= squares[hash2].x && ball.destX <= squares[hash2].x + 30 && ball.destY <= squares[hash2].y + 120 && ball.destY >= squares[hash2].y && ballChangeCD === false && gameOver === false) {
      ballX *= -1;
      ballChangeCD = true;
      console.log('hit right paddle');
    } else {
      ball.x = ball.destX;
      ball.y = ball.destY;
    }
    
    // ball cannot change direction again until it passes the middle
    if(ball.x < canvas.width/2 + 20 && ball.x > canvas.width/2 - 20) {
      console.log('ball can now change direction again');
      ballChangeCD = false;
    }
    
    // hitting top or bottom of the canvas
    if(ball.destY > 585 || ball.destY < 15) {
      console.log('hit top/bot');
      ballY *= -1;
    }
    
    // hitting left or right of the canvas
    if(ball.destX > 1000) {
      socket.emit('goal', { hash: hash, room: myRoom });
      ball.x = canvas.width/2;
      ball.y = canvas.height/2;
      ball.prevX = canvas.width/2;
      ball.prevY = canvas.height/2;
      ball.destX = canvas.width/2;
      ball.destY = canvas.height/2;
      ballX = 4;
      ballY = (Math.random() * 2) + 3;
    } else if(ball.destX < 0) {
      socket.emit('goal', { hash: hash2, room: myRoom });
      ball.x = canvas.width/2;
      ball.y = canvas.height/2;
      ball.prevX = canvas.width/2;
      ball.prevY = canvas.height/2;
      ball.destX = canvas.width/2;
      ball.destY = canvas.height/2;
      ballX = 4;
      ballY = (Math.random() * 2) + 3;
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



















