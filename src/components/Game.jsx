import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Vector3,
  Raycaster,
  MeshBasicMaterial,
  CylinderGeometry,
  Euler,
  Box3,
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
  onRotationChange,
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
  const [playerRotation, setPlayerRotation] = useState(0);
  const [trampolines] = useState([
    [-15, 0, -20],
    [15, 0, -30],
    [-5, 0, -40],
  ]);
  const [isJumping, setIsJumping] = useState(false);
  const jumpHeight = useRef(0);
  const jumpVelocity = useRef(0);

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

  // Add state for moving platforms
  const [movingPlatforms, setMovingPlatforms] = useState([
    { position: [10, 1, -15], direction: 1, range: 5, speed: 0.03 },
    { position: [-12, 1, -35], direction: 1, range: 3, speed: 0.05 },
  ]);

  // Add state for collectibles
  const [collectibles, setCollectibles] = useState([
    { position: [13, 1, -10], collected: false },
    { position: [-17, 1, -20], collected: false },
    { position: [20, 1, -30], collected: false },
    { position: [-10, 1, -40], collected: false },
  ]);
  const [score, setScore] = useState(0);

  // Add a state for tracking elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update the elapsed time in useFrame
  useFrame((state, delta) => {
    // Update elapsed time for animations
    setElapsedTime(state.clock.elapsedTime);

    // Update moving platforms
    setMovingPlatforms((platforms) =>
      platforms.map((platform) => {
        // Calculate new position
        const newX = platform.position[0] + platform.direction * platform.speed;

        // Check if platform reached its range limit
        if (Math.abs(newX - platform.position[0]) > platform.range) {
          return {
            ...platform,
            direction: -platform.direction,
          };
        }

        // Update position
        return {
          ...platform,
          position: [newX, platform.position[1], platform.position[2]],
        };
      })
    );

    // Check if player is on a moving platform
    if (playerRef.current && !isJumping) {
      for (const platform of movingPlatforms) {
        const distance = Math.sqrt(
          Math.pow(playerRef.current.position.x - platform.position[0], 2) +
            Math.pow(playerRef.current.position.z - platform.position[2], 2)
        );

        // If player is on the platform, move with it
        if (
          distance < 2 &&
          Math.abs(playerRef.current.position.y - platform.position[1] - 1) <
            0.5
        ) {
          playerRef.current.position.x += platform.direction * platform.speed;
        }
      }
    }

    if (playerRef.current) {
      // Store the previous position before movement
      const prevPosition = playerRef.current.position.clone();

      // Rope hit detection
      if (isAttacking && !isGrappling && !ropeCooldown) {
        handleRopeShoot();
      }

      // Handle movement
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
        const moveSpeed = energyDrinkActive ? baseSpeed * 2 : baseSpeed;

        // Get camera forward direction (ignoring y component for horizontal movement)
        const cameraForward = new Vector3(0, 0, -1); // -Z is forward in camera space
        cameraForward.applyQuaternion(state.camera.quaternion);
        cameraForward.y = 0; // Keep movement on horizontal plane
        cameraForward.normalize();

        // Get camera right direction
        const cameraRight = new Vector3(1, 0, 0); // X is right in camera space
        cameraRight.applyQuaternion(state.camera.quaternion);
        cameraRight.y = 0; // Keep movement on horizontal plane
        cameraRight.normalize();

        // Calculate movement direction based on input and camera orientation
        const moveDirection = new Vector3();
        moveDirection.addScaledVector(cameraRight, movement.x);
        moveDirection.addScaledVector(cameraForward, movement.z);

        if (moveDirection.length() > 0.1) {
          moveDirection.normalize();

          // Apply movement
          playerRef.current.position.x += moveDirection.x * moveSpeed;
          playerRef.current.position.z += moveDirection.z * moveSpeed;

          // Update player rotation to face movement direction
          const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);
          playerRef.current.rotation.y = targetRotation;
        }
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

      // Update player rotation state to be used for controls
      setPlayerRotation(playerRef.current.rotation.y);

      // Check for trampoline collision
      if (!isJumping) {
        for (const trampolinePos of trampolines) {
          const distance = Math.sqrt(
            Math.pow(playerRef.current.position.x - trampolinePos[0], 2) +
              Math.pow(playerRef.current.position.z - trampolinePos[2], 2)
          );

          if (distance < 1.5) {
            // Start a jump
            setIsJumping(true);
            jumpVelocity.current = 0.3;
            break;
          }
        }
      }

      // Handle jumping physics
      if (isJumping) {
        // Apply gravity
        jumpVelocity.current -= 0.01;

        // Update height
        jumpHeight.current += jumpVelocity.current;

        // Update player Y position
        playerRef.current.position.y = 1 + jumpHeight.current;

        // Check if landed
        if (jumpHeight.current <= 0) {
          jumpHeight.current = 0;
          playerRef.current.position.y = 1;
          setIsJumping(false);
        }
      }

      // After applying movement, check for collisions
      const playerRadius = 0.5; // Approximate player radius

      // Check collisions with all obstacles
      const obstacles = [];
      state.scene.traverse((child) => {
        if (
          child.isMesh &&
          (child.name === "obstacle" || child.name === "container")
        ) {
          obstacles.push(child);
        }
      });

      let collision = false;

      for (const obstacle of obstacles) {
        // Get obstacle bounds
        const box = new Box3().setFromObject(obstacle);

        // Check if player is inside the obstacle bounds plus player radius
        if (
          playerRef.current.position.x > box.min.x - playerRadius &&
          playerRef.current.position.x < box.max.x + playerRadius &&
          playerRef.current.position.z > box.min.z - playerRadius &&
          playerRef.current.position.z < box.max.z + playerRadius
        ) {
          collision = true;
          break;
        }
      }

      // If collision detected, revert to previous position
      if (collision) {
        playerRef.current.position.copy(prevPosition);
      }
    }

    // Check for collectible pickup
    if (playerRef.current) {
      setCollectibles((items) =>
        items.map((item) => {
          if (!item.collected) {
            const distance = Math.sqrt(
              Math.pow(playerRef.current.position.x - item.position[0], 2) +
                Math.pow(playerRef.current.position.z - item.position[2], 2)
            );

            if (distance < 1) {
              // Collect the item
              setScore((prev) => prev + 10);
              return { ...item, collected: true };
            }
          }
          return item;
        })
      );
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

      {/* Van (goal) */}
      <group
        ref={vanRef}
        position={[0, 1, -50]} // Move the van further away to the end of the obstacle course
        rotation={[0, Math.PI, 0]} // Make the van face the player
      >
        {/* Van body */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[2.5, 2, 5]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Van roof */}
        <mesh position={[0, 2.5, -0.5]}>
          <boxGeometry args={[2.5, 1, 4]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>

        {/* Van windshield */}
        <mesh position={[0, 1.8, 2.01]}>
          <planeGeometry args={[2, 1.2]} />
          <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
        </mesh>

        {/* Van wheels */}
        <mesh position={[-1.25, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.25, 0.4, 1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[-1.25, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[1.25, 0.4, -1.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Van details */}
        <mesh position={[0, 0.5, -2.51]}>
          <planeGeometry args={[2, 1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Van logo */}
        <group position={[0, 1.5, -2.52]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.3}
            color="red"
            anchorX="center"
            anchorY="middle"
          >
            CLUTCH
          </Text>
        </group>
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

      {/* Ground with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100, 20, 20]} />
        <meshStandardMaterial
          color="#2c3e50"
          roughness={0.8}
          metalness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Add some random rocks on the ground */}
      {[...Array(30)].map((_, i) => (
        <mesh
          key={`rock-${i}`}
          position={[
            (Math.random() - 0.5) * 80,
            0.2,
            (Math.random() - 0.5) * 80,
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          ]}
          scale={[
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
            Math.random() * 0.5 + 0.5,
          ]}
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#555555" roughness={0.9} />
        </mesh>
      ))}

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

      {/* Add an invisible component to pass rotation data */}
      <group
        onUpdate={() => {
          if (playerRef.current) {
            onRotationChange(playerRef.current.rotation.y);
          }
        }}
      />

      {/* Obstacle Course Elements */}
      {/* Large concrete barriers */}
      {[
        [5, 0.75, -5],
        [-15, 0.75, -12],
        [20, 0.75, -20],
        [-18, 0.75, -25],
        [25, 0.75, -30],
      ].map((pos, i) => (
        <mesh key={`barrier-${i}`} position={pos} name="obstacle">
          <boxGeometry args={[3, 1.5, 1]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      ))}

      {/* Shipping containers */}
      {[
        [12, 1.5, -5, 0],
        [-20, 1.5, -15, Math.PI / 4],
        [18, 1.5, -25, Math.PI / 6],
      ].map((pos, i) => (
        <group
          key={`container-${i}`}
          position={[pos[0], pos[1], pos[2]]}
          rotation={[0, pos[3], 0]}
          name="container"
        >
          <mesh>
            <boxGeometry args={[5, 3, 10]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#1976D2" : "#D32F2F"} />
          </mesh>
          <mesh position={[0, -1.5, 4.5]}>
            <boxGeometry args={[4.8, 0.2, 0.2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <mesh position={[0, -1.5, -4.5]}>
            <boxGeometry args={[4.8, 0.2, 0.2]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </group>
      ))}

      {/* Construction site with pipes for grappling */}
      <group position={[0, 0, -35]}>
        <mesh position={[0, 5, 0]} rotation={[0, 0, Math.PI / 2]} name="pipe">
          <cylinderGeometry args={[0.2, 0.2, 15, 16]} />
          <meshStandardMaterial color="#FF9800" />
        </mesh>
        <mesh position={[0, 10, 0]} rotation={[0, 0, Math.PI / 2]} name="pipe">
          <cylinderGeometry args={[0.2, 0.2, 15, 16]} />
          <meshStandardMaterial color="#FF9800" />
        </mesh>
        <mesh position={[-7.5, 7.5, 0]} rotation={[0, 0, 0]} name="pipe">
          <cylinderGeometry args={[0.2, 0.2, 15, 16]} />
          <meshStandardMaterial color="#FF9800" />
        </mesh>
        <mesh position={[7.5, 7.5, 0]} rotation={[0, 0, 0]} name="pipe">
          <cylinderGeometry args={[0.2, 0.2, 15, 16]} />
          <meshStandardMaterial color="#FF9800" />
        </mesh>
      </group>

      {/* Mud puddles that slow the player down */}
      {[
        [3, 0.05, -8],
        [-7, 0.05, -18],
        [5, 0.05, -28],
      ].map((pos, i) => (
        <mesh
          key={`mud-${i}`}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          name="mud"
        >
          <circleGeometry args={[2.5, 32]} />
          <meshStandardMaterial color="#5D4037" transparent opacity={0.8} />
        </mesh>
      ))}

      {/* Ramps and platforms */}
      <group position={[-15, 0, -35]}>
        <mesh position={[0, 1, 0]} rotation={[Math.PI / 8, 0, 0]}>
          <boxGeometry args={[6, 0.5, 8]} />
          <meshStandardMaterial color="#607D8B" />
        </mesh>
        <mesh position={[0, 2.5, -5]}>
          <boxGeometry args={[6, 0.5, 3]} />
          <meshStandardMaterial color="#607D8B" />
        </mesh>
      </group>

      {/* Barrels */}
      {[
        [2, 1, -3],
        [3, 1, -3.5],
        [2.5, 1, -2.5],
        [-6, 1, -22],
        [-5, 1, -21],
        [14, 1, -18],
        [15, 1, -17],
      ].map((pos, i) => (
        <mesh key={`barrel-${i}`} position={pos} name="obstacle">
          <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#F57F17" : "#0D47A1"} />
        </mesh>
      ))}

      {/* Fences */}
      {[...Array(10)].map((_, i) => (
        <group
          key={`fence-${i}`}
          position={[20, 0, -5 * i]}
          rotation={[0, 0, 0]}
        >
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.2, 2, 5]} />
            <meshStandardMaterial color="#8D6E63" />
          </mesh>
          <mesh position={[0, 0.5, -2.4]}>
            <boxGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 1.5, -2.4]}>
            <boxGeometry args={[0.1, 0.1, 0.2]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
        </group>
      ))}

      {/* Add a finish line near the van */}
      <mesh position={[0, 0.05, -45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.06, -45]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.8} />
      </mesh>

      {/* Trampolines */}
      {trampolines.map((pos, i) => (
        <group key={`trampoline-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.5, 32]} />
            <meshStandardMaterial color="#4CAF50" />
          </mesh>
          <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 1.5, 32]} />
            <meshStandardMaterial color="#F44336" />
          </mesh>
        </group>
      ))}

      {/* Moving platforms */}
      {movingPlatforms.map((platform, i) => (
        <mesh
          key={`moving-platform-${i}`}
          position={platform.position}
          name="obstacle"
        >
          <boxGeometry args={[4, 0.5, 2]} />
          <meshStandardMaterial color="#E91E63" />
        </mesh>
      ))}

      {/* Collectibles */}
      {collectibles.map(
        (item, i) =>
          !item.collected && (
            <group key={`collectible-${i}`} position={item.position}>
              <mesh rotation={[0, elapsedTime, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial
                  color="#FFD700"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
            </group>
          )
      )}
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
