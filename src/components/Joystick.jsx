import { useEffect, useState, useCallback, useRef } from "react";

function Joystick({ onMove }) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
  const deadZone = 5; // Dead zone for better control
  const turnSensitivity = 0.7; // Reduce turn sensitivity
  const joystickRef = useRef(null);
  const lastMoveRef = useRef({ x: 0, z: 0 });

  // Reset position when component mounts or unmounts
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, z: 0 });

    return () => {
      onMove({ x: 0, z: 0 });
    };
  }, [onMove]);

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
          if (lastMoveRef.current.x !== 0 || lastMoveRef.current.z !== 0) {
            lastMoveRef.current = { x: 0, z: 0 };
            onMove({ x: 0, z: 0 });
          }
          return;
        }

        // Apply max distance
        const maxDistance = 50;
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        const newX = Math.cos(angle) * clampedDistance;
        const newY = Math.sin(angle) * clampedDistance;

        setPosition({ x: newX, y: newY });

        // Apply non-linear response for better control
        const normalizedDistance =
          (clampedDistance - deadZone) / (maxDistance - deadZone);

        // Use smoother response curve
        const responseValue = Math.pow(normalizedDistance, 1.5);

        // Forward/backward movement is more sensitive than turning
        const moveZ = -Math.sin(angle) * responseValue; // Invert Z for more intuitive controls

        // Apply turn sensitivity to make turning less aggressive but more responsive
        const moveX = Math.cos(angle) * responseValue * turnSensitivity;

        // Only update if values changed significantly
        if (
          Math.abs(lastMoveRef.current.x - moveX) > 0.05 ||
          Math.abs(lastMoveRef.current.z - moveZ) > 0.05
        ) {
          lastMoveRef.current = { x: moveX, z: moveZ };
          onMove({ x: moveX, z: moveZ });
        }
      }
    },
    [dragging, basePosition, onMove, deadZone, turnSensitivity]
  );

  const handleStart = useCallback(
    (clientX, clientY, e) => {
      // Prevent default browser behavior
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Get joystick element position for more accurate base position
      if (joystickRef.current) {
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        setDragging(true);
        setBasePosition({ x: centerX, y: centerY });

        // Immediately move the joystick to the touch position
        handleMove(clientX, clientY, e);
      }
    },
    [handleMove]
  );

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
      lastMoveRef.current = { x: 0, z: 0 };
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
        ref={joystickRef}
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
