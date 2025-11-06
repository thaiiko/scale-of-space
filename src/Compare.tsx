import { Canvas, useFrame, useThree } from "@react-three/fiber";
// import { Box } from "./Box";
import { Slider } from "@/components/ui/slider"
import "./styles.css"
import * as THREE from "three";
import earth_texture from "/src/earth-texture.png" // Assuming this is the correct path
import moon_texture from "/src/moon_texture.png"
import { useMemo, useRef, useState, useEffect } from "react";
import { useLoader } from "@react-three/fiber"; // Import useLoader for textures

// --- TYPES ---
type Planet = {
  texture: string
  diameter: number
  selected?: boolean
  speed?: number
}

interface sphereProps {
  planet: Planet
  position: [number, number, number], // Added position prop for better placement
  speedMultiplier: number
}

// --- Sphere Component ---
function Sphere({ planet, position, speedMultiplier }: sphereProps) {
  const [hovered, setHover] = useState(false);
  // useLoader is safe and memoized, which helps performance
  const textureMap = useLoader(THREE.TextureLoader, planet.texture);

  let speed: number = 1; // Changed 'var' to 'let'
  if (planet.speed != null) {
    speed = 1.0 / planet.speed;
  }

  const mesh = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    // Ensure mesh.current exists before trying to access properties
    if (mesh.current) {
      mesh.current.rotation.y += speedMultiplier * speed;
    }
  });

  const radius = planet.diameter / 2;

  return (
    <mesh
      position={position}
      onPointerOver={() => { setHover(true); }}
      onPointerLeave={() => { setHover(false); }}
      ref={mesh}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        map={textureMap}
        color={hovered ? "lightgray" : "white"}
      />
    </mesh>
  );
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

// --- COMPONENT: Compare (Main App) ---
export default function Compare() {
  // Define planet objects (keeping them outside the render for consistency)
  const EARTH_DIAMETER = 12.742;
  const MOON_DIAMETER = 3.4748;
  
  // Removed isContextLost state and related logic to fix the typing error (2322)
  const [speedMultiplier, setSpeedMultiplier] = useState<number[]>([0.00005])

  const earthPlanet: Planet = useMemo(() => ({ texture: earth_texture, diameter: EARTH_DIAMETER, speed: 1 }), [EARTH_DIAMETER]);
  const comparisonPlanet: Planet = useMemo(() => ({ texture: earth_texture, diameter: 0.25 }), []);
  const moon: Planet = useMemo(() => ({ texture: moon_texture, diameter: MOON_DIAMETER, speed: 29.5 }), [MOON_DIAMETER]);
  const speed = speedMultiplier[0];

  return (
    <div className="hello-world">
      <div className="controls-container">
        <h1 className="text-2xl"> Compare the sizes of planets </h1>
        
        <input type="range" min="0.00005" max="1" value="0.00005" readOnly />
        <Slider
          value={speedMultiplier}
          min={0.00005}
          max={1}
          step={0.00001}
          onValueChange={setSpeedMultiplier}
          className="w-[400px] mb-4 slider-isolated"
        />
      </div>

      <Canvas
        className="canvas-isolated"
        camera={{ position: [0, 0, 15], fov: 75 }}
        gl={{ 
          antialias: true, 
          powerPreference: "high-performance", 
          alpha: false,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false
        }}
        dpr={[1, 2]}
      >
        <ContextLossHandler />
        <ambientLight intensity={1.25} />
        <directionalLight position={[10, 10, 5]} intensity={3} />

        <Sphere planet={earthPlanet} position={[-1.5, 0, 0]} speedMultiplier={speed} />
        <Sphere planet={moon} position={[12, 0, 0]} speedMultiplier={speed} />
        <Sphere planet={comparisonPlanet} position={[1.5, 0, 0]} speedMultiplier={speed} />
      </Canvas>
    </div>
  );
}
