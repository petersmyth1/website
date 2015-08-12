var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var canvasDiv = document.getElementById('canvasDiv');
canvas.setAttribute('width', window.innerWidth);
canvas.setAttribute('height', window.innerHeight);
//canvas.setAttribute('id', 'canvas');
canvasDiv.appendChild(canvas);
if(typeof G_vmlCanvasManager != 'undefined')
{
	canvas = G_vmlCanvasManager.initElement(canvas);
}

var d = new Date();
var t = d.getTime();

var showInstructions = true;

var tStart = t;

var GAME_STATE = 0;
var TITLE1 = 0;
var TITLE2 = 1;
var TITLE3 = 2;
var GAME = 3;

var blueLineWidth = 0;
var apartY = 0;

//use to hide the scrub visual from showing on the right side of the screen in the beginning,
//so it looks like it comes in from the left only
var showScrubRight = false;

var mouseX = 0;
var mouseY = 0;
var wobbleRange = 5;

var myName = [];
myName.push("b");
myName.push("y");

myName.push("P");
myName.push("E");
myName.push("T");
myName.push("E");
myName.push("R");

myName.push("S");
myName.push("M");
myName.push("Y");
myName.push("T");
myName.push("H");

function Note(id, sound_id, x, y, yLevel)
{
	this.id = id;
	this.sound_id = sound_id;
	this.x = x;
	this.y = y;
	this.yLevel = yLevel;
	this.playing = false;
	this.glowing = false;
	this.anchorX = x;
	this.anchorY = y;
	this.speedX = Math.floor(Math.random()*5) - 2;
	this.speedY = Math.floor(Math.random()*5) - 2;
	this.tMove = 0;
	this.letter = "";
}

function Branch(note)
{
	this.note = note;
	this.children = [];
}

function makeBranch(id, sound_id, x, y, yLevel)
{
	var note = new Note(id, sound_id, x, y, yLevel);
	var d = new Date();
	note.tMove = d.getTime();
	var rand = Math.floor(Math.random()*5);
	switch(rand)
	{
		case 0:
		note.letter = "A";
		break;
		case 1:
		note.letter = "P";
		break;
		case 2:
		note.letter = "R";
		break;
		case 3:
		note.letter = "T";
		break;
		case 4:
		note.letter = "A";
		break;
	}
	var branch = new Branch(note);
	return branch;
}

//var branch = makeBranch(67,0,100,1);

//push branches to tree for bottom level.
//after that, push branches to the 'children' property of branch
var topBranch = makeBranch(-1, -1, 0, 1);

//all branches stored consecutively
var branches = new Array();
var tree = new Array();

var numParts = window.innerWidth/20 - 3;
var heights = new Array();
var speeds = new Array();
for(var i = 0; i < numParts; i++)
{
	var h = numParts*7 - (i*7);
	heights.push(h);
	var s = -1;
	speeds.push(s);
}
var entireWidth = 20 * heights.length;
var scrub = (canvas.width - entireWidth)/2;
var scrubWidth = 100;

var lineStart = (canvas.width - entireWidth)/2;
var lineEnd = (numParts * 20) + lineStart;
var lineWidth = lineEnd - lineStart;

var notes = new Array();
var notesY = new Array();
var notesPlayed = new Array();
var sounds = new Array();
/*sounds.push('hihat1');
sounds.push('snare4');
sounds.push('kick4');
sounds.push('kick6');
sounds.push('hihat2');
sounds.push('snare1');
sounds.push('snare8');
sounds.push('tom1');
sounds.push('clap');
sounds.push('cowbell');
*/

sounds.push('sms1');
sounds.push('sms2');
sounds.push('sms3');

var channelMax = 10;
var audioChannels = new Array();
for(var a = 0; a < channelMax; a++)
{
	audioChannels[a] = new Array();
	audioChannels[a]['channel'] = new Audio();
	audioChannels[a]['finished'] = -1;
}

