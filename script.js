// Global variables
let colors;
let nodes = [];
const CANVAS_SIZE = 800; // Base size
let MAX_DISTANCE = 250;
const NUM_COLORS = 6;

// Control variables
let baseHue = 220;
let hueRange = 30;
let numNodes = 12;
let minDistance = 100;
let blobSize = 1; // New control variable for blob size

// Calculate the actual canvas size (double the base)
const ACTUAL_CANVAS_SIZE = CANVAS_SIZE * 4;

// Scale factor for drawing on the larger canvas
const SCALE_FACTOR = 4;

// Wait for DOM to be fully loaded before setting up controls
document.addEventListener('DOMContentLoaded', function() {
    setupControls();
});

function setup() {
    // Create the canvas with the actual size
    const canvas = createCanvas(ACTUAL_CANVAS_SIZE, ACTUAL_CANVAS_SIZE, WEBGL);
    canvas.parent('canvasContainer');
    colorMode(HSL, 360, 100, 100, 100);
    
    // Set CSS to make the canvas fit the container
    canvas.style('width', '100%');
    canvas.style('height', 'auto');
    
    // Initialize p5.brush
    brush.load();
    
    // Generate initial artwork
    generateArtwork();
}

function setupControls() {
    // Hue Slider
    const hueSlider = document.getElementById('hueSlider');
    if (hueSlider) {
        hueSlider.value = baseHue;
        hueSlider.addEventListener('input', function() {
            baseHue = parseInt(this.value);
            this.nextElementSibling.textContent = this.value + '°';
            generateArtwork();
        });
    }

    // Hue Range Slider
    const hueRangeSlider = document.getElementById('hueRangeSlider');
    if (hueRangeSlider) {
        hueRangeSlider.value = hueRange;
        hueRangeSlider.addEventListener('input', function() {
            hueRange = parseInt(this.value);
            this.nextElementSibling.textContent = this.value + '°';
            generateArtwork();
        });
    }
    
     // Blob Size Slider
    const blobSizeSlider = document.getElementById('blobSizeSlider');
    if (blobSizeSlider) {
        blobSizeSlider.value = blobSize;
        blobSizeSlider.addEventListener('input', function() {
            blobSize = parseFloat(this.value);
            this.nextElementSibling.textContent = this.value;
            generateArtwork();
        });
    }

    // Nodes Slider
    const nodesSlider = document.getElementById('nodesSlider');
    if (nodesSlider) {
        nodesSlider.value = numNodes;
        nodesSlider.addEventListener('input', function() {
            numNodes = parseInt(this.value);
            this.nextElementSibling.textContent = this.value;
            generateArtwork();
        });
    }

    // Min Distance Slider
    const minDistanceSlider = document.getElementById('minDistanceSlider');
    if (minDistanceSlider) {
        minDistanceSlider.value = minDistance;
        minDistanceSlider.addEventListener('input', function() {
            minDistance = parseInt(this.value);
            this.nextElementSibling.textContent = this.value + 'px';
            generateArtwork();
        });
    }

    // Generate Button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateArtwork);
    }

    // Save Button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => saveCanvas('indras_web', 'png'));
    }

    // Update initial value displays
    updateValueDisplays();
}

function updateValueDisplays() {
    // Update all value displays to match initial values
    document.querySelector('#hueSlider + .value-display').textContent = baseHue + '°';
    document.querySelector('#hueRangeSlider + .value-display').textContent = hueRange + '°';
     document.querySelector('#blobSizeSlider + .value-display').textContent = blobSize;
    document.querySelector('#nodesSlider + .value-display').textContent = numNodes;
    document.querySelector('#minDistanceSlider + .value-display').textContent = minDistance + 'px';
}

function generateArtwork() {
    // Clear the canvas
    clear();
    
    // Generate analogous color palette
    colors = generateAnalogousColors();
    
    // Draw background texture
    drawBezierTexture();
    
    // Create nodes with minimum distance constraint
    nodes = [];
    createNodes();
    
    // Create connections between nearby nodes
    createConnections();
    
    // Draw the artwork
    drawBleeds();
}

function generateAnalogousColors() {
    let analogousColors = [];
    let step = (hueRange * 2) / (NUM_COLORS - 1);
    
    for (let i = 0; i < NUM_COLORS; i++) {
        let hue = (baseHue - hueRange + (step * i) + 360) % 360;
        analogousColors.push(
            color(
                hue,
                random(50, 65),
                random(45, 60)
            )
        );
    }
    return analogousColors;
}

