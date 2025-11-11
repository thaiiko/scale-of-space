import { Canvas, useFrame, useThree } from "@react-three/fiber";
import "./styles.css"
import { useLoader } from "@react-three/fiber"; // Import useLoader for textures
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import earth_texture from "/src/earth-texture.png" // Assuming this is the correct path
import moon_texture from "/src/moon_texture.png"
import sun_texture from "/src/sun_texture.jpg"
import neptune_texture from "/src/neptune_texure.jpg"
import uranus_texture from "/src/uranus_texture.jpg"
import saturn_texture from "/src/saturn_texture.jpg"
import jupiter_texture from "/src/jupiter_texture.png"
import mars_texture from "/src/mars_texture.jpg"
import venus_texture from "/src/venus_texture.jpg"
import mercury_texture from "/src/mercury_texture.jpg"

// --- TYPES ---
type Planet = {
  name: string
  texture?: string
  color?: string
  diameter: number
  selected?: boolean
  speed?: number
}

interface sphereProps {
  planet: Planet
  position: [number, number, number], // Added position prop for better placement
  speedMultiplier: number
}

// --- Sphere Component with Texture ---
function SphereWithTexture({ planet, position, speedMultiplier }: sphereProps) {
  const [hovered, setHover] = useState(false);
  const textureMap = useLoader(THREE.TextureLoader, planet.texture!);

  let speed: number = 1;
  if (planet.speed != null) {
    speed = 1.0 / planet.speed;
  }

  const mesh = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += speedMultiplier * speed;
    }
  });

  const radius = planet.diameter / 2;
  const baseColor = planet.color || "white";
  const hoverColor = hovered ? "lightgray" : baseColor;
  
  // Use more segments for larger objects to ensure proper rendering
  const segments = radius > 100 ? 64 : 32;

  return (
    <mesh
      position={position}
      onPointerOver={() => { setHover(true); }}
      onPointerLeave={() => { setHover(false); }}
      ref={mesh}
    >
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        map={textureMap}
        color={hoverColor}
      />
    </mesh>
  );
}

// --- Sphere Component without Texture ---
function SphereWithoutTexture({ planet, position, speedMultiplier }: sphereProps) {
  const [hovered, setHover] = useState(false);

  let speed: number = 1;
  if (planet.speed != null) {
    speed = 1.0 / planet.speed;
  }

  const mesh = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.y += speedMultiplier * speed;
    }
  });

  const radius = planet.diameter / 2;
  const baseColor = planet.color || "white";
  const hoverColor = hovered ? "lightgray" : baseColor;
  
  // Use more segments for larger objects to ensure proper rendering
  const segments = radius > 100 ? 64 : 32;

  return (
    <mesh
      position={position}
      onPointerOver={() => { setHover(true); }}
      onPointerLeave={() => { setHover(false); }}
      ref={mesh}
    >
      <sphereGeometry args={[radius, segments, segments]} />
      <meshStandardMaterial
        color={hoverColor}
      />
    </mesh>
  );
}

// --- Sphere Component (wrapper) ---
function Sphere({ planet, position, speedMultiplier }: sphereProps) {
  if (planet.texture) {
    return <SphereWithTexture planet={planet} position={position} speedMultiplier={speedMultiplier} />;
  }
  return <SphereWithoutTexture planet={planet} position={position} speedMultiplier={speedMultiplier} />;
}

// --- ContextLossHandler Component ---
function ContextLossHandler() {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting to restore...');
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored successfully.');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return null;
}

// --- CameraController Component ---
function CameraController({ planets, positions }: { planets: Planet[], positions: [number, number, number][] }) {
  const { camera } = useThree();

  useEffect(() => {
    if (planets.length === 0) {
      camera.position.set(0, 0, 15);
      return;
    }

    // Calculate the bounding box of all visible planets
    let maxRadius = 0;
    let maxDistance = 0;

    planets.forEach((planet, index) => {
      const radius = planet.diameter / 2;
      const pos = positions[index];
      const distance = Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);
      
      maxRadius = Math.max(maxRadius, radius);
      maxDistance = Math.max(maxDistance, distance + radius);
    });

    // Set camera position to fit all planets with some padding
    // For single planet, use a larger multiplier to ensure adequate distance
    const padding = planets.length === 1 ? 4.0 : 1.5;
    const cameraDistance = Math.max(maxDistance * padding, maxRadius * 4);
    
    // Ensure camera is far enough for very large objects
    // Also update camera's near/far planes to accommodate large objects
    const near = Math.max(0.1, maxRadius * 0.01);
    const far = Math.max(10000, maxRadius * 10);
    camera.near = near;
    camera.far = far;
    
    camera.position.set(0, 0, cameraDistance);
    camera.updateProjectionMatrix();
  }, [camera, planets, positions]);

  return null;
}