function play_multi_sound(s)
{
	for(var a = 0; a < audioChannels.length; ++a)
	{
		thisTime = new Date();
		if(audioChannels[a]['finished'] < thisTime.getTime())
		{
			audioChannels[a]['finished'] = thisTime.getTime() +
				document.getElementById(s).duration*1000;
			audioChannels[a]['channel'].src = document.getElementById(s).src;
			audioChannels[a]['channel'].load();
			audioChannels[a]['channel'].play();
			break;
		}
	}
}

//recursive function to find yLevel of branches
function findYLevel(parentBranch, newBranch)
{
	//console.log(parentBranch.children.length);
	var note = newBranch.note;
	var parentNote;

	//top branch
	if(parentBranch.note.id == -1)
	{
		note.yLevel = 1;
		if(parentBranch.children == [])
		{
			return;
		}
	}
	
	//every other level
	for(var i = 0; i < parentBranch.children.length; i++)
	{
		if(i > 20) return;
		parentNote = parentBranch.children[i].note;
		if(note.x > parentNote.x-10 && note.x < parentNote.x+10)
		{
			if(parentNote.yLevel >= note.yLevel)
			{
				note.yLevel++;
				/*if(parentBranch.note.yLevel > note.yLevel)
				{
					
				}*/
			}
		}
		if(parentBranch.children[i].children != [])
		{
			findYLevel(parentBranch.children[i], newBranch)
		}
	}
}

function pushBranch(parentBranch, newBranch, foundSpot)
{
	if(foundSpot)
	{
		return foundSpot;
	}
	
	var note = newBranch.note;
	var parentNote;

	if(parentBranch.note.id == -1 && note.yLevel == 1)
	{
		parentBranch.children.push(newBranch);
		branches.push(newBranch);
	}

	//every other level
	for(var i = 0; i < parentBranch.children.length; i++)
	{
		parentNote = parentBranch.children[i].note;
		if(note.x > parentNote.x-10 && note.x < parentNote.x+10)
		{
			if(parentNote.yLevel == note.yLevel-1)
			{
				parentBranch.children[i].children.push(newBranch);
				branches.push(newBranch);
				foundSpot = true;
			}
		}
		if(parentBranch.children[i].children != [])
		{
			pushBranch(parentBranch.children[i], newBranch)
		}
	}
}

function drawNotes(parentBranch)
{
	for(var i = 0; i < parentBranch.children.length; i++)
	{
		
		if(parentBranch.children[i].note.y == (canvas.height/2) - 100 + apartY)
		{
			drawNotes(parentBranch.children[i]);
		}
		else
		{
			if(parentBranch.children[i].note.glowing)
			{
				context.strokeStyle = "white";
			}
			else
			{
				context.strokeStyle = "black";
			}
			context.beginPath();
			context.moveTo(parentBranch.note.x, parentBranch.note.y);
			context.lineTo(parentBranch.children[i].note.x, parentBranch.children[i].note.y);
			context.stroke();

			if(parentBranch.children[i].children.length > 0)
			{
				drawNotes(parentBranch.children[i]);
			}
		}
	}

	//draw the notes as white letters with black circles behind them
	for(var i = 0; i < branches.length; i++)
	{
		if(branches[i].note.glowing)
		{
			context.fillStyle="white";
		}
		else
		{
			context.fillStyle="black";
		}
		var x = branches[i].note.x-4;
		var y = branches[i].note.y-4;
		context.fillRect(x, y, 8, 8);

		//opposite color for text
		if(branches[i].note.glowing)
		{
			context.fillStyle="black";
		}
		else
		{
			context.fillStyle="white";
		}
		context.font="8px Verdana";
		context.textAlign="center"
		context.fillText(branches[i].note.letter, x+4, y+7);
	}
}

