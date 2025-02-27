import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Vector3,
  Raycaster,
  MeshBasicMaterial,
  CylinderGeometry,
  Euler,
} from "three";
import Joystick from "./Joystick";
import { Text, Sky } from "@react-three/drei";

function Game({
  character,
  onWin,
  onPottyReset,
  onAlcoholRefill,
  onGameOver,
  movement,
  isAttacking,
  energyDrinkActive,
}) {
  const playerRef = useRef();
  const vanRef = useRef();
  const cameraRef = useRef({ x: 0, y: 5, z: 10 });
  const [grapplePoint, setGrapplePoint] = useState(null);
  const [isGrappling, setIsGrappling] = useState(false);
  const [ropeCooldown, setRopeCooldown] = useState(false);
  const [pottyLocations] = useState([
    [-8, 1, -5],
    [8, 1, -10],
    [0, 1, -20],
  ]);
  const raycaster = new Raycaster();
  const ropeRef = useRef();
  const [alcoholLevel, setAlcoholLevel] = useState(null);
  const [barLocation] = useState([12, 1, -15]); // Position of the bar
  const [ropeProjectile, setRopeProjectile] = useState(null);
  const [ropeProjectileDirection, setRopeProjectileDirection] = useState(null);
  const [ropeProjectileDistance, setRopeProjectileDistance] = useState(0);
  const [paulPosition, setPaulPosition] = useState(new Vector3(15, 0, -8));
  const [paulDirection, setPaulDirection] = useState(new Vector3(0, 0, 1));
  const [paulRotation, setPaulRotation] = useState(
    new Euler(0, -Math.PI / 4, 0)
  );
  const [paulQuote, setPaulQuote] = useState("");
  const [showPaulQuote, setShowPaulQuote] = useState(false);
  const paulRef = useRef();
  const paulChangeDirectionTimer = useRef(0);

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

  // Create rope projectile materials and geometries
  const ropeMaterial = useMemo(
    () => new MeshBasicMaterial({ color: "#8B4513" }),
    []
  );
  const ropeGeometry = useMemo(
    () => new CylinderGeometry(0.03, 0.03, 1, 8),
    []
  );
  const ropeHeadGeometry = useMemo(
    () => new CylinderGeometry(0.1, 0, 0.2, 8),
    []
  );
  const ropeHeadMaterial = useMemo(
    () => new MeshBasicMaterial({ color: "#555555" }),
    []
  );

  // Add this function to customize character appearance based on selected character
  const getCharacterColors = () => {
    const colors = {
      body: character.color,
      hat: "#FFD700", // Default gold hat
    };

    // Customize Rica's hat to be gray
    if (character.id === "rica") {
      colors.hat = "#95a5a6"; // Gray hat for Rica
    }

    return colors;
  };

  // Use this in the player character rendering
  const characterColors = getCharacterColors();

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

  // Check if player is near the bar
  useEffect(() => {
    const checkBarProximity = () => {
      if (playerRef.current) {
        const playerPos = playerRef.current.position;
        const barPos = new Vector3(
          barLocation[0],
          barLocation[1],
          barLocation[2]
        );

        // If player is close to the bar, refill alcohol
        if (playerPos.distanceTo(barPos) < 3) {
          onAlcoholRefill();
        }
      }
    };

    const interval = setInterval(checkBarProximity, 500);
    return () => clearInterval(interval);
  }, [barLocation, onAlcoholRefill]);

  // Update the handleAttack function to shoot a rope projectile
  const handleRopeShoot = () => {
    if (playerRef.current && !ropeProjectile && !ropeCooldown) {
      const playerPos = playerRef.current.position;
      const direction = new Vector3(
        Math.sin(playerRef.current.rotation.y),
        0,
        Math.cos(playerRef.current.rotation.y)
      );

      setRopeProjectile(new Vector3(playerPos.x, playerPos.y, playerPos.z));
      setRopeProjectileDirection(direction);
      setRopeProjectileDistance(0);
      setRopeCooldown(true);

      setTimeout(() => {
        setRopeCooldown(false);
        setRopeProjectile(null);
      }, 1000);
    }
  };

  // Add this function to handle Paul's movement
  const updatePaulMovement = useCallback(
    (delta) => {
      if (!paulRef.current) return;

      // Update direction change timer
      paulChangeDirectionTimer.current += delta;

      // Change direction randomly every 3-6 seconds
      if (paulChangeDirectionTimer.current > 3 + Math.random() * 3) {
        paulChangeDirectionTimer.current = 0;

        // Generate a new random direction
        const angle = Math.random() * Math.PI * 2;
        const newDirection = new Vector3(Math.sin(angle), 0, Math.cos(angle));
        setPaulDirection(newDirection);

        // Update rotation to match direction
        const newRotation = new Euler(0, angle, 0);
        setPaulRotation(newRotation);

        // Show a random quote
        const randomQuote =
          PAUL_QUOTES[Math.floor(Math.random() * PAUL_QUOTES.length)];
        setPaulQuote(randomQuote);
        setShowPaulQuote(true);

        // Hide quote after 2 seconds
        setTimeout(() => {
          setShowPaulQuote(false);
        }, 2000);
      }

      // Move Paul in the current direction
      const newPosition = new Vector3().copy(paulPosition);
      newPosition.x += paulDirection.x * PAUL_SPEED;
      newPosition.z += paulDirection.z * PAUL_SPEED;

      // Keep Paul within bounds
      const BOUND = 40;
      if (Math.abs(newPosition.x) > BOUND) {
        paulDirection.x *= -1;
        newPosition.x = paulPosition.x + paulDirection.x * PAUL_SPEED;
      }
      if (Math.abs(newPosition.z) > BOUND) {
        paulDirection.z *= -1;
        newPosition.z = paulPosition.z + paulDirection.z * PAUL_SPEED;
      }

      setPaulPosition(newPosition);
    },
    [paulPosition, paulDirection]
  );

  // Add this function to check for collision with Paul's truck
  const checkPaulCollision = useCallback(() => {
    if (!playerRef.current || !paulRef.current) return;

    const playerPos = playerRef.current.position;
    const truckPos = paulPosition;

    // Calculate distance (accounting for truck size)
    const distance = Math.sqrt(
      Math.pow(playerPos.x - truckPos.x, 2) +
        Math.pow(playerPos.z - truckPos.z, 2)
    );

    // If player is too close to the truck, game over
    if (distance < 4) {
      // Game over - hit by truck
      onGameOver("truck");
    }
  }, [playerRef, paulPosition, onGameOver]);

  useFrame((state, delta) => {
    if (playerRef.current) {
      // Rope hit detection
      if (isAttacking && !isGrappling && !ropeCooldown) {
        const playerPos = playerRef.current.position;
        // Fix rope direction to match player facing direction
        const direction = new Vector3(
          Math.sin(playerRef.current.rotation.y),
          0,
          Math.cos(playerRef.current.rotation.y)
        );

        raycaster.set(playerPos, direction);
        const intersects = raycaster
          .intersectObjects(state.scene.children, true)
          .filter(
            (hit) =>
              hit.object.name === "pipe" || hit.object.name === "grapple-point"
          );

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
        const baseSpeed = 0.08;
        const moveSpeed = energyDrinkActive ? baseSpeed * 2 : baseSpeed; // Double speed when energy drink is active

        // Fix controls - don't invert
        playerRef.current.position.x += movement.x * moveSpeed;
        playerRef.current.position.z += movement.z * moveSpeed;

        const angle = Math.atan2(movement.x, movement.z);
        playerRef.current.rotation.y = angle;
      }

      // Fix camera to follow behind player in the direction they're facing
      const playerPos = playerRef.current.position;
      const playerAngle = playerRef.current.rotation.y;

      // Position camera behind player based on facing direction
      const cameraDistance = 12;
      const cameraHeight = 8;
      const targetCameraPos = new Vector3(
        playerPos.x - Math.sin(playerAngle) * cameraDistance,
        playerPos.y + cameraHeight,
        playerPos.z - Math.cos(playerAngle) * cameraDistance
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

      // Check for porta-potty collision
      if (playerRef.current) {
        const playerPos = playerRef.current.position;

        // Check each porta-potty
        pottyLocations.forEach((pottyPos) => {
          const distance = Math.sqrt(
            Math.pow(playerPos.x - pottyPos[0], 2) +
              Math.pow(playerPos.z - pottyPos[2], 2)
          );

          if (distance < 1.5) {
            onPottyReset();
          }
        });
      }

      // Handle rope projectile movement
      if (ropeProjectile && ropeProjectileDirection) {
        // Move rope projectile forward
        const speed = 0.5; // Adjust speed as needed
        ropeProjectile.x += ropeProjectileDirection.x * speed;
        ropeProjectile.z += ropeProjectileDirection.z * speed;

        setRopeProjectileDistance((prev) => prev + speed);

        // Check if rope hit something
        const rayStart = new Vector3(
          playerRef.current.position.x,
          playerRef.current.position.y,
          playerRef.current.position.z
        );

        raycaster.set(rayStart, ropeProjectileDirection);
        const intersects = raycaster
          .intersectObjects(state.scene.children, true)
          .filter(
            (hit) =>
              hit.object.name === "pipe" ||
              hit.object.name === "grapple-point" ||
              hit.object.name === "building"
          );

        if (
          intersects.length > 0 &&
          intersects[0].distance <= ropeProjectileDistance
        ) {
          handleRopeHit(intersects[0].point);
          setRopeProjectile(null);
        }

        // Check if rope has traveled its maximum distance
        if (ropeProjectileDistance >= ropeLength[character.id]) {
          setRopeProjectile(null);
        }
      }

      // Update Paul's movement
      updatePaulMovement(delta);

      // Check for collision with Paul's truck
      checkPaulCollision();
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
              <meshStandardMaterial color={characterColors.body} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.2]} />
              <meshStandardMaterial color="#FFE4E1" />
            </mesh>
            {/* Hat */}
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 0.2]} />
              <meshStandardMaterial
                color={characterColors.hat}
                metalness={0.8}
                roughness={0.2}
              />
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

      {/* Add realistic sky */}
      <Sky
        distance={450000}
        sunPosition={[0, 1, 0]}
        inclination={0.6}
        azimuth={0.25}
      />

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

        {/* Additional grapple points */}
        {[
          [-5, 4, -10],
          [5, 4, -10],
          [-10, 3, -5],
          [10, 3, -5],
          [0, 5, -15],
          [-8, 6, -12],
          [8, 6, -12],
          [-3, 7, -8],
          [3, 7, -8],
        ].map((pos, i) => (
          <mesh key={`grapple-${i}`} position={pos} name="grapple-point">
            <sphereGeometry args={[0.4]} />
            <meshStandardMaterial
              color="#ff4500"
              emissive="#ff2000"
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* Additional obstacles and grapple points in the path to van */}
      <group>
        {/* Platforms */}
        <mesh position={[0, 0.5, -7]} name="platform">
          <boxGeometry args={[5, 1, 5]} />
          <meshStandardMaterial color="#555555" />
        </mesh>

        {/* Vertical poles */}
        {[
          [-5, 3, -5],
          [5, 3, -5],
          [-3, 4, -10],
          [3, 4, -10],
        ].map((pos, i) => (
          <mesh key={`pole-${i}`} position={pos} name="pipe">
            <cylinderGeometry args={[0.2, 0.2, 6]} />
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
        ))}

        {/* Horizontal beams */}
        {[
          [0, 6, -5, Math.PI / 2, 0, 0],
          [0, 6, -10, Math.PI / 2, 0, 0],
          [-4, 5, -7.5, 0, Math.PI / 2, 0],
          [4, 5, -7.5, 0, Math.PI / 2, 0],
        ].map((props, i) => (
          <mesh
            key={`beam-${i}`}
            position={[props[0], props[1], props[2]]}
            rotation={[props[3], props[4], props[5]]}
            name="pipe"
          >
            <cylinderGeometry args={[0.2, 0.2, 8]} />
            <meshStandardMaterial color="#aaaaaa" />
          </mesh>
        ))}
      </group>

      {/* Player */}
      <group ref={playerRef}>
        {renderCharacterModel()}

        {/* Fixed rope visualization - remove the first mesh that was causing the upward rope */}
        {(isAttacking || isGrappling) && (
          <group>
            {isGrappling && grapplePoint ? (
              // When grappling, point directly to grapple point
              <group position={[0, 0, 0]}>
                <mesh>
                  <cylinderGeometry
                    args={[
                      0.05,
                      0.05,
                      playerRef.current.position.distanceTo(grapplePoint),
                    ]}
                  />
                  <meshStandardMaterial color={character.color} />
                </mesh>
              </group>
            ) : (
              // When just shooting, point in player's facing direction
              <mesh
                position={[0, 0, ropeLength[character.id] / 2]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry
                  args={[0.05, 0.05, ropeLength[character.id]]}
                />
                <meshStandardMaterial color={character.color} />
              </mesh>
            )}

            {/* Rope hook/end */}
            {isGrappling && grapplePoint && (
              <mesh position={grapplePoint}>
                <sphereGeometry args={[0.1]} />
                <meshStandardMaterial color={character.color} />
              </mesh>
            )}
          </group>
        )}

        {/* Rope projectile visualization */}
        {ropeProjectile && (
          <group>
            {/* Rope line */}
            <mesh
              position={[
                playerRef.current.position.x +
                  (ropeProjectile.x - playerRef.current.position.x) / 2,
                playerRef.current.position.y,
                playerRef.current.position.z +
                  (ropeProjectile.z - playerRef.current.position.z) / 2,
              ]}
              rotation={[
                0,
                Math.atan2(
                  ropeProjectile.x - playerRef.current.position.x,
                  ropeProjectile.z - playerRef.current.position.z
                ),
                0,
              ]}
              scale={[
                1,
                new Vector3(
                  ropeProjectile.x - playerRef.current.position.x,
                  0,
                  ropeProjectile.z - playerRef.current.position.z
                ).length(),
                1,
              ]}
            >
              <cylinderGeometry
                args={[0.03, 0.03, 1, 8]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Rope head/hook */}
            <mesh
              position={[ropeProjectile.x, ropeProjectile.y, ropeProjectile.z]}
            >
              <coneGeometry
                args={[0.1, 0.2, 8]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <meshStandardMaterial color="#555555" metalness={0.8} />
            </mesh>
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

      {/* Porta-potties */}
      {pottyLocations.map((pos, i) => (
        <group key={`potty-${i}`} position={[pos[0], pos[1], pos[2]]}>
          {/* Porta-potty body */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1.2, 2, 1.2]} />
            <meshStandardMaterial color="#1E88E5" />
          </mesh>
          {/* Door */}
          <mesh position={[0, 1, 0.61]}>
            <boxGeometry args={[1, 1.8, 0.1]} />
            <meshStandardMaterial color="#0D47A1" />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 2.1, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[1.4, 0.2, 1.4]} />
            <meshStandardMaterial color="#0D47A1" />
          </mesh>
          {/* Sign */}
          <mesh position={[0, 1.5, 0.7]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.8, 0.3]} />
            <meshStandardMaterial color="white" />
          </mesh>
          {/* Text */}
          <Text
            position={[0, 1.5, 0.71]}
            rotation={[0, 0, 0]}
            fontSize={0.15}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            PortaPotty
          </Text>
        </group>
      ))}

      {/* Clutch Bar */}
      <group position={[barLocation[0], barLocation[1], barLocation[2]]}>
        {/* Bar building */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[6, 4, 5]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 4.5, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[4.5, 2, 4]} />
          <meshStandardMaterial color="#A52A2A" />
        </mesh>

        {/* Door */}
        <mesh position={[0, 1.5, 2.51]}>
          <boxGeometry args={[1.5, 3, 0.1]} />
          <meshStandardMaterial color="#4d2600" />
        </mesh>

        {/* Windows */}
        <mesh position={[-2, 2.5, 2.51]}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
        </mesh>
        <mesh position={[2, 2.5, 2.51]}>
          <boxGeometry args={[1, 1, 0.1]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
        </mesh>

        {/* Bar sign */}
        <group position={[0, 5.5, 0]}>
          <Text
            position={[0, 0, 2.6]}
            fontSize={0.8}
            color="#FF0000"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
          >
            CLUTCH
          </Text>
        </group>

        {/* Neon light around sign */}
        <mesh position={[0, 5.5, 2.6]}>
          <torusGeometry args={[1.5, 0.05, 16, 32]} />
          <meshStandardMaterial
            color="#FF00FF"
            emissive="#FF00FF"
            emissiveIntensity={2}
          />
        </mesh>
      </group>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2c3e50" />
      </mesh>

      {/* Paul and his truck */}
      <group
        ref={paulRef}
        position={[paulPosition.x, paulPosition.y, paulPosition.z]}
        rotation={[paulRotation.x, paulRotation.y, paulRotation.z]}
      >
        {/* 18-wheeler truck */}
        <group>
          {/* Truck cab */}
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[3, 2.5, 5]} />
            <meshStandardMaterial color="#D32F2F" />
          </mesh>

          {/* Windshield */}
          <mesh position={[0, 2.8, 2]} rotation={[Math.PI / 8, 0, 0]}>
            <boxGeometry args={[2.8, 1.2, 0.1]} />
            <meshStandardMaterial color="#90CAF9" transparent opacity={0.7} />
          </mesh>

          {/* Truck grille */}
          <mesh position={[0, 1.5, 2.5]}>
            <boxGeometry args={[2.8, 1, 0.2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>

          {/* Truck trailer */}
          <mesh position={[0, 2, -8]}>
            <boxGeometry args={[2.8, 3, 16]} />
            <meshStandardMaterial color="#EEEEEE" />
          </mesh>

          {/* Wheels - cab */}
          {[
            [-1.5, 0.6, 1.5],
            [1.5, 0.6, 1.5],
            [-1.5, 0.6, -0.5],
            [1.5, 0.6, -0.5],
          ].map((pos, i) => (
            <mesh
              key={`wheel-cab-${i}`}
              position={pos}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          ))}

          {/* Wheels - trailer (multiple axles) */}
          {[...Array(8)].map((_, i) => (
            <group key={`wheel-group-${i}`}>
              <mesh
                position={[-1.5, 0.6, -4 - i]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
              <mesh
                position={[1.5, 0.6, -4 - i]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
                <meshStandardMaterial color="#111111" />
              </mesh>
            </group>
          ))}
        </group>

        {/* Paul character */}
        <group position={[0, 3.5, 0]}>
          {/* Body */}
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.7, 1.2, 0.4]} />
            <meshStandardMaterial color="#3F51B5" /> {/* Blue shirt */}
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.3]} />
            <meshStandardMaterial color="#FFD180" /> {/* Skin tone */}
          </mesh>

          {/* Legs */}
          <mesh position={[-0.2, 0, 0]}>
            <boxGeometry args={[0.2, 0.8, 0.3]} />
            <meshStandardMaterial color="#424242" /> {/* Dark pants */}
          </mesh>
          <mesh position={[0.2, 0, 0]}>
            <boxGeometry args={[0.2, 0.8, 0.3]} />
            <meshStandardMaterial color="#424242" /> {/* Dark pants */}
          </mesh>

          {/* Arms */}
          <mesh position={[-0.45, 0.9, 0]}>
            <boxGeometry args={[0.2, 0.6, 0.3]} />
            <meshStandardMaterial color="#3F51B5" /> {/* Blue shirt */}
          </mesh>
          <mesh position={[0.45, 0.9, 0]}>
            <boxGeometry args={[0.2, 0.6, 0.3]} />
            <meshStandardMaterial color="#3F51B5" /> {/* Blue shirt */}
          </mesh>

          {/* Hat */}
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.3, 0.35, 0.2]} />
            <meshStandardMaterial color="#795548" /> {/* Brown hat */}
          </mesh>

          {/* Name label */}
          <group position={[0, 2.3, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={0.3}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              Paul
            </Text>
          </group>

          {/* Speech bubble */}
          {showPaulQuote && (
            <group position={[0, 3, 0]}>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[5, 1]} />
                <meshBasicMaterial color="white" transparent opacity={0.8} />
              </mesh>
              <Text
                position={[0, 0, 0.1]}
                fontSize={0.2}
                color="black"
                anchorX="center"
                anchorY="middle"
                maxWidth={4.5}
              >
                {paulQuote}
              </Text>
            </group>
          )}
        </group>
      </group>
    </>
  );
}

// Add these constants
const PAUL_SPEED = 0.08;
const PAUL_QUOTES = [
  "Move out the way, I'm going to be late!",
  "I got a delivery to make!",
  "Beep beep! Truck coming through!",
  "This ain't no Sunday drive!",
  "You're in my way, partner!",
  "I got a schedule to keep!",
  "This truck don't stop for nobody!",
  "Watch out! Big rig coming through!",
  "Move it or lose it, buddy!",
  "I'm hauling important stuff here!",
];

export default Game;
