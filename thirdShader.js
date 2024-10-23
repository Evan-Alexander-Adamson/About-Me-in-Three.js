// Vertex Shader for the Third Object
const thirdVertexShader = `
    varying vec2 vUv;
    void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment Shader for the Third Object
const thirdFragmentShader = `
    uniform float iTime;
    uniform vec3 iResolution;
    uniform vec4 iMouse;
    varying vec2 vUv;

    // 2D rotation function
    mat2 rot2D(float a) {
        return mat2(cos(a), -sin(a), sin(a), cos(a));
    }
    
    vec3 palette(float t) {
        return 0.5 + 0.5 * cos(12.28318 * (t + vec3(0.2, 0.316, 0.657)));
    }
    
    // Signed Distance Function for Sphere
    float sdSphere(vec3 p, float s) {
        return length(p) - s;
    }

    // Signed Distance Function for Box
    float sdBox(vec3 p, vec3 s) {
        vec3 q = abs(p) - s;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }
    
    // Scene distance
    float map(vec3 p) {
        p.z += iTime * 0.5; // Forward movement
        
        // Space repetition
        p.xy = fract(p.xy) - 0.5; // Spacing
        p.z = mod(p.z, 0.25) - 0.225;
        
        return min(sdSphere(p, 0.12), sdBox(p, vec3(0.1)));
    }
    
    void main(){
        vec2 fragCoord = vUv * iResolution.xy;
        vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
        vec2 m = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
        
        // Default circular motion
        if (iMouse.z <= 0.0) m = vec2(cos(iTime * 0.2), sin(iTime * 0.2));
    
        // Initialization
        vec3 ro = vec3(0.0, 0.0, -3.0);           // Ray origin
        vec3 rd = normalize(vec3(uv, 1.0));      // Ray direction
        vec3 col = vec3(0.0);                    // Final pixel color
    
        float t = 0.0; // Total distance traveled
    
        int i; // Raymarching loop counter
        for(i = 0; i < 80; i++) {
            vec3 p = ro + rd * t; // Position along the ray
            
            p.xy *= rot2D(t * 0.25 * m.x);     // Rotate ray around z-axis
    
            p.y += cos(t * (m.y + 1.0) * 0.6) * 0.65;  // Wiggle ray
    
            float d = map(p);     // Current distance to the scene
    
            t += d;               // "March" the ray
    
            if(d < 0.001 || t > 100.0) break; // Early termination
        }
    
        // Coloring
        col = palette(t * 0.04 + float(i) * 0.005);
         
        gl_FragColor = vec4(col, 1.0); // Changed from fragColor to gl_FragColor
    }
`;

// Assign shaders to global window object for accessibility
window.thirdVertexShader = thirdVertexShader;
window.thirdFragmentShader = thirdFragmentShader;
