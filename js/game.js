var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var enemy;
var enemySpeed;
var usturoi;
var bullet;
var platforms;
var cursors;
var gameOver = false;
var night = false;
var nightModeText;
var takenDamage = false;
var takenDamageText;
var fpsText;

// enemies
var enemyGroup;
var enemies = []; // arr
var bullets = []; // arr

var game = new Phaser.Game(config);

function preload ()
{
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('baba', 'assets/baba.png', { frameWidth: 28, frameHeight: 39 });
    this.load.image("usturoi", "assets/usturoi.png");

    this.load.image("tiles", "assets/map/tile_castle.png");
    this.load.image("tiles_grey", "assets/map/tile_castle_grey.png");
    this.load.tilemapTiledJSON("map", "assets/map/map800.json");
    this.load.image("background-1", "assets/background/background-1.png");
    this.load.image("background-2", "assets/background/background-2.png");
    this.load.image("background-3", "assets/background/background-3.png");

    this.load.spritesheet('tile_castle_sprite', 'assets/map/tile_castle.png', { frameWidth: 32, frameHeight: 32 });
}

function create ()
{ 
    const map = this.make.tilemap({key:"map"})
    // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    // Phaser's cache (i.e. the name you used in preload)
    this.tileset = map.addTilesetImage('tile_castle', "tiles");
    this.tileset_grey = map.addTilesetImage('tile_castle_grey', "tiles_grey");
    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const groundLayer = map.createDynamicLayer("Ground", this.tileset_grey, 0, 0);
    const groundNightLayer = map.createDynamicLayer("GroundNight", this.tileset, 0, 0);
    const backgroundLayer = map.createDynamicLayer("Background", this.tileset_grey, 0, 0);
    const background2Layer = map.createDynamicLayer("Background2", this.tileset_grey, 0, 0);
    var coins = map.createFromObjects('Objects', 'shadow', { key: 'tile_castle_sprite', frame: 5 });
    var coinsGroup = this.physics.add.group();

    coins.forEach(sprite => {
        coinsGroup.add(sprite)
    })
    coinsGroup.children.entries.forEach(sprite => {
        sprite.body.setAllowGravity(false);
        sprite.setAlpha(0);
        // sprite.alpha
    })

    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // Parallax background

    this.background1 = this.add.tileSprite(400, 300, map.widthInPixels*2, 600, 'background-1').setDepth(-5);

    this.background2 = this.add.tileSprite(400, 300, map.widthInPixels*2, 600, 'background-2').setDepth(-5);
      
    this.background3 = this.add.tileSprite(400, 300, map.widthInPixels*2, 600, 'background-3').setDepth(-5);
    
    // The player and its settings
    player = this.physics.add.sprite(500, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    // baba animation
    this.anims.create({
        key: 'baba-left',
        frames: this.anims.generateFrameNumbers('baba', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'baba-right',
        frames: this.anims.generateFrameNumbers('baba', { start: 4, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    // player anims
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  The score
    nightModeText = this.add.text(16, 16, night ? 'night mode' : 'not night');
    nightModeText.setScrollFactor(0);

    // enemy interactions
    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, groundLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player);

    this.buttons = {}
    this.buttons.nightMode = this.input.keyboard.addKey('n');  // Get key object

    this.physics.add.overlap(player, coinsGroup, oFunctie);

    // night damage
    takenDamageText = this.add.text(16, 32, takenDamage ? 'la soare!!!' : 'la umbra');
    takenDamageText.setScrollFactor(0);

    // enemies
    var anim1 = map.createFromObjects('Enemies', 'anim1', { key: 'tile_castle_sprite', frame: 5 });
    
    anim1.forEach(anim1 => {
        const newEnemy = this.physics.add.sprite(anim1.x, anim1.y, 'baba');
        this.physics.add.collider(newEnemy, groundLayer);
        enemies.push(newEnemy);
        
        anim1.destroy();

        this.physics.add.collider(player, newEnemy, hitPlayer, null, this);

        shoot(newEnemy, this.physics);
    })

    fpsText = this.add.text(16, 48, 'fps');
    fpsText.setScrollFactor(0);
}

function oFunctie(sprite, health){
    // console.log(123);
    takenDamage = false;
}

function hitPlayer (player, enemy)
{
    enemy.destroy();
}

function shoot(enemy, physics){
    const usturoi = physics.add.sprite(enemy.x, enemy.y, "usturoi");
    usturoi.body.setAllowGravity(false);

    if(enemy.x > player.x) {
        usturoi.body.velocity.x = -500;
    } else {
        usturoi.body.velocity.x = 500;
    }

    setTimeout(() => {
        if(!enemy.active)
            return;

        bullets.push(usturoi);
        shoot(enemy, physics);
    }, Phaser.Math.FloatBetween(1, 10) * 1000)
}

function animateEnemies(){
    enemies.forEach((enemy, index) => {
        if(!enemy.active)
            return;
        
        if(enemy.x > player.x) {
            enemySpeed = -60;
            enemy.anims.play('baba-left', true);
        } else {
            enemySpeed = 60;
            enemy.anims.play('baba-right', true);
        }
        enemy.setVelocityX(enemySpeed);
    })
}

function cleanUpEnemies(){
    enemies.forEach((enemy, index) => {
        if(!enemy.active)
            enemies.splice(index, 1);
    })
}

function update ()
{
    cleanUpEnemies();
    
    takenDamageText.setText(takenDamage ? 'la soare!!!' : 'la umbra')
    takenDamage = true;

    fpsText.setText('fps: ' + game.loop.actualFps);

    animateEnemies();

    this.speed = {
        background1: 1.6,
        background2: 1.3,
        background3: 0.9,
    }

    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);

        this.background1.tilePositionX -= this.speed.background1;
        this.background2.tilePositionX -= this.speed.background2;
        this.background3.tilePositionX -= this.speed.background3;
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
        
        this.background1.tilePositionX += this.speed.background1;
        this.background2.tilePositionX += this.speed.background2;
        this.background3.tilePositionX += this.speed.background3;

    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.onFloor())
    {
        player.setVelocityY(-370);
    }

    if(Phaser.Input.Keyboard.JustDown(this.buttons.nightMode)){
        if(night){
            var texture = this.sys.textures.get('tiles_grey');
            this.tileset_grey.setImage(texture);
        }else{
            var texture = this.sys.textures.get('tiles');
            this.tileset_grey.setImage(texture);
        }

        night = !night;
    }
}
