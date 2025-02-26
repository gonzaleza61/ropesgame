import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import CharacterSelect from "./components/CharacterSelect";
import Game from "./components/Game";
import Joystick from "./components/Joystick";

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [movement, setMovement] = useState({ x: 0, z: 0 });
  const [isAttacking, setIsAttacking] = useState(false);
  const [pottyTimer, setPottyTimer] = useState(null);
  const [pottyTimerMax, setPottyTimerMax] = useState(null);

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setGameWon(false);
    setGameOver(false);

    // Set character-specific potty timer
    const timers = {
      fabian: 60, // 60 seconds
      rica: 45, // 45 seconds
      kris: 30, // 30 seconds
    };
    setPottyTimer(timers[character.id]);
    setPottyTimerMax(timers[character.id]);
  };

  const handleGameWin = () => {
    setGameWon(true);
  };

  const handleGameOver = () => {
    setGameOver(true);
  };

  const handleRestart = () => {
    setSelectedCharacter(null);
    setGameWon(false);
    setGameOver(false);
    setPottyTimer(null);
  };

  const handleAttack = () => {
    if (!isAttacking) {
      setIsAttacking(true);
      setTimeout(() => setIsAttacking(false), 500);
    }
  };

  const handlePottyReset = () => {
    // Reset the timer when player finds a portapotty
    setPottyTimer(pottyTimerMax);
  };

  // Update potty timer
  useEffect(() => {
    if (pottyTimer && !gameWon && !gameOver) {
      const interval = setInterval(() => {
        setPottyTimer((prev) => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pottyTimer, gameWon, gameOver]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {!selectedCharacter ? (
        <CharacterSelect onSelect={handleCharacterSelect} />
      ) : (
        <>
          <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
            <Game
              character={selectedCharacter}
              onWin={handleGameWin}
              onPottyReset={handlePottyReset}
              movement={movement}
              isAttacking={isAttacking}
            />
          </Canvas>

          {/* Mission Objective for Kris */}
          {selectedCharacter.id === "kris" && (
            <div className="mission-objective">Mission: Get Rica Fired</div>
          )}

          {/* Potty Timer */}
          {pottyTimer && (
            <div className="potty-timer">
              <div className="potty-label">Bathroom Break:</div>
              <div className="timer-bar-container">
                <div
                  className="timer-bar"
                  style={{
                    width: `${(pottyTimer / pottyTimerMax) * 100}%`,
                    backgroundColor: pottyTimer < 10 ? "#ff3333" : "#3498db",
                  }}
                ></div>
              </div>
              <div className="timer-text">{pottyTimer}s</div>
            </div>
          )}

          {gameWon && (
            <div className="win-screen">
              <h2>You made it to the van!</h2>
              <button onClick={handleRestart}>Play Again</button>
            </div>
          )}

          {gameOver && (
            <div className="game-over-screen">
              <h2>You couldn't hold it!</h2>
              <p>Find a porta-potty next time!</p>
              <button onClick={handleRestart}>Try Again</button>
            </div>
          )}

          <div className="controls-container">
            <Joystick onMove={setMovement} />
            <button
              className="attack-button"
              onClick={(e) => {
                e.preventDefault();
                handleAttack();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                handleAttack();
              }}
            >
              🎯
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