function drawPotentialNoteLine()
{
	if(!(mouseX > lineStart && mouseX < lineEnd &&
			mouseY < canvas.height/2))
	{
		return;
	}

	var possibleBranches = new Array();
	for(var i = 0; i < branches.length; i++)
	{
		var branch = branches[i];
		var note = branch.note;
		if(mouseX < note.x + 50 && mouseX > note.x - 50)
		{
			possibleBranches.push(branch);
		}
	}

	if(possibleBranches.length == 0)
	{
		//add branch to floor level
		//var newBranch = makeBranch(1, Math.floor(Math.random() * sounds.length),
		//						   e.pageX, canvas.height/2, 1);
		context.fillStyle = "#969B8F";
		context.fillRect(mouseX-3, (canvas.height/2) - 100 + apartY - 3, 6, 6);
		return;
	}

	var distances = new Array();
	for(var i = 0; i < possibleBranches.length; i++)
	{
		var possibleBranch = possibleBranches[i];
		//square_root((x2-x1)^2 + (y2-y1)^2)
		var newDistance = Math.sqrt(Math.pow((possibleBranch.note.x - mouseX),2) +
									Math.pow((possibleBranch.note.y - mouseY),2));
		newDistance = Math.abs(newDistance);
		distances.push(newDistance);
	}

	var shortestDistance = 500;
	var closestBranchId = 0;
	for(var i = 0; i < distances.length; i++)
	{
		if(distances[i] < shortestDistance)
		{
			shortestDistance = distances[i];
			closestBranchId = i;
		}
	}

	if(possibleBranches.length > 0)
	{
		context.strokeStyle = "#969B8F";
		context.beginPath();
		context.moveTo(possibleBranches[closestBranchId].note.x,
					   possibleBranches[closestBranchId].note.y);
		context.lineTo(mouseX, mouseY);
		context.stroke();
	}
	else
	{
		context.fillStyle = "#969B8F";
		fillRect(mouseX-3, (canvas.height/2) - 3, 6, 6);
	}
}

function drawLine(x1, y1, x2, y2)
{
	context.beginPath();
	context.moveTo(x1, y1 + apartY);
	context.lineTo(x2, y2 + apartY);
	context.stroke();
}

function drawLine(v1, v2)
{
	context.beginPath();
	context.moveTo(v1.x, v1.y + apartY);
	context.lineTo(v2.x, v2.y + apartY);
	context.stroke();
}

function drawTextsLine(v1, v2)
{
	context.beginPath();
	context.moveTo(v1.x, v1.y + textsAddY);
	context.lineTo(v2.x, v2.y + textsAddY);
	context.stroke();
}

function drawSquare(x, y)
{
	context.fillRect(x-3, y-3, 6, 6);
}

function v2(x, y)
{
	this.x = x;
	this.y = y;
}

//holds all the anchors of the end-points of lines that make up "a//part"
var apart = [];
var apartAnchors = [];
var apartDir = [];
var apartWobbleRange = 6; //how far the x pos can fluctuate in either direction
var apartAddX = []; //stores the x distance from the anchor point
var apartAddY = []; //maybe use to make the end-points move up when the scrub wave passes over
var tApartMove = []; //holds the time at which the points can move
//bottom, middle, and top y values for all letters
var my = canvas.height * (1/2);
var by = my + 50;
var ty = my - 50;
//left-most x value, the bottom left of the first A
//485 is the total width of the letters
var lx = (canvas.width/2) - (485/2) - (canvas.width/50);
//A
apart.push(new v2(lx, by));
apart.push(new v2(lx+20, my));
apart.push(new v2(lx+40, ty));
apart.push(new v2(lx+60, my));
apart.push(new v2(lx+80, by));
//SLASHES
apart.push(new v2(lx + 95, by + 20));
apart.push(new v2(lx + 120, ty - 20));
apart.push(new v2(lx + 110, by + 20));
apart.push(new v2(lx + 135, ty - 20));
//P
apart.push(new v2(lx + 150, by));
apart.push(new v2(lx + 150, my));
apart.push(new v2(lx + 150, ty));
apart.push(new v2(lx + 210, ty));
apart.push(new v2(lx + 210, my));
//A
apart.push(new v2(lx + 225, by));
apart.push(new v2(lx + 245, my));
apart.push(new v2(lx + 265, ty));
apart.push(new v2(lx + 285, my));
apart.push(new v2(lx + 305, by));
//R
apart.push(new v2(lx + 325, by));
apart.push(new v2(lx + 325, my));
apart.push(new v2(lx + 325, ty));
apart.push(new v2(lx + 385, ty));
apart.push(new v2(lx + 385, my));
apart.push(new v2(lx + 365, by));
//T
apart.push(new v2(lx + 445, by));
apart.push(new v2(lx + 405, ty));
apart.push(new v2(lx + 445, ty));
apart.push(new v2(lx + 485, ty));

