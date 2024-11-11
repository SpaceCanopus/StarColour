
// Create a scene with a gray background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x808080); 

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 3, 8);

// Create a renderer with antialiasing enabled
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Create a temperature slider
const slider = document.createElement('input');
slider.type = 'range';
slider.min = 2800;
slider.max = 20000;
slider.value = 5778;
slider.style.position = 'absolute';
slider.style.top = '10px';
slider.style.left = '10px';
slider.style.width = '500px';
document.body.appendChild(slider);

let line; // Store the line so it can be removed when updating
let pointCloud; // New global variable for the point cloud


function createDottedLine(xPosition, color) {
    const points = [
        new THREE.Vector3(xPosition, 0, 0),  // Start at the bottom of the graph
        new THREE.Vector3(xPosition, 5, 0)   // Extend to the top of the graph (adjust as needed)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
        color: color,
        dashSize: 0.2,  // Length of the dash
        gapSize: 0.1    // Length of the gap between dashes
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Required for dashed lines to work properly

    scene.add(line);
}

// Convert wavelength in nm to the x-axis position (e.g., scaling factor of 0.005 as used in your points)
const uvStartPosition = 380 * 0.005; // Adjust this based on your scale
const irStartPosition = 700 * 0.005; // Adjust this based on your scale

// Add the UV and IR dotted lines to the scene
createDottedLine(uvStartPosition, 0x0000ff); // Blue for UV line
createDottedLine(irStartPosition, 0xff0000); // Red for IR line

function addLabel(text, position, size = 0.1, color = 0x000000) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: size,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        const textMaterial = new THREE.MeshBasicMaterial({ color: color });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text
        textMesh.position.x = position.x - (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
        textMesh.position.y = position.y;
        textMesh.position.z = position.z;

        scene.add(textMesh);
    });
}

// Add labels for UV and IR regions with custom colors
addLabel('Ultra Violet', new THREE.Vector3(uvStartPosition - 1, 5, 0), 0.2, 0x0000ff); // Blue color for UV label
addLabel('Infra Red', new THREE.Vector3(irStartPosition + 2, 5, 0), 0.2, 0xff0000); // Red color for IR label
addLabel('How the star would appear to us', new THREE.Vector3(irStartPosition + 11.5, 1.5, 0), 0.2, 0xFFC0CB); // Red color for IR label
addLabel('Adjust the slider to change the star temperature', new THREE.Vector3(irStartPosition - 1, 8.2, 0), 0.2, 0xFFC0CB); // Red color for IR label


let titleLabel; // Variable to store the title label
let isUpdatingTitle = false; // Flag to track if an update is in progress

// Function to create or update the title label
function createOrUpdateTitle(temperature) {
    // Check if an update is already in progress
    if (isUpdatingTitle) {
        return; // Exit if an update is currently being processed
    }

    // Set the flag to true to indicate an update is in progress
    isUpdatingTitle = true;

    // Remove the existing title label if it exists
    if (titleLabel) {
        scene.remove(titleLabel);
        titleLabel.geometry.dispose();
        titleLabel.material.dispose();
        titleLabel = null; // Clear the reference to avoid overwriting issues
    }

    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const text = `Planck's Law Visualization - Star Temperature: ${temperature} K`;
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: 0.5,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        titleLabel = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text
        titleLabel.position.x = 10 - (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
        titleLabel.position.y = 6;
        titleLabel.position.z = 0;

        scene.add(titleLabel);

        // Reset the flag after the title label has been added
        isUpdatingTitle = false;
    });
}

// Initial call to create the title with the default temperature
createOrUpdateTitle(slider.value);

// Update the title when the slider changes
slider.addEventListener('input', () => {
    createOrUpdateTitle(parseFloat(slider.value));
});

// Function to calculate Planck's Law
function plancksLaw(wavelength, temperature) {
    const h = 6.626e-34;  // Planck's constant
    const c = 3.0e8;      // Speed of light
    const kB = 1.381e-23; // Boltzmann's constant
    if (wavelength <= 0) return 0;
    return (2 * h * c ** 2) / (wavelength ** 5) / (Math.exp((h * c) / (wavelength * kB * temperature)) - 1);
}

