import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import CharacterSelect from "./components/CharacterSelect";
import Game from "./components/Game";
import Joystick from "./components/Joystick";

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("potty");
  const [movement, setMovement] = useState({ x: 0, z: 0 });
  const [isAttacking, setIsAttacking] = useState(false);
  const [pottyTimer, setPottyTimer] = useState(null);
  const [pottyTimerMax, setPottyTimerMax] = useState(null);
  const [showRopeCooldown, setShowRopeCooldown] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [alcoholTimer, setAlcoholTimer] = useState(null);
  const [alcoholTimerMax, setAlcoholTimerMax] = useState(45); // 45 seconds of alcohol effect
  const [isSober, setIsSober] = useState(false);
  const [energyDrinkActive, setEnergyDrinkActive] = useState(false);
  const [energyDrinkCooldown, setEnergyDrinkCooldown] = useState(false);

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

    // Initialize alcohol timer
    setAlcoholTimer(alcoholTimerMax);
    setIsSober(false);
  };

  const handleGameWin = () => {
    setGameWon(true);
  };

  const handleGameOver = (reason = "potty") => {
    setGameOver(true);
    setGameOverReason(reason);
  };

  const handleRestart = () => {
    setSelectedCharacter(null);
    setGameWon(false);
    setGameOver(false);
    setPottyTimer(null);
  };

  const handleAttack = () => {
    if (!isAttacking && !showRopeCooldown) {
      setIsAttacking(true);
      setShowRopeCooldown(true);
      setTimeout(() => setIsAttacking(false), 500);
      setTimeout(() => setShowRopeCooldown(false), 1000);
    }
  };

  const handlePottyReset = () => {
    // Reset the timer when player finds a portapotty
    setPottyTimer(pottyTimerMax);
  };

  const togglePhone = () => {
    console.log("Toggle phone called, current state:", showPhone);
    setShowPhone(!showPhone);
  };

  const handleAlcoholRefill = () => {
    // Reset the alcohol timer when player visits the bar
    setAlcoholTimer(alcoholTimerMax);
    setIsSober(false);
  };

  const handleSober = () => {
    setIsSober(true);
  };

  const handleEnergyDrink = () => {
    if (!energyDrinkActive && !energyDrinkCooldown) {
      // Activate energy drink
      setEnergyDrinkActive(true);

      // Set cooldown
      setEnergyDrinkCooldown(true);

      // Energy drink effect lasts for 5 seconds
      setTimeout(() => {
        setEnergyDrinkActive(false);
      }, 5000);

      // Cooldown lasts for 30 seconds
      setTimeout(() => {
        setEnergyDrinkCooldown(false);
      }, 30000);
    }
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

  // Update alcohol timer
  useEffect(() => {
    if (alcoholTimer && !gameWon && !gameOver && !isSober) {
      const interval = setInterval(() => {
        setAlcoholTimer((prev) => {
          if (prev <= 1) {
            handleSober();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [alcoholTimer, gameWon, gameOver, isSober]);

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
              onAlcoholRefill={handleAlcoholRefill}
              movement={movement}
              isAttacking={isAttacking}
              energyDrinkActive={energyDrinkActive}
            />
          </Canvas>

          {/* Mission Objective for all players */}
          <div className="mission-objective">
            <span className="mission-title">Mission:</span> Get to the Van!
            {selectedCharacter.id === "kris" && (
              <div className="sub-mission">Secondary: Get Rica Fired</div>
            )}
          </div>

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

          {alcoholTimer && (
            <div className="alcohol-timer">
              <div className="alcohol-label">Buzz Level:</div>
              <div className="timer-bar-container">
                <div
                  className="timer-bar"
                  style={{
                    width: `${(alcoholTimer / alcoholTimerMax) * 100}%`,
                    backgroundColor: alcoholTimer < 10 ? "#ff9933" : "#33cc33",
                  }}
                ></div>
              </div>
              <div className="timer-text">{alcoholTimer}s</div>
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
              {gameOverReason === "potty" ? (
                <>
                  <h2>You pooped yourself!</h2>
                  <p>Find a porta-potty next time!</p>
                </>
              ) : (
                <>
                  <h2>Paul ran you over!</h2>
                  <p>Watch out for that truck next time!</p>
                </>
              )}
              <button onClick={handleRestart}>Try Again</button>
            </div>
          )}

          {isSober && (
            <div className="game-over-screen sober-screen">
              <h2>You're Sober! You Lose!</h2>
              <p>Get back to the bar for another drink!</p>
              <button onClick={handleRestart}>Try Again</button>
            </div>
          )}

          <div className="controls-container">
            <Joystick onMove={setMovement} />
            <div className="action-buttons">
              <div className="attack-button-container">
                {showRopeCooldown && (
                  <div className="rope-cooldown">
                    <div className="rope-cooldown-progress"></div>
                  </div>
                )}
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

              <div className="energy-drink-button-container">
                {energyDrinkCooldown && (
                  <div className="energy-cooldown">
                    <div className="energy-cooldown-progress"></div>
                  </div>
                )}
                <button
                  className={`energy-drink-button ${
                    energyDrinkActive ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleEnergyDrink();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleEnergyDrink();
                  }}
                  disabled={energyDrinkCooldown}
                >
                  ⚡
                </button>
              </div>
            </div>

            <div className="phone-button-container">
              <button className="phone-button" onClick={() => togglePhone()}>
                📱
              </button>
            </div>
          </div>

          {/* Phone UI */}
          {showPhone && (
            <div className="phone-overlay">
              <div className="phone-ui">
                <div className="phone-header">
                  <div className="phone-title">Messages</div>
                  <button className="phone-close" onClick={togglePhone}>
                    ✕
                  </button>
                </div>
                <div className="phone-content">
                  <div className="message-contact">Jerry Nguyen</div>
                  <div className="message-bubble">
                    <p>Do you want to buy a forklift?</p>
                    <span className="message-time">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