for(var i = 0; i < apart.length; i++)
{
	apartAnchors.push(apart[i]);
	apartDir.push(1);
	apartAddX.push(0);
	apartAddY.push(0);

	tApartMove.push(t + Math.floor(Math.random()* 3500) + 500);
}

function updateApart()
{
	var d = new Date();
	var t = d.getTime();
	for(var i = 0; i < apart.length; i++)
	{
		if(tApartMove[i] < t)
		{
			apartAddX[i] += apartDir[i];
			if(Math.abs(apartAddX[i]) > apartWobbleRange)
			{
				if(apartAddX[i] > 0)
				{
					//apartAddX[i] -= (apartAddX[i] - apartWobbleRange);
				}
				else
				{
					apartAddX[i] -= (apartAddX[i] + apartWobbleRange);
				}
				apartDir[i] *= -1;
			}
			tApartMove[i] = t + Math.floor(Math.random()*500) + 4000;
			apart[i].x = apartAddX[i] + apartAnchors[i].x;
		}
	}
}

function drawApart()
{
	context.fillStyle = "black";
	context.strokeStyle = "black";
	//Draw all the squares
	for(var i = 0; i < apart.length; i++)
	{
		drawSquare(apart[i].x, apart[i].y + apartY);
	}
	
	//A
	drawLine(apart[0], apart[1]);
	drawLine(apart[1], apart[2]);
	drawLine(apart[2], apart[3]);
	drawLine(apart[3], apart[1]);
	drawLine(apart[3], apart[4]);
	
	//SLASHES
	drawLine(apart[5], apart[6]);
	drawLine(apart[7], apart[8]);
	
	//P
	drawLine(apart[9], apart[10]);
	drawLine(apart[10], apart[11]);
	drawLine(apart[11], apart[12]);
	drawLine(apart[12], apart[13]);
	drawLine(apart[13], apart[10]);
	
	//A
	drawLine(apart[14], apart[15]);
	drawLine(apart[15], apart[16]);
	drawLine(apart[16], apart[17]);
	drawLine(apart[17], apart[18]);
	drawLine(apart[15], apart[17]);
	
	//R
	drawLine(apart[19], apart[20]);
	drawLine(apart[20], apart[21]);
	drawLine(apart[21], apart[22]);
	drawLine(apart[22], apart[23]);
	drawLine(apart[23], apart[20]);
	drawLine(apart[20], apart[24]);
	
	//T
	drawLine(apart[26], apart[27]);
	drawLine(apart[27], apart[28]);
	drawLine(apart[27], apart[25]);
}

var texts = [];
var textsY = canvas.height/5;
var textsAddY = -190;

//text bubble 1
texts.push(new v2((canvas.width/2) - 140, -29));
texts.push(new v2((canvas.width/2) + 40, -29));
texts.push(new v2((canvas.width/2) + 40, -60));
texts.push(new v2((canvas.width/2) - 120, -60));
texts.push(new v2((canvas.width/2) - 120, -40));

//text bubble 2
texts.push(new v2((canvas.width/2) - 45, -20));
texts.push(new v2((canvas.width/2) - 45, 11));
texts.push(new v2((canvas.width/2) + 125, 11));
texts.push(new v2((canvas.width/2) + 105, 0));
texts.push(new v2((canvas.width/2) + 105, -20));

for(var i = 0; i < texts.length; i++)
{
	texts[i].y += textsY;
}