// Function to get color based on temperature
function getStarColor(temperature) {
    const minTemperature = 2000;
    const maxTemperature = 40000;

    // Clamp temperature to the min and max range
    temperature = Math.max(minTemperature, Math.min(maxTemperature, temperature));

    // Key temperature points and corresponding colors in RGB
    const colorMap = [
        { temp: 2000, color: { r: 255, g: 50, b: 0 } },
        { temp: 3000, color: { r: 255, g: 80, b: 0 } },
        { temp: 4000, color: { r: 255, g: 140, b: 0 } },
        { temp: 5000, color: { r: 255, g: 255, b: 0 } },
        { temp: 6000, color: { r: 255, g: 255, b: 240 } },
        { temp: 8000, color: { r: 255, g: 255, b: 255 } },
        { temp: 10000, color: { r: 201, g: 215, b: 255 } },
        { temp: 12000, color: { r: 100, g: 150, b: 255 } },
        { temp: 20000, color: { r: 64, g: 156, b: 255 } },
        { temp: 30000, color: { r: 0, g: 80, b: 255 } },
        { temp: 40000, color: { r: 0, g: 0, b: 255 } }
    ];

    let lowerColor, upperColor;
    for (let i = 0; i < colorMap.length - 1; i++) {
        if (temperature >= colorMap[i].temp && temperature <= colorMap[i + 1].temp) {
            lowerColor = colorMap[i];
            upperColor = colorMap[i + 1];
            break;
        }
    }

    const t = (temperature - lowerColor.temp) / (upperColor.temp - lowerColor.temp);
    const r = Math.round(lowerColor.color.r + t * (upperColor.color.r - lowerColor.color.r));
    const g = Math.round(lowerColor.color.g + t * (upperColor.color.g - lowerColor.color.g));
    const b = Math.round(lowerColor.color.b + t * (upperColor.color.b - lowerColor.color.b));

    const color = (r << 16) | (g << 8) | b;
    return color;
}

function getColorForWavelength(wavelength) {
    let r = 0, g = 0, b = 0;
    if (wavelength >= 380 && wavelength < 440) {
        r = -(wavelength - 440) / (440 - 380);
        g = 0;
        b = 1;
    } else if (wavelength >= 440 && wavelength < 490) {
        r = 0;
        g = (wavelength - 440) / (490 - 440);
        b = 1;
    } else if (wavelength >= 490 && wavelength < 510) {
        r = 0;
        g = 1;
        b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
        r = (wavelength - 510) / (580 - 510);
        g = 1;
        b = 0;
    } else if (wavelength >= 580 && wavelength < 645) {
        r = 1;
        g = -(wavelength - 645) / (645 - 580);
        b = 0;
    } else if (wavelength >= 645 && wavelength <= 700) {
        r = 1;
        g = 0;
        b = 0;
    }

    // Adjust intensity outside the main visible spectrum
    let factor = 1.0;
    if (wavelength >= 380 && wavelength < 420) {
        factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 645 && wavelength <= 700) {
        factor = 0.3 + 0.7 * (700 - wavelength) / (700 - 645);
    }

    r = Math.round(255 * r * factor);
    g = Math.round(255 * g * factor);
    b = Math.round(255 * b * factor);

    return (r << 16) | (g << 8) | b; // Convert RGB to hexadecimal format
}


