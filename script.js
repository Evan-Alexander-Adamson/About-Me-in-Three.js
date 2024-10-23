// Initialize scene, camera, and renderer
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.z = 5;  // Changed from 3 to 5
scene.add(camera);

// Renderer setup with transparency
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearAlpha(0);

// Load gradient texture with error handling
const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load(
    'textures/gradients/3.jpg',
    // onLoad callback
    function(texture) {
        console.log('Texture loaded successfully');
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.encoding = THREE.LinearEncoding; // Added to ensure proper encoding
        texture.needsUpdate = true;
    },
    // onProgress callback
    undefined,
    // onError callback
    function(err) {
        console.error('Error loading texture:', err);
    }
);

// Create material first
const material = new THREE.MeshToonMaterial({ 
    color: '#ffeded',
    gradientMap: gradientTexture
});

// Add ambient light to ensure objects are visible even without texture
const ambientLight = new THREE.AmbientLight('#ffffff', 0.5); // Increased intensity
scene.add(ambientLight);

// Define vertex and fragment shaders
const vertexShader = `
    varying vec2 vUv;
    void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float iTime;
    uniform vec3 iResolution;
    varying vec2 vUv;

    vec3 palette(float d){
        return mix(vec3(0.2,0.7,0.9), vec3(1.0, 0.0, 1.0), d);
    }
    
    vec2 rotate(vec2 p, float a){
        float c = cos(a);
        float s = sin(a);
        return p * mat2(c, s, -s, c);
    }
    
    float map(vec3 p){
        for(int i = 0; i < 8; ++i){
            float t = iTime * 0.2;
            p.xz = rotate(p.xz, t);
            p.xy = rotate(p.xy, t * 1.89);
            p.xz = abs(p.xz);
            p.xz -= 0.5;
        }
        return dot(sign(p), p) / 5.0;
    }
    
    vec4 rm(vec3 ro, vec3 rd){
        float t = 0.0;
        vec3 col = vec3(0.0);
        float d;
        for(float i = 0.0; i < 64.0; i++){
            vec3 p = ro + rd * t;
            d = map(p) * 0.5;
            if(d < 0.02){
                break;
            }
            if(d > 100.0){
                break;
            }
            col += palette(length(p) * 0.1) / (400.0 * d);
            t += d;
        }
        return vec4(col, 1.0 / (d * 100.0));
    }
    
    void main(){
        vec2 fragCoord = vUv * iResolution.xy;
        vec2 uv = (fragCoord - (iResolution.xy / 2.0)) / iResolution.x;
        vec3 ro = vec3(0.0, 0.0, -50.0);
        ro.xz = rotate(ro.xz, iTime);
        vec3 cf = normalize(-ro);
        vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
        vec3 cu = normalize(cross(cf, cs));
        
        vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;
        vec3 rd = normalize(uuv - ro);
        
        vec4 col = rm(ro, rd);
        gl_FragColor = col;
    }
`;

// Adjust the distance between objects
const objectsDistance = 5; // Increased from 4 to 5 for better spacing

// Create meshes with adjusted dimensions and positions
const mesh1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.4, 32, 100), // Adjusted size and segments
    material
);
const mesh2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 1.8), // Slightly smaller cube
    material.clone()
);
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.0, 0.3, 200, 32), // Adjusted size and segments
    material.clone()
);

// Position meshes
mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

// Adjust X positions to be more towards the edges
mesh1.position.x = 2.5;  // Increased from 1.5 to 2.5 (right side)
mesh2.position.x = -2.5; // Decreased from -1.5 to -2.5 (left side)
mesh3.position.x = 2.5;  // Increased from 1.5 to 2.5 (right side)

// Set initial rotations for better orientation
mesh1.rotation.x = Math.PI / 4;
mesh2.rotation.y = Math.PI / 4;
mesh3.rotation.z = Math.PI / 4;

scene.add(mesh1, mesh2, mesh3);

const sectionMeshes = [mesh1, mesh2, mesh3];

// Create shader materials
const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    },
    transparent: true,
    side: THREE.DoubleSide // Add this to make both sides visible
});

const cubeShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: window.cubeVertexShader, // Access from window object
    fragmentShader: window.cubeFragmentShader, // Access from window object
    uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    },
    transparent: true,
    side: THREE.DoubleSide // Add this to make both sides visible
});

const thirdShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: window.thirdVertexShader,
    fragmentShader: window.thirdFragmentShader,
    uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
        iMouse: { value: new THREE.Vector4(0, 0, 0, 0) }
    },
    transparent: true,
    side: THREE.DoubleSide
});

// Assign shader materials
mesh1.material = shaderMaterial;
mesh2.material = cubeShaderMaterial;
mesh3.material = thirdShaderMaterial;

// Lights
const directionalLight = new THREE.DirectionalLight('#ffffff', 2.0); // Increased intensity
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

// Scroll handling
let scrollY = window.scrollY;
let currentSection = 0;

// Calculate the maximum scroll value and store it
const totalDistance = document.documentElement.scrollHeight - window.innerHeight;
const maxScroll = (sectionMeshes.length - 1) * objectsDistance;

// Smooth scroll value for camera movement
let smoothScrollY = scrollY;
const scrollLerp = 0.1; // Adjust this value to control smoothing (0.1 = smooth, 1 = instant)

window.addEventListener('scroll', () => {
    // Clamp scrollY to prevent overscrolling
    scrollY = Math.min(Math.max(window.scrollY, 0), totalDistance);
    
    const newSection = Math.min(
        Math.round(scrollY / window.innerHeight),
        sectionMeshes.length - 1
    );
    
    if(newSection != currentSection) {
        currentSection = newSection;
        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 1.5,
                ease: 'power2.inOut',
                x: '+=6',
                y: '+=3'
            }
        );
    }
});

// Cursor
const cursor = {
    x: 0,
    y: 0
};

window.addEventListener('mousemove', (event) => {
    cursor.x = event.clientX / window.innerWidth - 0.5;
    cursor.y = event.clientY / window.innerHeight - 0.5;
});

// Add iMouse uniform
const mouse = {
    x: 0,
    y: 0,
    z: 0 // To track mouse button status
};

// Update mouse position and button status
window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});
window.addEventListener('mousedown', () => {
    mouse.z = 1.0;
});
window.addEventListener('mouseup', () => {
    mouse.z = 0.0;
});

// Animate
const clock = new THREE.Clock();
let previousTime = 0;

const animate = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // Smooth scroll transition
    smoothScrollY += (scrollY - smoothScrollY) * scrollLerp;

    // Calculate camera target position
    const normalizedScroll = smoothScrollY / totalDistance;
    const targetY = -(normalizedScroll * maxScroll);
    
    // Update camera position with smoothing
    camera.position.y = targetY;

    // Parallax effect
    const parallaxX = cursor.x * 0.5;
    const parallaxY = -cursor.y * 0.5;
    
    // Apply parallax only to X-axis at the bottom
    camera.position.x += (parallaxX - camera.position.x) * 5 * deltaTime;
    
    // Apply Y parallax only when not at the bottom
    if (normalizedScroll < 0.99) { // Add threshold to prevent jitter
        camera.position.y += parallaxY * 0.5; // Reduced parallax effect
    }

    // Update meshes rotation
    for(const mesh of sectionMeshes) {
        mesh.rotation.x += deltaTime * 0.1;
        mesh.rotation.y += deltaTime * 0.12;
    }

    // Update shader uniforms
    mesh1.material.uniforms.iTime.value = elapsedTime;
    mesh1.material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);

    cubeShaderMaterial.uniforms.iTime.value = elapsedTime;
    cubeShaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);

    thirdShaderMaterial.uniforms.iTime.value = elapsedTime;
    thirdShaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
    thirdShaderMaterial.uniforms.iMouse.value.set(mouse.x, mouse.y, mouse.z, 0);

    // Render
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
};

animate();

// Handle resize
window.addEventListener('resize', () => {
    // Update sizes
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update shader resolutions
    mesh1.material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
    cubeShaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
    thirdShaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
});
