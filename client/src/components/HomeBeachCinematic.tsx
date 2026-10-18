const waves = ["one", "two", "three"] as const;
const glints = Array.from({ length: 10 }, (_, index) => index);

export function HomeBeachCinematic() {
  return (
    <div className="home-beach-cinematic" aria-hidden="true">
      <img src="/images/home-beach.jpg" alt="" />
      <span className="beach-cinematic-shade" />
      <span className="beach-sun-haze" />
      <span className="beach-palm beach-palm-left"><i /><i /><i /></span>
      <span className="beach-palm beach-palm-right"><i /><i /><i /></span>
      {waves.map(wave => <span className={`beach-surf beach-surf-${wave}`} key={wave} />)}
      <span className="beach-glints">{glints.map(glint => <i key={glint} style={{ "--glint": glint } as React.CSSProperties} />)}</span>
    </div>
  );
}
