import { useEffect, useState, useCallback } from "react";

function Joystick({ onMove }) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });

  const handleMove = useCallback(
    (clientX, clientY) => {
      if (dragging && basePosition.x !== 0) {
        const deltaX = clientX - basePosition.x;
        const deltaY = clientY - basePosition.y;
        const distance = Math.min(
          Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          50
        );
        const angle = Math.atan2(deltaY, deltaX);

        const newX = Math.cos(angle) * distance;
        const newY = Math.sin(angle) * distance;

        setPosition({ x: newX, y: newY });

        // Convert to movement vector (-1 to 1)
        const moveX = newX / 50;
        const moveZ = newY / 50;
        onMove({ x: moveX, z: -moveZ }); // Invert Z for proper forward/backward
      }
    },
    [dragging, basePosition, onMove]
  );

  const handleStart = useCallback((clientX, clientY) => {
    setDragging(true);
    setBasePosition({ x: clientX, y: clientY });
  }, []);

  const handleEnd = useCallback(() => {
    setDragging(false);
    setPosition({ x: 0, y: 0 });
    setBasePosition({ x: 0, y: 0 });
    onMove({ x: 0, z: 0 });
  }, [onMove]);

  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove);
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
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
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
