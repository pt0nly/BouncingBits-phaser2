/**
 * Main Game file
 */
let PhaserGame = {
	background: null,
	player: null,
	chips: null,
	platforms: null,
	cursors: null,
	score: 0,
	scoreText: null,
	bombs: null,
	gameOver: false,
	sfx: null,
	music: null,
	explosion: null,
	explodeAnim: null,

	init: function() {
		// Init vars
		this.background = null;
		this.sfx = null;
		this.music = null;

		this.player = null;
		this.chips = null;
		this.platforms = null;
		this.cursors = null;
		this.score = 0;
		this.scoreText = null;
		this.bombs = null;
		this.gameOver = false;

		this.explosion = null;
		this.explodeAnim = null;
	},

	preload: function() {
		// Textures
		game.load.image('sky', 'assets/images/motherboard2.png');
		game.load.image('ground', 'assets/images/ground.png');
		game.load.image('platform1', 'assets/images/platform_22.png');
		game.load.image('platform2', 'assets/images/platform_23.png');
		game.load.image('platform3', 'assets/images/platform_24_inv.png');
		game.load.image('platform4', 'assets/images/platform_25.png');
		game.load.image('chip', 'assets/images/chip.png');
		game.load.image('bomb', 'assets/images/bomb.png');
		game.load.image('sound-icon', 'assets/images/sound-icon.png');
		game.load.image('pause-button', 'assets/images/pause-button.png');

		// Sprites
		game.load.spritesheet('dude', 'assets/images/duderobot5.png', 32, 33);

		// Atlas
		game.load.atlas('explosion', 'assets/atlas/explosion.png', 'assets/atlas/explosion.json');

		// Audio
		game.load.audiosprite('sfx', ['assets/audio/bbits_sfx.mp3', 'assets/audio/bbits_sfx.ogg'], null, sfxJSON);
		game.load.audio('wizball', ['assets/audio/oedipus_wizball_highscore.mp3', 'assets/audio/oedipus_wizball_highscore.ogg']);
	},

	create: function() {
		game.add.sprite(0, 0, 'chip');

		// We're going to be using physics, so enable the Arcade Physics system
		game.physics.startSystem(Phaser.Physics.ARCADE);

		game.physics.arcade.gravity.y = 300;

		// Setup SFX
		this.setupSFX();

		// Setup Music
		this.setupMusic();

		// Background
		game.add.sprite(0, 0, 'sky');

		// BEGIN: Platforms
			// The platforms group contains the ground and the 2 ledges we can jump on
			this.platforms = game.add.group();

			// We will enable physics for any object that is created in this group
			this.platforms.enableBody = true;

			// Here we create the ground
			let ground = this.platforms.create(0, game.world.height - 64, 'ground');

			// This stops it from falling away when you jump on it
			ground.body.immovable = true;
			ground.body.allowGravity = false;

			// Now let's create two ledges
			let ledge = this.platforms.create(400, 400, 'platform2');
			ledge.body.immovable = true;
			ledge.body.allowGravity = false;

			ledge = this.platforms.create(-150, 250, 'platform3');
			ledge.body.immovable = true;
			ledge.body.allowGravity = false;

			ledge = this.platforms.create(550, 220, 'platform4');
			ledge.body.immovable = true;
			ledge.body.allowGravity = false;
		// END: Platforms

		// BEGIN: Player
			this.player = game.add.sprite(32, game.world.height - 150, 'dude');

			// We need to enable physics on the player
			game.physics.arcade.enable(this.player);

			// Player physics properties. Give the little guy a slight bounce.
			this.player.body.bounce.y = 0.2;
			//this.player.body.gravity.y = 300;
			this.player.body.collideWorldBounds = true;

			// Our two animations, walking left and right
			this.player.animations.add('left', [0,1,2,3], 10, true);
			this.player.animations.add('right', [5,6,7,8], 10, true);

			this.player.frame = 4;

			// Player controls
			this.cursors = game.input.keyboard.createCursorKeys();

			this.explosion = game.add.sprite(game.world.centerX, 300, 'explosion');
			this.explosion.visible = false;

			this.explodeAnim = this.explosion.animations.add('explode', Phaser.Animation.generateFrameNames('explosion', 1, 32), 52, false);
			this.explodeAnim.onComplete.add(this.onCompleteExplosion, this);
		// END: Player

		// BEGIN: Chips
			this.chips = game.add.group();

			this.chips.enableBody = true;

			// Chip's active count
			this.chips.countActive = 0;

			// Here we'll create 12 of them evenly spaced apart
			for (let i=0; i<12; i++) {
				// Create a Chip inside of the 'chips' group
				let chip = this.chips.create(4 + i*70, 0, 'chip');

				// Let gravity do it's thing
				//chip.body.gravity.y = 6;
				chip.body.gravity.y = 100;

				// This just gives each Chip a slightly random bounce value
				chip.body.bounce.y = GameMath.FloatBetween(0.4, 0.8);//0.7 + Math.random() * 0.2;

				// Set individual points
				chip.points = GameMath.Between(1, 10);

				this.chips.countActive++;
			}

			// Setup scoreText
			this.scoreText = game.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#fff'});
		// END: Chips

		// BEGIN: Bombs
			this.bombs = game.add.group();

			this.bombs.enableBody = true;
		// END: Bombs

		game.input.onDown.add(this.goFull, this);

		/////////////////////////////
		//CREATE SOUND TOGGLE BUTTON
		/////////////////////////////
		//this.player = game.add.sprite(32, game.world.height - 150, 'dude');

		this.soundButton = game.add.button(game.world.centerX + 240, game.world.centerY - 290, 'sound-icon', this.toggleMute, this, 'sound-icon');
		this.soundButton.fixedToCamera = true;
		if (!this.game.sound.mute) {
			this.soundButton.tint = 16777215;
		} else {
			this.soundButton.tint = 16711680;
		}

		//////////////////////
		//CREATE PAUSE BUTTON
		//////////////////////
		this.pauseButton = game.add.sprite(game.world.centerX + 320, game.world.centerY - 280, 'pause-button');
		this.pauseButton.inputEnabled = true;
		this.pauseButton.fixedToCamera = true;
		this.pauseButton.events.onInputUp.add(function() {
			game.paused = true;
			this.pauseButton.tint = 16711680;
		}, this);
		this.game.input.onDown.add(function() {
			if (game.paused) game.paused = false;
			this.pauseButton.tint = 16777215;
		}, this);
	},

	update: function() {
		// Check if the game is over
		if (this.gameOver) {
			document.getElementById('gameOver').style.display = 'table';
			return;
		}

		// Player Movement
		this.playerMovement();

		// Collide the Chips with the Platforms
		this.chipUpdate();

		// Bombs
		this.bombUpdate();
	},

	/*
	render: function() {},

	shutdown: function() {},

	destroy: function() {},
	*/

	/**
	 * Screen functions
	*/
	goFull: function() {
		/*
			Stretch to fill: EXACT_FIT
			Keep original size: NO_SCALE
			Maintain aspect ratio: SHOW_ALL
		*/

		// Maintain aspect ratio
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		game.scale.pageAlignHorisontally = true;
		game.scale.pageAlignVertically = true;

		// if game is full screen
		if (game.scale.isFullScreen) {

			// turn it off
			game.scale.stopFullScreen();

		} else {

			// else turn it on
			game.scale.startFullScreen(false);
		}
	},

	/**
	 * Audio Functions
	*/
	setupSFX: function() {
		// Here we setup our audio sprite
		this.sfx = game.add.audioSprite('sfx');
		this.sfx.allowMultiple = false;
	},

	setupMusic: function() {
		this.music = game.add.audio('wizball');
		this.music.play();
	},

	toggleMute: function() {
		if (!this.game.sound.mute) {
			this.game.sound.mute = true;
			this.soundButton.tint = 16711680;
		} else {
			this.game.sound.mute = false;
			this.soundButton.tint = 16777215;
		}
	},

	/**
	 * Custom functions
	*/
	onCompleteExplosion: function() {
		this.explosion.animations.stop();
		this.explosion.visible = false;
	},

	playerMovement: function() {
		// Collide the Player and the Chips with the Platforms
		let hitPlatform = game.physics.arcade.collide(this.player, this.platforms);

		// Reset the players velocity (movement)
		//this.player.body.velocity.x = 0;

		if (this.cursors.left.isDown) {
			// Move to the left
			this.player.body.velocity.x = -150;

			this.player.animations.play('left');
		} else if (this.cursors.right.isDown) {
			// Move to the right
			this.player.body.velocity.x = 150;

			this.player.animations.play('right');
		} else {
			// Stand still
			this.player.body.velocity.x = 0;

			this.player.animations.stop();

			this.player.frame = 4;
		}

		// Allow the Player to Jump if they are touching the Ground.
		if (this.cursors.up.isDown && this.player.body.touching.down && hitPlatform) {
			this.sfx.play('bounce1');
			this.player.body.velocity.y = -330;
		}
	},

	bombUpdate: function() {
		game.physics.arcade.collide(this.bombs, this.platforms, null, null, this);
		game.physics.arcade.collide(this.player, this.bombs, this.hitBomb, null, this);

		game.physics.arcade.overlap(this.bombs, this.chips, this.transformChip, null, this);
	},

	chipUpdate: function() {
		let hitPlatform = game.physics.arcade.collide(this.chips, this.platforms);

		game.physics.arcade.overlap(this.player, this.chips, this.collectChip, null, this);
	},

	transformChip: function(player, chip) {
		chip.collideWorldBounds = true;
		if (chip.points > 0)
			chip.points--;
		else {
			this.sfx.play('boom1');
			this.killChip(player, chip);
		}

		if (chip.points < 3) {
			this.sfx.play('zap3');
			chip.tint = 0xff0000;
		} else if (chip.points < 8) {
			this.sfx.play('zap4');
			chip.tint = 0xffff00;
		}
	},

	killChip: function(player, chip) {
		// Removes the chip from the screen
		chip.kill();

		if (--this.chips.countActive == 0) {
			this.chips.children.forEach(chipBlock => {
				chipBlock.body.x = 4 + this.chips.countActive*70;
				chipBlock.body.y = 0;

				// This just gives each Chip a slightly random bounce value
				chipBlock.body.bounce.y = GameMath.FloatBetween(0.4, 0.8);

				// Set individual points
				chipBlock.points = GameMath.Between(10, 15);

				chipBlock.tint = 16777215;

				this.chips.countActive++;

				chipBlock.revive();
			});

			let x = (player.x < 400) ? GameMath.Between(400, 800) : GameMath.Between(0, 400),
				bomb = this.bombs.create(x, 16, 'bomb');

			bomb.body.bounce.y = bomb.body.bounce.x = 1;
			bomb.body.collideWorldBounds = true;
			bomb.body.velocity.x = GameMath.Between(-200, 200) & 0xff;
			bomb.body.velocity.y = 200;
			bomb.body.allowGravity = false;
		}
	},

	collectChip: function(player, chip) {
		// Add and update the score
		this.score += chip.points;
		this.scoreText.text = 'Score: ' + this.score;

		if (chip.points < 3)
			this.sfx.play('power_up1');
		else if (chip.points < 8)
			this.sfx.play('power_up2');
		else
			this.sfx.play('power_up3');

		this.killChip(player, chip);
	},

	hitBomb: function() {
		this.player.tint = 0xff0000;

		this.player.animations.stop();
		//this.player.frame = 4;
		this.player.frame = 9;

		this.explosion.position.x = this.player.position.x;
		this.explosion.position.y = this.player.position.y;
		this.explosion.visible = true;

		this.explosion.animations.play('explode');

		this.sfx.play('loss5');

		this.bombs.children.forEach(bomb => {
			bomb.kill();
		});

		$player = this.player;
		window.setTimeout(function() {
			$player.body.velocity.x = 0;
		}, 1500);

		this.gameOver = true;
	}
};