function drawTexts()
{
	context.fillStyle = "white";
	context.strokeStyle = "white";
	//Draw all the squares
	for(var i = 0; i < texts.length; i++)
	{
		drawSquare(texts[i].x, texts[i].y + textsAddY);
	}

	//bubble 1
	drawTextsLine(texts[0], texts[1]);
	drawTextsLine(texts[1], texts[2]);
	drawTextsLine(texts[2], texts[3]);
	drawTextsLine(texts[3], texts[4]);
	drawTextsLine(texts[4], texts[0]);

	//bubble 2
	drawTextsLine(texts[5], texts[6]);
	drawTextsLine(texts[6], texts[7]);
	drawTextsLine(texts[7], texts[8]);
	drawTextsLine(texts[8], texts[9]);
	drawTextsLine(texts[9], texts[5]);
	
	context.font="12px Verdana";
	context.fillStyle="black";
	context.textAlign="left";
	context.fillText("You are apart of me.", canvas.width/2 - 80 - 20, textsY - 40 + textsAddY);
	context.fillText("A part from you.", canvas.width/2 - 20, textsY + textsAddY);
	//context.fillText("You were eventually right.", canvas.width/2 - 80 + 20, textsY + 40 + textsAddY);
}

function updateTexts()
{
	
}

function moveBranches()
{
	var d = new Date()
	var t = d.getTime();
	for(var i = 0; i < branches.length; i++)
	{
		if(t > branches[i].note.tMove)
		{
			branches[i].note.x += Math.floor(Math.random()*4)*2;
			branches[i].note.tMove = t + Math.floor(Math.random()*1000)+2000;
		}
	}
}

//mouse events
$('#canvas').mousedown(
	function(e)
	{
		if(GAME_STATE == 0)
		{
			var d = new Date();
			var t = d.getTime();
			tStart = t;
			GAME_STATE = 1;
			return;
		}
		else if(GAME_STATE == 1)
		{
			return;
		}
		else if(GAME_STATE == TITLE3)
		{
			GAME_STATE = GAME;
			scrub = lineEnd - (scrubWidth);
			return;
		}
		
		if(!(e.pageX > lineStart && e.pageX < lineEnd &&
			e.pageY < (canvas.height/2) - 100 + apartY))
		{
			return;
		}
		if(showInstructions)
		{
			showInstructions = false;
		}

		var possibleBranches = new Array();
		for(var i = 0; i < branches.length; i++)
		{
			var branch = branches[i];
			var note = branch.note;
			if(e.pageX < note.x + 50 && e.pageX > note.x - 50)
			{
				possibleBranches.push(branch);
			}
		}

		if(possibleBranches.length == 0)
		{
			//add branch to floor level
			var newBranch = makeBranch(1, Math.floor(Math.random() * sounds.length),
									   e.pageX, (canvas.height/2) - 100 + apartY, 1);
			topBranch.children.push(newBranch);
			branches.push(newBranch);
			return;
		}

		var newBranch = makeBranch(1, Math.floor(Math.random() * sounds.length),
								   e.pageX, e.pageY, 1);

		var distances = new Array();
		for(var i = 0; i < possibleBranches.length; i++)
		{
			var possibleBranch = possibleBranches[i];
			//square_root((x2-x1)^2 + (y2-y1)^2)
			var newDistance = Math.sqrt(Math.pow((possibleBranch.note.x - e.pageX),2) +
										Math.pow((possibleBranch.note.y - e.pageY),2));
			newDistance = Math.abs(newDistance);
			distances.push(newDistance);
		}

		var shortestDistance = 500;
		var closestBranchId = 0;
		for(var i = 0; i < distances.length; i++)
		{
			if(distances[i] < shortestDistance)
			{
				shortestDistance = distances[i];
				closestBranchId = i;
			}
		}

		//make sure letter of new branch is different than parent branch
		while(possibleBranches[closestBranchId].note.letter == newBranch.note.letter)
		{
			var rand = Math.floor(Math.random()*4);
			switch(rand)
			{
				case 0:
				newBranch.note.letter = "A";
				break;
				case 1:
				newBranch.note.letter = "P";
				break;
				case 2:
				newBranch.note.letter = "R";
				break;
				case 3:
				newBranch.note.letter = "T";
				break;
			}
		}
		
		possibleBranches[closestBranchId].children.push(newBranch);
		branches.push(newBranch);
	}
);

