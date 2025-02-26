import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import CharacterSelect from "./components/CharacterSelect";
import Game from "./components/Game";
import Joystick from "./components/Joystick";

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [movement, setMovement] = useState({ x: 0, z: 0 });

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setGameWon(false);
  };

  const handleGameWin = () => {
    setGameWon(true);
  };

  const handleRestart = () => {
    setSelectedCharacter(null);
    setGameWon(false);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!selectedCharacter ? (
        <CharacterSelect onSelect={handleCharacterSelect} />
      ) : (
        <>
          <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
            <Game character={selectedCharacter} onWin={handleGameWin} />
          </Canvas>
          {gameWon && (
            <div className="win-screen">
              <h2>You made it to the van!</h2>
              <button onClick={handleRestart}>Play Again</button>
            </div>
          )}
          <div className="controls-container">
            <Joystick onMove={setMovement} />
            <button className="attack-button">🎯</button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
