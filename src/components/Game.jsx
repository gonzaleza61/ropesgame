import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import Joystick from "./Joystick";

function Game({ character, onWin, movement, isAttacking }) {
  const playerRef = useRef();
  const vanRef = useRef();
  const ropeRef = useRef();

  // Rope lengths for different characters
  const ropeLength = {
    fabian: 6,
    rica: 4,
    kris: 2,
  };

  useFrame((state) => {
    if (playerRef.current) {
      // Use the movement prop directly
      playerRef.current.position.x += movement.x * 0.1;
      playerRef.current.position.z += movement.z * 0.1;

      // Update camera to follow player
      const playerPos = playerRef.current.position;
      state.camera.position.lerp(
        new Vector3(playerPos.x, playerPos.y + 5, playerPos.z + 10),
        0.1
      );
      state.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);

      // Check distance to van
      if (vanRef.current) {
        const distance = playerRef.current.position.distanceTo(
          vanRef.current.position
        );
        if (distance < 2) onWin();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Background Refinery */}
      <group position={[0, 0, -20]}>
        {/* Main pipes */}
        {[...Array(8)].map((_, i) => (
          <group key={i} position={[i * 4 - 16, 0, 0]}>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 6]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 2]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
          </group>
        ))}
        {/* Storage tanks */}
        {[...Array(4)].map((_, i) => (
          <mesh key={i} position={[i * 6 - 9, 2, -5]}>
            <cylinderGeometry args={[2, 2, 4]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        ))}
      </group>

      {/* Player */}
      <group ref={playerRef} position={[0, 1, 0]}>
        {/* Body - made wider */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 0.8, 0.8]} />
          <meshStandardMaterial color="#8B4513" /> {/* Brown color */}
        </mesh>
        {/* Head - made larger */}
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Arms - adjusted position for wider body */}
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.2, 0.6, 0.2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Attack Rope */}
        {isAttacking && (
          <mesh position={[0, 0, -ropeLength[character.id] / 2]}>
            <cylinderGeometry
              args={[0.05, 0.05, ropeLength[character.id]]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <meshStandardMaterial color={character.color} />
          </mesh>
        )}
      </group>

      {/* Van */}
      <group ref={vanRef} position={[10, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Van body */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2, 1.5, 4]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Van cabin */}
        <mesh position={[0, 0.75, 1.5]}>
          <boxGeometry args={[2, 1, 1]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
        {/* Wheels */}
        {[
          [-0.8, -0.5, -1],
          [0.8, -0.5, -1],
          [-0.8, -0.5, 1],
          [0.8, -0.5, 1],
        ].map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry
              args={[0.3, 0.3, 0.2, 16]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <meshStandardMaterial color="black" />
          </mesh>
        ))}
      </group>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>
    </>
  );
}

export default Game;