$('#canvas').mousemove(
	function(e)
	{
		mouseX = e.pageX;
		mouseY = e.pageY;
	}
);

$('#canvas').mouseup(
	function(e)
	{
		
	}
);

$('#canvas').mouseleave(
	function(e)
	{
		
	}
);

function partX(partNum)
{
	return (partNum * 20) + (canvas.width - entireWidth)/2;
}

function playSound(branch)
{
	if(branch.note.playing)
	{
		return;
	}
	play_multi_sound(sounds[branch.note.sound_id]);
	branch.note.playing = true;
	branch.note.glowing = true;
	setTimeout(getFinishPlayingSoundCallback(branch), 1000);
	setTimeout(getFinishGlowingCallback(branch), 300);
}

function getFinishPlayingSoundCallback(branch)
{
	return function(){ branch.note.playing = false; };
}

function getFinishGlowingCallback(branch)
{
	return function(){ branch.note.glowing = false; };
}

function getPlaySoundsCallback(index, parentBranch)
{
	return function()
	{
		playSound(parentBranch.children[index]);
		playSounds(parentBranch.children[index]);
	};
}

function playSounds(parentBranch)
{
	playSound(parentBranch);
	var childBranch;
	for(var i = 0; i < parentBranch.children.length; i++)
	{
		childBranch = parentBranch.children[i];
		setTimeout(getPlaySoundsCallback(i, parentBranch), Math.floor(Math.random()*400) + 800); //1000
	}
}

function update()
{
	if(showScrubRight == false && scrub > lineStart + scrubWidth &&
	   scrub < lineStart + scrubWidth + 10 && GAME_STATE == GAME)
	{
		showScrubRight = true;
	}
	
	scrub += 2;
	if(scrub > (canvas.width - (canvas.width - entireWidth)/2))
	{
		scrub = (canvas.width - entireWidth)/2;
	}

	for(var i = 0; i < numParts; i++)
	{
		if(partX(i)+10 > scrub-scrubWidth && partX(i)+10 < scrub + scrubWidth)
		{
			var newHeight = 50 - (Math.abs((scrub - (partX(i)+10)))/2);
			var factor = Math.floor(newHeight/4);
			newHeight = factor * 4;
			heights[i] = newHeight;
		}
		else if(lineEnd - scrub < 100 &&
				(partX(i)+10) < lineStart + (scrubWidth - (lineEnd - scrub)))
		{
			var newHeight = 50 - (Math.abs(((lineStart - (lineEnd-scrub)) - (partX(i)+10)))/2);
			var factor = Math.floor(newHeight/4);
			newHeight = factor * 4;
			heights[i] = newHeight;
		}
		else if(scrub - lineStart < 100 &&
				(partX(i)+10) > lineEnd - (scrubWidth - (scrub - lineStart)))
		{
			var newHeight = 50 - (Math.abs(((lineEnd + (scrub - lineStart)) - (partX(i)+10)))/2);
			var factor = Math.floor(newHeight/4);
			newHeight = factor * 4;
			heights[i] = newHeight;
		}
		else
		{
			heights[i] = 0;
		}
		if(heights[i] == 50) heights[i] = 45;
		if(i > numParts/2 && showScrubRight == false)
		{
			heights[i] = 0;
		}
	}

	//note shit
	for(var i = 0; i < topBranch.children.length; i++)
	{
		if(scrub > topBranch.children[i].note.x-2 &&
		   scrub < topBranch.children[i].note.x+2)
		{
			playSounds(topBranch.children[i]);
		}
	}

	moveBranches();
	updateApart();
	
	//check if a branch and its parent are out of bounds, if so:
	//remove child branch
	for(var i = 0; i < branches.length; i++)
	{
		if(branches[i].note.x > lineEnd)
		{
			
		}
	}
	
	draw();
}

