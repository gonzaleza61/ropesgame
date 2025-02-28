import { useState, useEffect, useRef, useCallback } from "react";
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
  // eslint-disable-next-line no-unused-vars
  const [alcoholTimerMax, setAlcoholTimerMax] = useState(45); // 45 seconds of alcohol effect
  const [isSober, setIsSober] = useState(false);
  const [energyDrinkActive, setEnergyDrinkActive] = useState(false);
  const [energyDrinkCooldown, setEnergyDrinkCooldown] = useState(false);
  const [usingKeyboard, setUsingKeyboard] = useState(false);
  const [playerRotation, setPlayerRotation] = useState(0);

  const keysPressedRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

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

  // Memoize handleAttack
  const handleAttack = useCallback(() => {
    if (!isAttacking && !showRopeCooldown) {
      setIsAttacking(true);
      setShowRopeCooldown(true);
      setTimeout(() => setIsAttacking(false), 500);
      setTimeout(() => setShowRopeCooldown(false), 1000);
    }
  }, [isAttacking, showRopeCooldown]);

  const handlePottyReset = () => {
    // Reset the timer when player finds a portapotty
    setPottyTimer(pottyTimerMax);
  };

  // Also memoize handleEnergyDrink and togglePhone
  const handleEnergyDrink = useCallback(() => {
    if (!energyDrinkActive && !energyDrinkCooldown) {
      setEnergyDrinkActive(true);
      setEnergyDrinkCooldown(true);
      setTimeout(() => setEnergyDrinkActive(false), 5000);
      setTimeout(() => setEnergyDrinkCooldown(false), 30000);
    }
  }, [energyDrinkActive, energyDrinkCooldown]);

  const togglePhone = useCallback(() => {
    setShowPhone((prev) => !prev);
  }, []);

  const handleAlcoholRefill = () => {
    // Reset the alcohol timer when player visits the bar
    setAlcoholTimer(alcoholTimerMax);
    setIsSober(false);
  };

  const handleSober = () => {
    setIsSober(true);
  };

  // Memoize handleKeyboardControls with useCallback
  const handleKeyboardControls = useCallback(() => {
    const updateMovement = () => {
      let x = 0;
      let z = 0;

      if (keysPressedRef.current.up) z = 1;
      if (keysPressedRef.current.down) z = -1;
      if (keysPressedRef.current.left) x = -1;
      if (keysPressedRef.current.right) x = 1;

      // Normalize diagonal movement
      if (x !== 0 && z !== 0) {
        const magnitude = Math.sqrt(x * x + z * z);
        x /= magnitude;
        z /= magnitude;
      }

      // Adjust movement based on player rotation
      if (x !== 0 || z !== 0) {
        const adjustedX =
          x * Math.cos(playerRotation) - z * Math.sin(playerRotation);
        const adjustedZ =
          x * Math.sin(playerRotation) + z * Math.cos(playerRotation);
        setMovement({ x: adjustedX, z: adjustedZ });
      } else {
        setMovement({ x: 0, z: 0 });
      }
    };

    const handleKeyDown = (e) => {
      setUsingKeyboard(true);

      // Prevent default for game controls
      if (
        [
          "w",
          "s",
          "a",
          "d",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " ",
          "e",
          "p",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }

      // Movement controls
      switch (e.key) {
        case "w":
        case "ArrowUp":
          keysPressedRef.current.up = true;
          break;
        case "s":
        case "ArrowDown":
          keysPressedRef.current.down = true;
          break;
        case "a":
        case "ArrowLeft":
          keysPressedRef.current.left = true;
          break;
        case "d":
        case "ArrowRight":
          keysPressedRef.current.right = true;
          break;
        case " ": // Space bar for grappling hook
          handleAttack();
          break;
        case "e": // E key for energy drink
          handleEnergyDrink();
          break;
        case "p": // P key for phone
          togglePhone();
          break;
        default:
          break;
      }

      updateMovement();
    };

    const handleKeyUp = (e) => {
      // Reset movement when keys are released
      switch (e.key) {
        case "w":
        case "ArrowUp":
          keysPressedRef.current.up = false;
          break;
        case "s":
        case "ArrowDown":
          keysPressedRef.current.down = false;
          break;
        case "a":
        case "ArrowLeft":
          keysPressedRef.current.left = false;
          break;
        case "d":
        case "ArrowRight":
          keysPressedRef.current.right = false;
          break;
        default:
          break;
      }

      updateMovement();
    };

    // Add event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up event listeners
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Reset movement when controls are removed
      setMovement({ x: 0, z: 0 });
    };
  }, [handleAttack, handleEnergyDrink, togglePhone]);

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

  // Then update your useEffect
  useEffect(() => {
    if (selectedCharacter && !gameWon && !gameOver && !isSober) {
      return handleKeyboardControls();
    }
  }, [selectedCharacter, gameWon, gameOver, isSober, handleKeyboardControls]);

  // Add a handler for rotation changes
  const handleRotationChange = useCallback((rotation) => {
    setPlayerRotation(rotation);
  }, []);

  // Update the Joystick component to adjust for player rotation
  const handleJoystickMove = useCallback(
    (joystickMovement) => {
      if (joystickMovement.x === 0 && joystickMovement.z === 0) {
        setMovement({ x: 0, z: 0 });
        return;
      }

      // Adjust joystick movement based on player rotation
      const adjustedX =
        joystickMovement.x * Math.cos(playerRotation) -
        joystickMovement.z * Math.sin(playerRotation);
      const adjustedZ =
        joystickMovement.x * Math.sin(playerRotation) +
        joystickMovement.z * Math.cos(playerRotation);

      setMovement({ x: adjustedX, z: adjustedZ });
    },
    [playerRotation]
  );

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
              onGameOver={handleGameOver}
              onRotationChange={handleRotationChange}
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
              <h2>You&apos;re Sober! You Lose!</h2>
              <p>Get back to the bar for another drink!</p>
              <button onClick={handleRestart}>Try Again</button>
            </div>
          )}

          <div className="controls-container">
            <Joystick onMove={handleJoystickMove} />
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

          {/* Add a desktop controls help overlay */}
          {selectedCharacter && !usingKeyboard && (
            <div className="desktop-controls-help">
              <h3>Keyboard Controls:</h3>
              <ul>
                <li>
                  <span className="key">W</span> <span className="key">A</span>{" "}
                  <span className="key">S</span> <span className="key">D</span>{" "}
                  or <span className="key">↑</span>{" "}
                  <span className="key">←</span> <span className="key">↓</span>{" "}
                  <span className="key">→</span> - Move
                </li>
                <li>
                  <span className="key">Space</span> - Grappling Hook
                </li>
                <li>
                  <span className="key">E</span> - Energy Drink
                </li>
                <li>
                  <span className="key">P</span> - Phone
                </li>
              </ul>
              <button onClick={() => setUsingKeyboard(true)}>Got it!</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
