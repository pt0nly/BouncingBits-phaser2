/**
 * Game Config
 */
let config = {
	renderer: Phaser.AUTO,
	width: 800,
	height: 600,
	parent: 'gameTable', // ID of element to contain the Canvas
	state: null,
	transparent: false,
	antialias: true,
	physicsConfig: null
};

let game = new Phaser.Game(config);

game.state.add('Game', PhaserGame, true);
