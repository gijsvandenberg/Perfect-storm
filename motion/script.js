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
let blobSize = 5;
let animationSpeed = 0.05;
let animationDuration = 1;

// Calculate the actual canvas size
const ACTUAL_CANVAS_SIZE = CANVAS_SIZE;

// Scale factor for drawing
const SCALE_FACTOR = 1;

let currentBlobIndex = 0; // Index of the blob currently being animated
let backgroundTexture;

// Keep track of which blobs have been fully rendered
let renderedBlobs = new Set();

// Recording variables
let recorder;
let recording = false;
let recordedBlobs = 0;

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
    
      // Animation Speed Slider
    const animationSpeedSlider = document.getElementById('animationSpeedSlider');
    if (animationSpeedSlider) {
        animationSpeedSlider.value = animationSpeed;
        animationSpeedSlider.addEventListener('input', function() {
            animationSpeed = parseFloat(this.value);
            this.nextElementSibling.textContent = this.value;
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
    
      // Record Button
    const recordBtn = document.getElementById('recordBtn');
    if(recordBtn){
      recordBtn.addEventListener('click', toggleRecording);
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
    document.querySelector('#animationSpeedSlider + .value-display').textContent = animationSpeed;
}

function generateArtwork() {
    // Clear the canvas
    clear();
    
    // Generate analogous color palette
    colors = generateAnalogousColors();
    
    // Draw and cache background texture
    if (!backgroundTexture) {
        backgroundTexture = createGraphics(ACTUAL_CANVAS_SIZE, ACTUAL_CANVAS_SIZE, WEBGL);
        backgroundTexture.colorMode(HSL, 360, 100, 100, 100);
        drawBezierTexture(backgroundTexture);
    }
    
    // Create nodes with minimum distance constraint
    nodes = [];
    createNodes();
    
    // Create connections between nearby nodes
    createConnections();
    
    // Reset the blob index and rendered blobs
    currentBlobIndex = 0;
    renderedBlobs.clear();
    
    // Stop any previous recording
    if (recording) {
       stopRecording();
    }
    
    // Start the animation loop
    loop();
}

function draw() {
    // Clear the canvas
    clear();

    // Draw cached background texture
    image(backgroundTexture, -width/2, -height/2);
    
     // Draw the artwork with animation
    if (currentBlobIndex < nodes.length) {
        // Animate the current blob
        let node = nodes[currentBlobIndex];
        
        // Only draw the bleed if it has not reached its final state
          node.blobAlpha = min(node.blobAlpha + animationSpeed, animationDuration);
          drawBleed(node, node.blobAlpha);
            
            // Draw the connections for the current node
            for (let connection of node.connections) {
                drawConnectionBleed(node, nodes[connection]);
            }
        
           // Draw the connections for already rendered nodes
          for (let i = 0; i < currentBlobIndex; i++) {
            let node = nodes[i];
            for (let connection of node.connections) {
                if (connection < i) {
                    drawConnectionBleed(node, nodes[connection]);
                }
            }
          }

        // Check if the current blob has finished animating
        if (node.blobAlpha >= animationDuration) {
            // Add the current blob to the rendered blobs set
            renderedBlobs.add(currentBlobIndex);
            // Move to the next blob
            currentBlobIndex++;
          }
    } else {
        // All blobs have finished animating
          for (let i = 0; i < nodes.length; i++) {
            for (let connection of nodes[i].connections) {
                drawConnectionBleed(nodes[i], nodes[connection]);
            }
          }
          if(recording) {
            stopRecording();
        }
        noLoop();
    }
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

function drawBezierTexture(graphics) {
    // Adjust background color to complement the base hue
    let bgHue = (baseHue + 180) % 360; // Complementary hue
    graphics.background(bgHue, 10, 95); // Very light, slightly tinted background
    
    // Draw a single, larger rectangle with a simple blend mode
    graphics.push();
    graphics.translate(-width/2, -height/2);
    graphics.fill(bgHue, 20, 99, 8);
    graphics.rect(0, 0, width, height);
    graphics.pop();
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
                color: baseColor,
                blobAlpha: 0 // Initialize blobAlpha
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

function drawBleed(node, alpha) {
    brush.pick("marker");
    brush.strokeWeight(0.01 * blobSize);
    
    // Create multiple overlapping bleeds
    
        let col = color(
            hue(node.color),
            saturation(node.color) * random(0.3, 0.5),
            lightness(node.color) * random(0.7, 1.0)
        );
        
        brush.fill(col, alpha*random(85, 95));
        brush.bleed(random(0.4, 0.6), "out");
        brush.fillTexture(random(0.4, 0.7), random(0.4, 0.7));
        
        let offsetX = random(-3, 3) * SCALE_FACTOR * blobSize;
        let offsetY = random(-3, 3) * SCALE_FACTOR * blobSize;
        let radius = node.radius * random(0.9, 1.1) * blobSize;
        
        // Apply radial gradient for fade-in
        brush.circle(node.x + offsetX, node.y + offsetY, radius, true);
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
    
    let bleedSize = random(10, 15) * SCALE_FACTOR * blobSize; // Reduced size here
    brush.circle(mx, my, bleedSize, true);
}

function toggleRecording() {
    if (!recording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    recording = true;
    recordedBlobs = 0;
    let canvas = document.querySelector('canvas');
     let stream = canvas.captureStream(60); // 60 fps
     recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
    recorder.ondataavailable = handleDataAvailable;
    recorder.start();
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        stopRecording(event.data);
    }
}

function stopRecording(blob) {
    recording = false;
    if(blob) {
         let url = URL.createObjectURL(blob);
         let a = document.createElement('a');
         a.href = url;
         a.download = 'indras_web.webm';
         a.click();
         URL.revokeObjectURL(url);
    }
     if (recorder) {
        recorder.stop();
        recorder = null;
    }
}

function keyPressed() {
    if (key === 's' || key === 'S') {
        saveCanvas('indras_web', 'png');
    }
    if (key === 'r' || key === 'R') {
        generateArtwork();
    }
}