function drawBezierTexture() {
    // Adjust background color to complement the base hue
    let bgHue = (baseHue + 180) % 360; // Complementary hue
    background(bgHue, 10, 95); // Very light, slightly tinted background
    
    // Adjust bezier layers to use analogous colors
    drawBezierLayer(20000, 0.15 * SCALE_FACTOR, [baseHue, 20, 99, 8], 800 * SCALE_FACTOR);
    drawBezierLayer(8000, 0.2 * SCALE_FACTOR, [(baseHue + 15) % 360, 25, 95, 12], 600 * SCALE_FACTOR);
    drawBezierLayer(4000, 0.25 * SCALE_FACTOR, [(baseHue - 15 + 360) % 360, 30, 90, 15], 400 * SCALE_FACTOR);
}

function drawBezierLayer(count, weight, colorParams, padFactor) {
    push();
    for (let i = 0; i < count; i++) {
        strokeWeight(weight);
        stroke(
            colorParams[0] + random(-10, 10),
            colorParams[1] + random(-5, 5),
            colorParams[2] + random(-10, 10),
            colorParams[3]
        );
        noFill();
        
        bezier(
            random(-padFactor, width + padFactor) - width/2,
            random(-padFactor, height + padFactor) - height/2,
            random(-padFactor, width + padFactor) - width/2,
            random(-padFactor, height + padFactor) - height/2,
            random(-padFactor, width + padFactor) - width/2,
            random(-padFactor, height + padFactor) - height/2,
            random(-padFactor, width + padFactor) - width/2,
            random(-padFactor, height + padFactor) - height/2
        );
    }
    pop();
}

function createNodes() {
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (nodes.length < numNodes && attempts < maxAttempts) {
        let x = random(-width/2 + 100 * SCALE_FACTOR, width/2 - 100 * SCALE_FACTOR);
        let y = random(-height/2 + 100 * SCALE_FACTOR, height/2 - 100 * SCALE_FACTOR);
        let valid = true;
        
        for (let node of nodes) {
            let d = dist(x, y, node.x, node.y);
            if (d < minDistance * SCALE_FACTOR) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            let baseColor = random(colors);
            nodes.push({
                x: x,
                y: y,
                radius: random(20, 35) * SCALE_FACTOR,
                connections: [],
                color: baseColor
            });
        }
        attempts++;
    }
}

function createConnections() {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            let d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            if (d < MAX_DISTANCE * SCALE_FACTOR) {
                nodes[i].connections.push(j);
                nodes[j].connections.push(i);
            }
        }
    }
}

function drawBleeds() {
    // First pass: Draw base bleeds
    for (let node of nodes) {
        drawBleed(node, 1);
    }
    
    // Second pass: Draw connection bleeds
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        for (let connection of node.connections) {
            let target = nodes[connection];
            drawConnectionBleed(node, target);
        }
    }
    
    // Third pass: Draw highlight bleeds
    for (let node of nodes) {
        drawBleed(node, 0.7);
    }
    
    // Final atmospheric layer
    drawBezierLayer(2000, 0.15 * SCALE_FACTOR, [baseHue, 20, 90, 5], 400 * SCALE_FACTOR);
}

function drawBleed(node, scale) {
    brush.pick("marker");
   brush.strokeWeight(0.01 * blobSize);
    
    // Create multiple overlapping bleeds
    for (let i = 0; i < 3; i++) {
        let col = color(
            hue(node.color),
            saturation(node.color) * random(0.3, 0.5),
            lightness(node.color) * random(0.7, 1.0)
        );
        
        brush.fill(col, random(85, 95));
        brush.bleed(random(0.35, 0.55), "out");
        brush.fillTexture(random(0.4, 0.7), random(0.4, 0.7));
        
        let offsetX = random(-3, 3) * SCALE_FACTOR * blobSize;
        let offsetY = random(-3, 3) * SCALE_FACTOR * blobSize;
        let radius = node.radius * scale * random(0.9, 1.1) * blobSize;
        
        brush.circle(node.x + offsetX, node.y + offsetY, radius, true);
    }
}

function drawConnectionBleed(node1, node2) {
    let mx = lerp(node1.x, node2.x, random(0.4, 0.6));
    let my = lerp(node1.y, node2.y, random(0.4, 0.6));
    
    brush.pick("marker");
   // brush.strokeWeight(0.1 * SCALE_FACTOR * blobSize);
    
    let connectionColor = lerpColor(node1.color, node2.color, random(0.4, 0.6));
    
    brush.fill(connectionColor, random(70, 85));
    brush.bleed(random(0.4, 0.6), "out");
    brush.fillTexture(random(0.5, 0.8), random(0.4, 0.7));
    
    let bleedSize = random(15, 25) * SCALE_FACTOR * blobSize;
    brush.circle(mx, my, bleedSize, true);
}

function keyPressed() {
    if (key === 's' || key === 'S') {
        saveCanvas('indras_web', 'png');
    }
    if (key === 'r' || key === 'R') {
        generateArtwork();
    }
}