function createGraph(temperature) {
    if (line) {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        line = null;
    }

    if (pointCloud) {
        scene.remove(pointCloud);
        pointCloud.geometry.dispose();
        pointCloud.material.dispose();
        pointCloud = null;
    }

    const numPoints = 2000;
    const minWavelength = 100; // Start of the visible spectrum in nm
    const maxWavelength = 4000; // End of the visible spectrum in nm
    const wavelengths = [];
    const spectralRadiance = [];
    const colors = []; // Array to store colors for each point

    // Generate points and assign colors based on wavelength
    for (let i = 0; i < numPoints; i++) {
        const wavelength = minWavelength + (i / (numPoints - 1)) * (maxWavelength - minWavelength);
        wavelengths.push(wavelength);
        spectralRadiance.push(plancksLaw(wavelength * 1e-9, temperature)); // Convert nm to meters for Planck's Law

        // Get color for each wavelength
        const color = getColorForWavelength(wavelength);
        colors.push(color);
    }

    // Calculate the average color
    const averageColor = calculateAverageColor(wavelengths, spectralRadiance);

    // Display the average color as a circle to the right of the graph
    displayAverageColorCircle(averageColor);

    const actualMaxRadiance = Math.max(...spectralRadiance);
    const normalizedRadiance = spectralRadiance.map(sr => (sr / actualMaxRadiance) * 5);

    const points = [];
    for (let i = 0; i < numPoints; i++) {
        points.push(new THREE.Vector3(wavelengths[i] * 0.005, normalizedRadiance[i], 0));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create a color attribute for the points
    const pointColors = new Float32Array(numPoints * 3);
    for (let i = 0; i < numPoints; i++) {
        const color = new THREE.Color(colors[i]);
        pointColors[i * 3] = color.r;
        pointColors[i * 3 + 1] = color.g;
        pointColors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

    const pointMaterial = new THREE.PointsMaterial({
        vertexColors: true, // Enable per-vertex coloring
        size: 0.1, // Adjust as needed
        transparent: true,
        opacity: 1.0 // Ensure full opacity for clarity
    });

    pointCloud = new THREE.Points(geometry, pointMaterial);
    scene.add(pointCloud);

    createAxisWithTicks(20, 'Wavelength (nm)', '', { x: 0, y: 0, z: 0 }, 'x', 10);
    createAxisWithTicks(5, 'Spectral Radiance (x 10^13 W/m²/nm)', '', { x: 0, y: 0, z: 0 }, 'y', 10, actualMaxRadiance);
}

// Initial graph creation
createGraph(slider.value);

// Update graph when the slider changes
slider.addEventListener('input', () => {
    createGraph(parseFloat(slider.value));
});

function calculateAverageColor(wavelengths, intensities) {
    let totalIntensity = 0;
    let rSum = 0, gSum = 0, bSum = 0;

    // Calculate weighted sums for RGB channels
    for (let i = 0; i < wavelengths.length; i++) {
        const colorHex = getColorForWavelength(wavelengths[i]);
        const color = new THREE.Color(colorHex);
        const intensity = intensities[i];

        // Weight the color by the intensity
        rSum += color.r * intensity;
        gSum += color.g * intensity;
        bSum += color.b * intensity;
        totalIntensity += intensity;
    }

    // Normalize the average color by the total intensity
    if (totalIntensity > 0) {
        rSum /= totalIntensity;
        gSum /= totalIntensity;
        bSum /= totalIntensity;
    }

    // Adjust for perceived brightness (gamma correction)
    rSum = Math.pow(rSum, 1 / 2.2);
    gSum = Math.pow(gSum, 1 / 2.2);
    bSum = Math.pow(bSum, 1 / 2.2);

    // Ensure the final color is normalized to the range [0, 1]
    const maxChannel = Math.max(rSum, gSum, bSum);
    if (maxChannel > 0) {
        rSum /= maxChannel;
        gSum /= maxChannel;
        bSum /= maxChannel;
    }

    // Return the color in THREE.Color format
    return new THREE.Color(rSum, gSum, bSum);
}


function displayAverageColorCircle(averageColor) {
    const geometry = new THREE.CircleGeometry(1, 32); // Adjust size as needed
    const material = new THREE.MeshBasicMaterial({ color: averageColor });
    const circle = new THREE.Mesh(geometry, material);

    // Position the circle to the right of the graph
    circle.position.set(15, 3, 0); // Adjust x, y, and z positions as needed

    scene.add(circle);
}


function createAxisWithTicks(axisLength, axisName, unit, position, orientation = 'x', numTicks = 10, maxRadiance = 1) {
    // Check if an existing axis group exists and remove it
    const axisGroupName = orientation === 'x' ? 'xAxisGroup' : 'yAxisGroup';
    const existingAxisGroup = scene.getObjectByName(axisGroupName);
    if (existingAxisGroup) {
        scene.remove(existingAxisGroup);
    }

    const axisGroup = new THREE.Group();
    axisGroup.name = axisGroupName;

    // Create main axis line
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(orientation === 'x' ? axisLength : 0, orientation === 'y' ? axisLength : 0, 0)
    ]);
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const axisLine = new THREE.Line(axisGeometry, axisMaterial);
    axisGroup.add(axisLine);

    // Calculate tick positions and values
    const tickStep = axisLength / numTicks;
    for (let i = 0; i <= numTicks; i++) {
        const tickPos = i * tickStep;

        // Create tick mark
        const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.1, 0),
            new THREE.Vector3(0, 0.1, 0)
        ]);
        const tickLine = new THREE.Line(tickGeometry, axisMaterial);

        if (orientation === 'x') {
            tickLine.position.set(tickPos, 0, 0);
            const wavelengthValue = (tickPos / axisLength) * 4000;
            createLabel(
                `${wavelengthValue.toFixed(0)}${unit}`,
                new THREE.Vector3(tickPos - 0.3, -0.4, 0),
                axisGroup
            );
        } else {
            tickLine.position.set(0, tickPos, 0);
            tickLine.rotation.z = Math.PI / 2;

            // Format y-axis tick labels in scientific notation if needed
            const radianceValue = (tickPos / axisLength) * (maxRadiance / 1e13);
            const formattedValue = radianceValue < 1 ? radianceValue.toExponential(1) : radianceValue.toFixed(1);

            createLabel(
                `${formattedValue}`,
                new THREE.Vector3(-1.5, tickPos - 0.1, 0),  // Adjusted for better positioning
                axisGroup
            );
        }
        axisGroup.add(tickLine);
    }

    // Create axis label (only re-add if it doesn't already exist)
    if (orientation === 'x') {
        createLabel(axisName, new THREE.Vector3(axisLength / 2, -1, 0), axisGroup);
    } else {
        createLabel(axisName, new THREE.Vector3(0.1, axisLength / 2 - 2.3, 0), axisGroup, true);
    }

    axisGroup.position.set(position.x, position.y, position.z);
    scene.add(axisGroup);
}



// Label creation function
function createLabel(text, position, parentGroup = scene, rotate = false, size = 0.2) {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: size,
            height: 0.01,
        });
        textGeometry.computeBoundingBox();
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Center the text
        textMesh.position.x = position.x - (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
        textMesh.position.y = position.y;
        textMesh.position.z = position.z;

        // Rotate if needed
        if (rotate) {
            textMesh.rotation.z = Math.PI / 2;
        }

        parentGroup.add(textMesh);
    });
}


// Create the initial x-axis
createAxisWithTicks(20, 'Wavelength (nm)', '', { x: 0, y: 0, z: 0 }, 'x', 10);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
