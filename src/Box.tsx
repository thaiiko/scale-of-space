import { useFrame } from "@react-three/fiber";
import{ useState, useRef } from "react";
import { Mesh } from "three";

export function Box() {
    const myMesh = useRef<Mesh>(null);
    const [active, setActive] = useState(false);
    const [hovered, setHovered] = useState(false);

    useFrame(({ clock }) => {
        const a = clock.getElapsedTime();
        if (myMesh.current) {
          myMesh.current.rotation.x = a;
        }
    });

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: <explanation> stfu it dowsnt matter </explanation>
        <mesh
            scale={active ? 1.5 : 1}
            onClick={() => setActive(!active)}
            ref={myMesh}
            onPointerOver={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <boxGeometry />
            <meshPhongMaterial color={hovered ? "royalblue": "red"} />
        </mesh>
    );
}

