let game;

function startGame() {
    game = new Game();
    game.start();
}

function restartGame() {
    if (game) {
        game.restart();
    } else {
        startGame();
    }
}

window.addEventListener('load', startGame);