export default function Compare() {
  // Initial speed value (e.g., 0.00005) is now a single number for better control
  const INITIAL_SPEED = 0.00005;

  // State holds the single speed multiplier value
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(INITIAL_SPEED);

  // All solar system planets with diameters in thousands of km and colors
  const allPlanets: Planet[] = useMemo(() => [
    { name: "Mercury", diameter: 4.879, texture: mercury_texture, speed: 58.6 },
    { name: "Venus", diameter: 12.104, texture: venus_texture, speed: 243 },
    { name: "Earth", diameter: 12.742, texture: earth_texture, speed: 1 },
    { name: "Mars", diameter: 6.779, texture: mars_texture, speed: 1.03 },
    { name: "Jupiter", diameter: 139.820, texture: jupiter_texture, speed: 0.41 },
    { name: "Saturn", diameter: 116.460, texture: saturn_texture, speed: 0.45 },
    { name: "Uranus", diameter: 50.724, texture: uranus_texture, speed: 0.72 },
    { name: "Neptune", diameter: 49.244, texture: neptune_texture, speed: 0.67 },
    { name: "Moon", diameter: 3.4748, texture: moon_texture, speed: 29.5 },
    { name: "Sun", diameter: 1390.000, texture: sun_texture, speed: 25}
  ], []);

  // State to track which planets are visible
  const [visiblePlanets, setVisiblePlanets] = useState<Set<string>>(new Set(["Earth", "Moon"]));

  // Toggle planet visibility
  const togglePlanet = useCallback((planetName: string) => {
    setVisiblePlanets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planetName)) {
        newSet.delete(planetName);
      } else {
        newSet.add(planetName);
      }
      return newSet;
    });
  }, []);

  // Filter visible planets and calculate positions
  const activePlanets = useMemo(() => {
    return allPlanets.filter((p) => visiblePlanets.has(p.name));
  }, [allPlanets, visiblePlanets]);

  // Calculate positions for planets in a grid layout that prevents overlaps
  const planetPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    
    if (activePlanets.length === 0) {
      return positions;
    }
    
    // Calculate radii for all planets
    const radii = activePlanets.map(planet => planet.diameter / 2);
    const maxRadius = Math.max(...radii);
    
    // Calculate spacing based on the largest planet plus padding
    // Use 1.5x the largest diameter as minimum spacing to ensure no overlap
    const baseSpacing = maxRadius * 3;
    
    // For a grid layout, calculate optimal number of columns
    const cols = Math.ceil(Math.sqrt(activePlanets.length));
    
    // Store positions with their radii to check for overlaps
    const placedPlanets: Array<{ pos: [number, number, number], radius: number }> = [];
    
    activePlanets.forEach((_, index) => {
      const radius = radii[index];
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      // Start with grid position
      let offsetX = (col - (cols - 1) / 2) * baseSpacing;
      let offsetY = -(row - (activePlanets.length / cols - 1) / 2) * baseSpacing;
      
      // Check for overlaps with already placed planets and adjust
      let attempts = 0;
      const maxAttempts = 100;
      
      while (attempts < maxAttempts) {
        let hasOverlap = false;
        
        for (const placed of placedPlanets) {
          const dx = offsetX - placed.pos[0];
          const dy = offsetY - placed.pos[1];
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = radius + placed.radius + 2; // Add 2 units padding
          
          if (distance < minDistance) {
            hasOverlap = true;
            // Move away from overlapping planet
            const angle = Math.atan2(dy, dx);
            const moveDistance = minDistance - distance + 1;
            offsetX += Math.cos(angle) * moveDistance;
            offsetY += Math.sin(angle) * moveDistance;
            break;
          }
        }
        
        if (!hasOverlap) {
          break;
        }
        
        attempts++;
      }
      
      const position: [number, number, number] = [offsetX, offsetY, 0];
      positions.push(position);
      placedPlanets.push({ pos: position, radius });
    });
    
    return positions;
  }, [activePlanets]);

  // The speed variable is simply the state value now
  const speed = speedMultiplier; 

  // Utility function to handle slider change - memoized to prevent re-renders
  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeedMultiplier(parseFloat(e.target.value));
  }, []);

  // Memoize Canvas props to prevent unnecessary remounts
  // Calculate max diameter to set appropriate camera near/far planes
  const maxDiameter = useMemo(() => {
    return Math.max(...allPlanets.filter(p => visiblePlanets.has(p.name)).map(p => p.diameter), 0);
  }, [allPlanets, visiblePlanets]);
  
  const cameraConfig = useMemo(() => {
    // Adjust near/far planes based on the largest visible object
    const maxRadius = maxDiameter / 2;
    const near = Math.max(0.1, maxRadius * 0.01);
    const far = Math.max(10000, maxRadius * 10);
    return { 
      position: [0, 0, 15] as [number, number, number], 
      fov: 75,
      near,
      far
    };
  }, [maxDiameter]);
  
  const glConfig = useMemo(() => ({
    antialias: true,
    powerPreference: "high-performance" as const,
    alpha: false,
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false,
  }), []);

  return (
    <div className="hello-world">
      <div className="controls-container">
        <h1 className="text-2xl"> Compare the sizes of planets </h1>
        <div className="slider-container">
          <label htmlFor="speed-slider" className="slider-label">
            Speed Multiplier: {speedMultiplier.toFixed(6)}
          </label>
          <input
            type="range"
            id="speed-slider"
            className="native-slider slider-isolated"
            min={0.00005}
            max={1}
            step={0.00001}
            value={speedMultiplier}
            onChange={handleSpeedChange}
            aria-label="Speed multiplier"
          />
        </div>
        <div className="planets-ui" style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
          {allPlanets.map((planet) => (
            <button
              key={planet.name}
              onClick={() => togglePlanet(planet.name)}
              style={{
                padding: "8px 16px",
                backgroundColor: visiblePlanets.has(planet.name) ? "#3b82f6" : "#e5e7eb",
                color: visiblePlanets.has(planet.name) ? "white" : "black",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              {planet.name}
            </button>
          ))}
        </div>
      </div>
      <Canvas
        key="main-canvas"
        className="canvas-isolated"
        camera={cameraConfig}
        gl={glConfig}
        dpr={[1, 2]}
        frameloop="always"
      >
        <ContextLossHandler />
        <CameraController planets={activePlanets} positions={planetPositions} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[10, 10, 5]} intensity={3} />
        {activePlanets.map((planet, index) => (
          <Sphere 
            key={planet.name}
            planet={planet} 
            position={planetPositions[index]} 
            speedMultiplier={speed} 
          />
        ))}
      </Canvas>
    </div>
  );
}
