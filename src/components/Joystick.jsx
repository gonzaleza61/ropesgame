import { useEffect, useState, useCallback } from "react";

function Joystick({ onMove }) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const [deadZone, setDeadZone] = useState(5); // Add dead zone for better control
  const [turnSensitivity, setTurnSensitivity] = useState(0.7); // Reduce turn sensitivity

  const handleMove = useCallback(
    (clientX, clientY, e) => {
      // Prevent default browser behavior
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (dragging && basePosition.x !== 0) {
        const deltaX = clientX - basePosition.x;
        const deltaY = clientY - basePosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Apply dead zone
        if (distance < deadZone) {
          setPosition({ x: 0, y: 0 });
          onMove({ x: 0, z: 0 });
          return;
        }

        // Apply max distance
        const clampedDistance = Math.min(distance, 50);
        const angle = Math.atan2(deltaY, deltaX);

        const newX = Math.cos(angle) * clampedDistance;
        const newY = Math.sin(angle) * clampedDistance;

        setPosition({ x: newX, y: newY });

        // Apply non-linear response for better control
        const normalizedDistance =
          (clampedDistance - deadZone) / (50 - deadZone);
        const responseValue = Math.pow(normalizedDistance, 1.5); // Exponential response

        // Smoother movement with less aggressive turning
        // Forward/backward movement is more sensitive than turning
        const moveZ = Math.sin(angle) * responseValue;

        // Apply turn sensitivity to make turning less aggressive
        const moveX = Math.cos(angle) * responseValue * turnSensitivity;

        onMove({ x: moveX, z: moveZ });
      }
    },
    [dragging, basePosition, onMove, deadZone, turnSensitivity]
  );

  const handleStart = useCallback((clientX, clientY, e) => {
    // Prevent default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setDragging(true);
    setBasePosition({ x: clientX, y: clientY });
  }, []);

  const handleEnd = useCallback(
    (e) => {
      // Prevent default browser behavior
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setDragging(false);
      setPosition({ x: 0, y: 0 });
      setBasePosition({ x: 0, y: 0 });
      onMove({ x: 0, z: 0 });
    },
    [onMove]
  );

  useEffect(() => {
    const handleMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY, e);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: false });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [dragging, handleMove, handleEnd]);

  return (
    <div className="joystick-container">
      <div
        className="joystick-base"
        onMouseDown={(e) => {
          e.preventDefault();
          handleStart(e.clientX, e.clientY, e);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          if (e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY, e);
          }
        }}
      >
        <div
          className="joystick-stick"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        />
      </div>
    </div>
  );
}

export default Joystick;
