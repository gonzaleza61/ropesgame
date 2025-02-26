import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text, OrbitControls } from "@react-three/drei";

const characters = [
  {
    id: "fabian",
    name: "Fabian",
    color: "#ff6b6b",
    description: "Long-range grappling hook & 60s bathroom timer",
    specialty: "Ropes Boss",
  },
  {
    id: "rica",
    name: "Rica",
    color: "#4ecdc4",
    description: "Medium-range grappling hook & 45s bathroom timer",
    specialty: "Medium Ropes",
  },
  {
    id: "kris",
    name: "Kris",
    color: "#95a5a6",
    description: "Short-range grappling hook & 30s bathroom timer",
    specialty: "Rookie",
  },
];

// 3D Character model for selection screen
function CharacterModel({ color, selected, hovered }) {
  return (
    <group scale={selected ? 1.2 : 1}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : selected ? 0.8 : 0}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial
          color="#FFE4E1"
          emissive="#FFE4E1"
          emissiveIntensity={hovered ? 0.2 : selected ? 0.4 : 0}
        />
      </mesh>

      {/* Hat */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          emissive="#FFD700"
          emissiveIntensity={hovered ? 0.3 : selected ? 0.5 : 0}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.35, 0, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.35, 0, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, -0.6, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.15, -0.6, 0]}>
        <boxGeometry args={[0.15, 0.5, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grappling hook */}
      {selected && (
        <group position={[0.5, 0, 0]}>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} />
          </mesh>
          <mesh position={[0.4, 0, 0]}>
            <coneGeometry
              args={[0.06, 0.15, 8]}
              rotation={[0, 0, Math.PI / 2]}
            />
            <meshStandardMaterial color="#aaa" metalness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function CharacterSelect({ onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [rotating, setRotating] = useState(true);

  useEffect(() => {
    // Auto-rotate characters until one is selected
    const interval = setInterval(() => {
      if (rotating && selectedIndex === null) {
        setHoveredIndex((prev) => {
          if (prev === null) return 0;
          return (prev + 1) % characters.length;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [rotating, selectedIndex]);

  const handleSelect = (index) => {
    setSelectedIndex(index);
    setRotating(false);

    // Add a slight delay before actually selecting to show the animation
    setTimeout(() => {
      onSelect(characters[index]);
    }, 800);
  };

  return (
    <div className="character-select">
      <div className="select-header">
        <h1>Choose Your Character</h1>
        <p className="select-subtitle">Each character has unique abilities</p>
      </div>

      <div className="character-preview">
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls
            enableZoom={false}
            autoRotate={rotating}
            autoRotateSpeed={2}
          />

          <group position={[0, 0, 0]}>
            {characters.map((char, index) => (
              <group
                key={char.id}
                position={[
                  (index - 1) * 2.5,
                  selectedIndex === index ? 0.5 : 0,
                  0,
                ]}
                scale={selectedIndex === index ? 1.5 : 1}
              >
                <CharacterModel
                  color={char.color}
                  selected={selectedIndex === index}
                  hovered={hoveredIndex === index}
                />
                <Text
                  position={[0, -1.2, 0]}
                  fontSize={0.3}
                  color="white"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.02}
                  outlineColor="#000000"
                >
                  {char.name}
                </Text>
                {hoveredIndex === index && selectedIndex === null && (
                  <Text
                    position={[0, -1.6, 0]}
                    fontSize={0.15}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={2}
                  >
                    {char.specialty}
                  </Text>
                )}
              </group>
            ))}
          </group>
        </Canvas>
      </div>

      <div className="character-grid">
        {characters.map((char, index) => (
          <div key={char.id} className="character-card">
            <button
              onClick={() => handleSelect(index)}
              onMouseEnter={() => {
                setHoveredIndex(index);
                setRotating(false);
              }}
              onMouseLeave={() => {
                if (selectedIndex === null) setRotating(true);
              }}
              className={`character-button ${
                selectedIndex === index ? "selected" : ""
              } ${hoveredIndex === index ? "hovered" : ""}`}
              style={{
                backgroundColor: char.color,
                boxShadow:
                  hoveredIndex === index ? `0 0 20px ${char.color}` : "none",
              }}
              disabled={selectedIndex !== null}
            >
              {char.name}
            </button>
            <div className="character-description">
              <p>{char.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="game-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Use the joystick to move around</li>
          <li>Tap the grappling hook button to swing</li>
          <li>Find porta-potties to reset your bathroom timer</li>
          <li>Reach the van before time runs out!</li>
        </ul>
      </div>
    </div>
  );
}

export default CharacterSelect;
