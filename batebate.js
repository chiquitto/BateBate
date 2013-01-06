var KEYCODE_SPACE = 32;
var KEYCODE_UP = 38;
var KEYCODE_DOWN = 40;
var KEYCODE_LEFT = 37;
var KEYCODE_RIGHT = 39;
var KEYCODE_W = 87;
var KEYCODE_S = 83;
var KEYCODE_A = 65;
var KEYCODE_D = 68;

var bb = {
    stage: null,
    
    init: function() {
	bb.StageHelper.init();
	bb.Physics.init();
	
	bb.player1 = bb.Player.initPlayer1();
	bb.player2 = bb.Player.initPlayer2();
	
	this.stage.update();
	createjs.Ticker.setPaused(true);
	
	this.startGame();
    },
    
    startGame: function() {
	bb.player1.startGame();
	//bb.player2.startGame();
	
	document.onkeydown = bb.Player.handleKeyDown;
	document.onkeyup = bb.Player.handleKeyUp;
	
	createjs.Ticker.setPaused(false);
    }
}

bb.Player = {
    color: null,
    playerNo: 0,
    skin: null,
    
    moveX: 0,
    moveY: 0,

    handleKeyDown: function(e) {
	//cross browser issues exist
	if(!e){
	    var e = window.event;
	}
	switch(e.keyCode) {
	    case KEYCODE_SPACE:
		break;
		
	    case KEYCODE_A:
		bb.player1.moveX = -1;
		return false;
	    case KEYCODE_D:
		bb.player1.moveX = 1;
		return false;
	    case KEYCODE_W:
		bb.player1.moveY = -1;
		return false;
	    case KEYCODE_S:
		bb.player1.moveY = 1;
		return false;
		
	    case KEYCODE_LEFT:
		bb.player2.moveX = -1;
		return false;
	    case KEYCODE_RIGHT:
		bb.player2.moveX = 1;
		return false;
	    case KEYCODE_UP:
		bb.player2.moveY = -1;
		return false;
	    case KEYCODE_DOWN:
		bb.player2.moveY = 1;
		return false;
	}
    },

    handleKeyUp: function(e) {
	if(!e){
	    var e = window.event;
	}
	switch(e.keyCode) {
	    case KEYCODE_SPACE:
		break;
	    case KEYCODE_A:
	    case KEYCODE_D:
		bb.player1.moveX = 0;
		return false;
	    case KEYCODE_W:
	    case KEYCODE_S:
		bb.player1.moveY = 0;
	    case KEYCODE_LEFT:
	    case KEYCODE_RIGHT:
		bb.player2.moveX = 0;
		return false;
	    case KEYCODE_UP:
	    case KEYCODE_DOWN:
		bb.player2.moveY = 0;
		return false;
	}
    },
    
    init: function() {
	this.initGraphic();
    },
    
    initGraphic: function() {
	var circle = new createjs.Graphics();
	//circle.setStrokeStyle(2, 'round');
	//circle.beginFill(this.color);
	circle.drawCircle(0, 0, 20);
	
	this.skin = new createjs.Shape(circle);
	switch(this.playerNo) {
	    case 1:
		this.skin.x = this.skin.y = bb.StageHelper.widthQuarter;
		break;
	    case 2:
		this.skin.x = this.skin.y = bb.StageHelper.width - bb.StageHelper.widthQuarter;
		break;
	}
	this.skin.regX = 10;
	this.skin.regY = 10;
	this.skin.snapToPixel = true;
	this.skin.mouseEnabled = false;
	
	bb.stage.addChild(this.skin);
    },
    
    initPlayer1: function() {
	var player = jQuery.extend(true, {}, this);
	
	player.playerNo = 1;
	player.color = '#00FF00';
	
	player.init();
	
	return player;
    },
    
    initPlayer2: function() {
	var player = jQuery.extend(true, {}, this);
	
	player.playerNo = 2;
	player.color = '#0000FF';
	
	player.init();
	
	return player;
    },
    
    startGame: function() {
	bb.Physics.setupPlayer(this);
	
	createjs.Ticker.addListener(this);
    },
    
    tick: function() {
	this.skin.x += (this.moveX * 10);
	this.skin.y += (this.moveY * 10);
	
	bb.Physics.update();
	bb.stage.update();
    }
}
/**
 * @type bb.Player
 */
bb.player1 = null;
bb.player2 = null;

bb.StageHelper = {
    htmlElement: null,
    
    height: 250,
    width: 250,
    widthHalf: null,
    widthQuarter: null,
    
    init: function() {
	this.htmlElement = $('#bb,#bbDebug');

	this.htmlElement.attr('width', this.width);
	this.htmlElement.attr('height', this.height);
	
	bb.stage = new createjs.Stage(document.getElementById('bb'));
	
	createjs.Ticker.setFPS(60);
	createjs.Ticker.useRAF = true;
	
	this.initBackground();
    },
    
    initBackground: function() {
	this.widthHalf = this.width / 2;
	this.widthQuarter = this.width / 4;
	
	var circle = new createjs.Graphics();
	circle.setStrokeStyle(2, 'round');
	circle.beginStroke(createjs.Graphics.getRGB(0,0,0xFF));
	circle.drawCircle(0, 0, this.widthHalf-20);
	
	var background = new createjs.Shape(circle);
	background.x = this.widthHalf;
	background.y = this.widthHalf;
	bb.stage.addChild(background);
    }
}

bb.Physics = {
    world: null,
    worldScale: 30,
    
    init: function() {
	this.setupWorld();
	
    },
    
    setupDebugDraw: function(){
	var debugDraw = new Box2D.Dynamics.b2DebugDraw();
	debugDraw.SetSprite(document.getElementById('bbDebug').getContext('2d'));
	debugDraw.SetDrawScale(this.worldScale);
	debugDraw.SetFillAlpha(0.7);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);
	this.world.SetDebugDraw(debugDraw);
    },
    
    setupPlayer: function(player) {
	var playerFixture = new Box2D.Dynamics.b2FixtureDef;
	playerFixture.density = 1;
	playerFixture.restitution = 0.6;
	playerFixture.shape = new Box2D.Collision.Shapes.b2CircleShape(10);
	
	var playerBodyDef = new Box2D.Dynamics.b2BodyDef;
	playerBodyDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
	playerBodyDef.position.x = player.skin.x;
	playerBodyDef.position.y = player.skin.y;
	
	var playerBody = this.world.CreateBody(playerBodyDef);
	playerBody.CreateFixture(playerFixture);
	
    // assign actor
    /*var actor = new actorObject(playerBody, skin);
	playerBody.SetUserData(actor);  // set the actor as user data of the body so we can use it later: body.GetUserData()
	bodies.push(playerBody);*/
    },
    
    setupWorld: function() {
	this.world = new Box2D.Dynamics.b2World(
	    new Box2D.Common.Math.b2Vec2(0,10),
	    true
	    );
    },
    
    update: function() {
	
    }
}

$(document).ready(function(){
    bb.init();
});