function draw()
{
	context.clearRect(0, 0, canvas.width, canvas.height);

	drawTexts();
	
	if(GAME_STATE == TITLE1)
	{
		drawTitle();
		return;
	}
	else if(GAME_STATE == TITLE2)
	{
		var d = new Date();
		var t = d.getTime();
		if(tStart < t)
		{
			//move title down
			var i = Math.floor((t - tStart));
			if(apartY < canvas.height/4)
			{
				apartY = (i/100)*6;
			}
			if(blueLineWidth < lineWidth)
			{
				blueLineWidth = lineWidth * (apartY / (canvas.height/4));
			}

			if(textsAddY < 50)
			{
				textsAddY = -200 + (i/100)*8;
			}
			
			if(blueLineWidth >= lineWidth && apartY >= canvas.height/4)
			{
				GAME_STATE = GAME;
				scrub = lineEnd - (scrubWidth);
			}
		}
		context.lineWidth="1";
		context.strokeStyle="#99CCFF";
	
		context.beginPath();
		context.moveTo((canvas.width/2) - (blueLineWidth/2), (canvas.height/2) - 100 + apartY);
		context.lineTo((canvas.width/2) + (blueLineWidth/2), (canvas.height/2) - 100 + apartY);
		context.stroke();
		drawTitle();
		return;
	}
	else if(GAME_STATE == TITLE3)
	{
		//draw blue line
		context.lineWidth="1";
		context.strokeStyle="#99CCFF";
		context.beginPath();
		context.moveTo((canvas.width/2) - (blueLineWidth/2), (canvas.height/2) - 100 + apartY);
		context.lineTo((canvas.width/2) + (blueLineWidth/2), (canvas.height/2) - 100 + apartY);
		context.stroke();
		
		drawTitle();
		return;
	}

	context.lineWidth="1";
	context.strokeStyle="#99CCFF";
	
	context.beginPath();
	context.moveTo(lineStart, (canvas.height/2) - 100 + apartY);
	context.lineTo(lineEnd, (canvas.height/2) - 100 + apartY);
	context.stroke();

	context.fillStyle="#99CCFF";
	for(var i = 0; i < numParts; ++i)
	{
		var x = (i * 20) + (canvas.width - entireWidth)/2;
		var y = ((canvas.height/2) - 100 + apartY) - (heights[i]);
		
		context.rect(x, y, 20, heights[i]);
		context.fill();
	}

	context.fillStyle="black";

	drawPotentialNoteLine();
	drawNotes(topBranch);
	
	for(var i = 0; i < tree.length; i++)
	{
		var x = tree[i].note.x-5;
		var yLevel = (tree[i].note.yLevel * 20) + (tree[i].note.yLevel-1) - 20;
		var y = (canvas.height/2)-20 - yLevel;
		context.fillRect(x, y, 10, 20);
		//context.fill();
	}

	if(showInstructions)
	{
		context.font="30px Verdana";
		context.fillStyle="#99CCFF";
		context.textAlign="center"
		//context.fillText("~~click around~~", canvas.width/2, canvas.height/2 + 40);
	}

	drawTitle();
}

function drawTitle()
{
	context.lineWidth="1";
	context.strokeStyle="black";
	drawApart();

	//draw "by PETER SMYTH"
	var width = 8; //width of squares
	var spacing = 6; //space between letters
	var wordSpacing = 10; //space between words
	//width of all letters + spacing
	var wholeWidth = (myName.length * width) + (myName.length - 1) * spacing + (wordSpacing * 2);
	var lx = (canvas.width/2) - (wholeWidth/2); //starting x value of the string
	for(var i = 0; i < myName.length; i++)
	{
		context.fillStyle = "black";
		
		var x = lx + (width * i) + (spacing * i);
		if(i > 1)
		{
			x += wordSpacing;
		}
		if(i > 6)
		{
			x += wordSpacing;
		}
		var y = canvas.height/2 + apartY + 100; 
		context.fillRect(x, y, 9, 9);

		//opposite color for text
		context.fillStyle = "white";
		
		context.font="8px Verdana";
		context.textAlign="center"
		context.fillText(myName[i], x+4, y+7);
	}
}

setInterval(update, 1000/30);

//just to check that everything works
context.moveTo(20,0);
context.lineTo(60,110);
//context.stroke();
