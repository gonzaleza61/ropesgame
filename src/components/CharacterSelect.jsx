import React from "react";

const characters = [
  { id: "fabian", name: "Fabian", color: "#ff6b6b" },
  { id: "rica", name: "Rica", color: "#4ecdc4" },
  { id: "kris", name: "Kris", color: "#95a5a6" },
];

function CharacterSelect({ onSelect }) {
  return (
    <div className="character-select">
      <h1>Choose Your Character</h1>
      <div className="character-grid">
        {characters.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char)}
            className="character-button"
            style={{ backgroundColor: char.color }}
          >
            {char.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CharacterSelect;
