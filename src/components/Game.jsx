import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import Joystick from "./Joystick";

function Game({ character, onWin, movement, rotation, isAttacking }) {
  const playerRef = useRef();
  const vanRef = useRef();
  const cameraRef = useRef({ x: 0, y: 5, z: 10 });

  // Rope lengths for different characters
  const ropeLength = {
    fabian: 6,
    rica: 4,
    kris: 2,
  };

  // Set initial player position and rotation
  useEffect(() => {
    if (playerRef.current) {
      // Position player in front of the van
      playerRef.current.position.set(-5, 1, 0);
      // Make player face the van initially
      playerRef.current.rotation.y = -Math.PI / 2;
    }
  }, []);

  useFrame((state) => {
    if (playerRef.current) {
      // Move player in the direction they're facing when using movement joystick
      const angle = playerRef.current.rotation.y;
      const moveX = movement.x * Math.cos(angle) - movement.z * Math.sin(angle);
      const moveZ = movement.x * Math.sin(angle) + movement.z * Math.cos(angle);

      // Reduce movement speed from 0.1 to 0.05
      playerRef.current.position.x += moveX * 0.05;
      playerRef.current.position.z += moveZ * 0.05;

      // Rotate player based on right joystick
      if (rotation.x !== 0 || rotation.z !== 0) {
        const targetAngle = Math.atan2(rotation.x, rotation.z);
        // Smooth rotation - reduce rotation speed from 0.1 to 0.05
        const currentAngle = playerRef.current.rotation.y;
        const angleDiff = targetAngle - currentAngle;
        playerRef.current.rotation.y += angleDiff * 0.05;
      }

      // Update camera position with smooth follow
      const playerPos = playerRef.current.position;
      const targetCameraPos = new Vector3(
        playerPos.x - Math.sin(playerRef.current.rotation.y) * 10,
        playerPos.y + 5,
        playerPos.z - Math.cos(playerRef.current.rotation.y) * 10
      );

      // Reduce camera follow speed from 0.1 to 0.05
      cameraRef.current.x += (targetCameraPos.x - cameraRef.current.x) * 0.05;
      cameraRef.current.y += (targetCameraPos.y - cameraRef.current.y) * 0.05;
      cameraRef.current.z += (targetCameraPos.z - cameraRef.current.z) * 0.05;

      state.camera.position.set(
        cameraRef.current.x,
        cameraRef.current.y,
        cameraRef.current.z
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

  const renderCharacterModel = () => {
    switch (character.id) {
      case "fabian":
      case "rica":
        return (
          <>
            {/* Slim Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.6, 0.8, 0.4]} />
              <meshStandardMaterial color="#FFE4E1" />{" "}
              {/* White-ish skin tone */}
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="#FFE4E1" />
            </mesh>
            {/* Gold Hat */}
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2]} />
              <meshStandardMaterial color="#FFD700" /> {/* Gold color */}
            </mesh>
            {/* Slim Arms */}
            <mesh position={[-0.35, 0, 0]}>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color="#FFE4E1" />
            </mesh>
            <mesh position={[0.35, 0, 0]}>
              <boxGeometry args={[0.15, 0.5, 0.15]} />
              <meshStandardMaterial color="#FFE4E1" />
            </mesh>
          </>
        );
      case "kris":
        return (
          <>
            {/* Fat Body */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 0.8, 0.8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.3]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* Fat Arms */}
            <mesh position={[-0.6, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0.6, 0, 0]}>
              <boxGeometry args={[0.2, 0.6, 0.2]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
          </>
        );
    }
  };

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
      <group ref={playerRef}>
        {renderCharacterModel()}

        {/* Attack Rope - now follows player rotation */}
        {isAttacking && (
          <mesh
            position={[0, 0, -ropeLength[character.id] / 2]}
            rotation={[0, playerRef.current?.rotation.y || 0, 0]}
          >
            <cylinderGeometry
              args={[0.05, 0.05, ropeLength[character.id]]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <meshStandardMaterial color={character.color} />
          </mesh>
        )}
      </group>

      {/* Van - adjusted to fix z-fighting and face player */}
      <group ref={vanRef} position={[10, 1, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Van body */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2, 1.5, 4]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Van cabin - adjusted position and added depth bias */}
        <mesh position={[0, 0.75, 1.5]} renderOrder={1}>
          <boxGeometry args={[2, 1, 1]} />
          <meshStandardMaterial
            color="lightblue"
            transparent
            opacity={0.8}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
          />
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
