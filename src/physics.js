// Credit to simple-server-collision by Cody Van De Mark

let playerList = {};

const setPlayerList = (serverPlayerList) => {
  playerList = serverPlayerList;
};

const setPlayer = (player) => {
  playerList[player.hash] = player;
};


module.exports.setPlayerList = setPlayerList;
module.exports.setPlayer = setPlayer;

