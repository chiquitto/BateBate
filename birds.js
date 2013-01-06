var luxanimals = {};

luxanimals.demo = (function() {

    // Box2d vars
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var b2BodyDef = Box2D.Dynamics.b2BodyDef;
    var b2Body = Box2D.Dynamics.b2Body;
    var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    var b2Fixture = Box2D.Dynamics.b2Fixture;
    var b2World = Box2D.Dynamics.b2World;
    var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

    // demo vars
    var canvas, context, debugCanvas, debugContext;
    var birdDelayCounter = 0; // counter for delaying creation of birds
    var focused = true;

    $('#debug').on('click', function() {
	$('#debugCanvas').toggle();
    });  // toggle debug view

    $(document).ready(function() {
	// setup functions to run once page is loaded
	setup.canvas();
	setup.ticker();
	box2d.setup();
	window.onfocus = onFocus;
	window.onblur = onBlur;
    });

    function onFocus() {
	focused = true;
	box2d.pauseResume(false);
	$('#paused').css({
	    'display':'none'
	});
    }
    function onBlur() {
	focused = false;
	box2d.pauseResume(true);
	$('#paused').css({
	    'display':'block'
	});
    }

    /* ------ SETUP ------- */
    // initial setup of canvas, contexts, and render loop

    var setup = (function() {

	var canvas = function() {
	    canvas = document.getElementById('demoCanvas');
	    debugCanvas = document.getElementById('debugCanvas');
	    context = canvas.getContext('2d');
	    debugContext = debugCanvas.getContext('2d');
	    stage = new Stage(canvas);
	    stage.snapPixelsEnabled = true;
	}

	var ticker = function() {
	    Ticker.setFPS(30);
	    //Ticker.useRAF = true;
	    Ticker.addListener(luxanimals.demo);  // looks for "tick" function within the luxanimals.demo object
	}

	return {
	    canvas: canvas,
	    ticker: ticker
	}
    })();

    /* ------- Birds --------- */
    // bitmap birds to be sent to box2d

    var birds = (function() {

	var spawn = function() {
	    var birdBMP = new Bitmap("images/bird.png");
	    birdBMP.x = Math.round(Math.random()*500);
	    birdBMP.y = -30;
	    birdBMP.regX = 25;   // important to set origin point to center of your bitmap
	    birdBMP.regY = 25; 
	    birdBMP.snapToPixel = true;
	    birdBMP.mouseEnabled = false;
	    stage.addChild(birdBMP);
	    box2d.createBird(birdBMP);
	}

	return {
	    spawn: spawn
	}
    })();

    /* ------- Box2D --------- */
    // handles all physics movement

    var box2d = (function() {

	// important box2d scale and speed vars
	var SCALE = 30, STEP = 20, TIMESTEP = 1/STEP;

	var world;
	var lastTimestamp = Date.now();
	var fixedTimestepAccumulator = 0;
	var bodiesToRemove = [];
	var actors = [];
	var bodies = [];

	// box2d world setup and boundaries
	var setup = function() {
	    world = new b2World(new b2Vec2(0,10), true);
	    addDebug();
	    // boundaries - floor
	    var floorFixture = new b2FixtureDef;
	    floorFixture.density = 1;
	    floorFixture.restitution = 1;
	    floorFixture.shape = new b2PolygonShape;
	    floorFixture.shape.SetAsBox(550 / SCALE, 10 / SCALE);
	    var floorBodyDef = new b2BodyDef;
	    floorBodyDef.type = b2Body.b2_staticBody;
	    floorBodyDef.position.x = -25 / SCALE;
	    floorBodyDef.position.y = 509 / SCALE;
	    var floor = world.CreateBody(floorBodyDef);
	    floor.CreateFixture(floorFixture);
	    // boundaries - left
	    var leftFixture = new b2FixtureDef;
	    leftFixture.shape = new b2PolygonShape;
	    leftFixture.shape.SetAsBox(10 / SCALE, 550 / SCALE);
	    var leftBodyDef = new b2BodyDef;
	    leftBodyDef.type = b2Body.b2_staticBody;
	    leftBodyDef.position.x = -9 / SCALE;
	    leftBodyDef.position.y = -25 / SCALE;
	    var left = world.CreateBody(leftBodyDef);
	    left.CreateFixture(leftFixture);
	    // boundaries - right
	    var rightFixture = new b2FixtureDef;
	    rightFixture.shape = new b2PolygonShape;
	    rightFixture.shape.SetAsBox(10 / SCALE, 550 / SCALE);
	    var rightBodyDef = new b2BodyDef;
	    rightBodyDef.type = b2Body.b2_staticBody;
	    rightBodyDef.position.x = 509 / SCALE;
	    rightBodyDef.position.y = -25 / SCALE;
	    var right = world.CreateBody(rightBodyDef);
	    right.CreateFixture(rightFixture);
	}

	// box2d debugger
	var addDebug = function() {
	    var debugDraw = new b2DebugDraw();
	    debugDraw.SetSprite(debugContext);
	    debugDraw.SetDrawScale(SCALE);
	    debugDraw.SetFillAlpha(0.7);
	    debugDraw.SetLineThickness(1.0);
	    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	    world.SetDebugDraw(debugDraw);
	}

	// actor object - this is responsible for taking the body's position and translating it to your easel display object
	var actorObject = function(body, skin) {
	    this.body = body;
	    this.skin = skin;
	    this.update = function() {  // translate box2d positions to pixels
		this.skin.rotation = this.body.GetAngle() * (180 / Math.PI);
		this.skin.x = this.body.GetWorldCenter().x * SCALE;
		this.skin.y = this.body.GetWorldCenter().y * SCALE;
	    }
	    actors.push(this);
	}

	// create bird body shape and assign actor object
	var createBird = function(skin) {
	    var birdFixture = new b2FixtureDef;
	    birdFixture.density = 1;
	    birdFixture.restitution = 0.6;
	    birdFixture.shape = new b2CircleShape(24 / SCALE);
	    var birdBodyDef = new b2BodyDef;
	    birdBodyDef.type = b2Body.b2_dynamicBody;
	    birdBodyDef.position.x = skin.x / SCALE;
	    birdBodyDef.position.y = skin.y / SCALE;
	    var bird = world.CreateBody(birdBodyDef);
	    bird.CreateFixture(birdFixture);

	    // assign actor
	    var actor = new actorObject(bird, skin);
	    bird.SetUserData(actor);  // set the actor as user data of the body so we can use it later: body.GetUserData()
	    bodies.push(bird);
	}

	// remove actor and it's skin object
	var removeActor = function(actor) {
	    stage.removeChild(actor.skin);
	    actors.splice(actors.indexOf(actor),1);
	}

	// box2d update function. delta time is used to avoid differences in simulation if frame rate drops
	var update = function() {
	    var now = Date.now();
	    var dt = now - lastTimestamp;
	    fixedTimestepAccumulator += dt;
	    lastTimestamp = now;
	    while(fixedTimestepAccumulator >= STEP) {
		// remove bodies before world timestep
		for(var i=0, l=bodiesToRemove.length; i<l; i++) {
		    removeActor(bodiesToRemove[i].GetUserData());
		    bodiesToRemove[i].SetUserData(null);
		    world.DestroyBody(bodiesToRemove[i]);
		}
		bodiesToRemove = [];

		// update active actors
		for(var i=0, l=actors.length; i<l; i++) {
		    actors[i].update();
		}

		world.Step(TIMESTEP, 10, 10);

		fixedTimestepAccumulator -= STEP;
		world.ClearForces();
		world.m_debugDraw.m_sprite.graphics.clear();
		world.DrawDebugData();
		if(bodies.length > 30) {
		    bodiesToRemove.push(bodies[0]);
		    bodies.splice(0,1);
		}
	    }
	}

	var pauseResume = function(p) {
	    if(p) {
		TIMESTEP = 0;
	    } else {
		TIMESTEP = 1/STEP;
	    }
	    lastTimestamp = Date.now();
	}

	return {
	    setup: setup,
	    update: update,
	    createBird: createBird,
	    pauseResume: pauseResume
	}
    })();

    /* ------- UPDATE -------- */
    // main update loop for rendering assets to canvas

    var tick = function(dt, paused) {
	if(focused) {
	    box2d.update();
	    stage.update();

	    birdDelayCounter++;
	    if(birdDelayCounter % 10 === 0) {  // delay so it doesn't spawn a bird on every frame
		birdDelayCounter = 0;
		birds.spawn();
	    }
	}
    }

    /* ------- GLOBAL -------- */
    // main global functions

    return {
	tick: tick
    }

}());