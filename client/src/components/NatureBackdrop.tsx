import type { CSSProperties } from "react";

const fireflies = Array.from({ length: 18 }, (_, index) => index);

export function NatureBackdrop() {
  return (
    <div className="nature-backdrop" aria-hidden="true">
      <div className="nature-aurora" />
      <div className="nature-moon" />
      <div className="nature-ridge nature-ridge-far" />
      <div className="nature-ridge nature-ridge-near" />
      <div className="nature-forest nature-forest-far" />
      <div className="nature-forest nature-forest-near" />
      <div className="nature-fireflies">
        {fireflies.map(index => <span key={index} style={{ left: `${(index * 31 + 7) % 97}%`, top: `${(index * 19 + 11) % 83}%`, animationDelay: `${index * -0.43}s`, animationDuration: `${5 + (index % 5) * 1.3}s`, "--firefly": index } as CSSProperties & Record<"--firefly", number>} />)}
      </div>
      <div className="nature-mist nature-mist-one" />
      <div className="nature-mist nature-mist-two" />
    </div>
  );
}
