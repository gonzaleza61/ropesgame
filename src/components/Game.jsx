import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Raycaster } from "three";
import Joystick from "./Joystick";

function Game({ character, onWin, movement, isAttacking }) {
  const playerRef = useRef();
  const vanRef = useRef();
  const cameraRef = useRef({ x: 0, y: 5, z: 10 });
  const [grapplePoint, setGrapplePoint] = useState(null);
  const [isGrappling, setIsGrappling] = useState(false);
  const [ropeCooldown, setRopeCooldown] = useState(false);
  const raycaster = new Raycaster();
  const ropeRef = useRef();

  // Rope lengths for different characters
  const ropeLength = {
    fabian: 10, // Increased range
    rica: 7, // Increased range
    kris: 4, // Increased range
  };

  // Rope speeds for different characters
  const ropeSpeed = {
    fabian: 0.15, // Slower but longer range
    rica: 0.2, // Medium speed and range
    kris: 0.3, // Faster but shorter range
  };

  // Set initial player position and rotation
  useEffect(() => {
    if (playerRef.current) {
      // Position player at origin
      playerRef.current.position.set(0, 1, 0);
      // Make player face forward
      playerRef.current.rotation.y = 0;
    }
  }, []);

  // Handle rope hit and grappling
  const handleRopeHit = (position) => {
    setGrapplePoint(position);
    setIsGrappling(true);

    // Add rope cooldown
    setRopeCooldown(true);
    setTimeout(() => {
      setRopeCooldown(false);
    }, 1000); // 1 second cooldown
  };

  useFrame((state) => {
    if (playerRef.current) {
      // Rope hit detection
      if (isAttacking && !isGrappling && !ropeCooldown) {
        const playerPos = playerRef.current.position;
        const direction = new Vector3(
          -Math.sin(playerRef.current.rotation.y),
          0,
          -Math.cos(playerRef.current.rotation.y)
        );

        raycaster.set(playerPos, direction);
        const intersects = raycaster
          .intersectObjects(state.scene.children, true)
          .filter((hit) => hit.object.name === "pipe");

        if (
          intersects.length > 0 &&
          intersects[0].distance <= ropeLength[character.id]
        ) {
          handleRopeHit(intersects[0].point);
        }
      }

      // Grappling movement
      if (isGrappling && grapplePoint) {
        const playerPos = playerRef.current.position;
        const grappleDir = new Vector3()
          .subVectors(grapplePoint, playerPos)
          .normalize();

        // Use character-specific rope speed
        const speed = ropeSpeed[character.id];
        playerRef.current.position.x += grappleDir.x * speed;
        playerRef.current.position.z += grappleDir.z * speed;

        // Rotate player to face grapple point
        const targetAngle = Math.atan2(grappleDir.x, grappleDir.z);
        playerRef.current.rotation.y = targetAngle;

        // Stop grappling when close enough
        if (playerPos.distanceTo(grapplePoint) < 1) {
          setIsGrappling(false);
          setGrapplePoint(null);
        }
      } else if (movement.x !== 0 || movement.z !== 0) {
        // Normal movement when not grappling
        const moveSpeed = 0.08;
        playerRef.current.position.x += movement.x * moveSpeed;
        playerRef.current.position.z += movement.z * moveSpeed;

        const angle = Math.atan2(movement.x, movement.z);
        playerRef.current.rotation.y = angle;
      }

      // Update camera to follow player from behind and above
      const playerPos = playerRef.current.position;
      const targetCameraPos = new Vector3(
        playerPos.x,
        playerPos.y + 8, // Higher camera
        playerPos.z - 12 // Camera further back
      );

      // Smooth camera follow
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
        {/* Main pipes - add name for raycaster */}
        {[...Array(8)].map((_, i) => (
          <group key={i} position={[i * 4 - 16, 0, 0]}>
            <mesh position={[0, 3, 0]} name="pipe">
              <cylinderGeometry args={[0.3, 0.3, 6]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh
              position={[0, 6, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              name="pipe"
            >
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

        {/* Improved rope visualization */}
        {(isAttacking || isGrappling) && (
          <group>
            {/* Rope */}
            <mesh
              ref={ropeRef}
              position={[0, 0, -ropeLength[character.id] / 2]}
              rotation={[0, playerRef.current?.rotation.y || 0, 0]}
            >
              <cylinderGeometry
                args={[
                  0.05,
                  0.05,
                  isGrappling && grapplePoint
                    ? playerRef.current.position.distanceTo(grapplePoint)
                    : ropeLength[character.id],
                ]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <meshStandardMaterial color={character.color} />
            </mesh>

            {/* Rope hook/end */}
            {isGrappling && grapplePoint && (
              <mesh position={grapplePoint}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={character.color} />
              </mesh>
            )}
          </group>
        )}
      </group>

      {/* Van - moved in front of starting position */}
      <group ref={vanRef} position={[0, 1, -15]} rotation={[0, Math.PI, 0]}>
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
