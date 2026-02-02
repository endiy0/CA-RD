import { CardStats } from "../api/types";

type StatBarsProps = {
  stats: CardStats;
};

const ORDER: Array<[keyof CardStats, string]> = [
  ["sense", "Sense"],
  ["logic", "Logic"],
  ["luck", "Luck"],
  ["charm", "Charm"],
  ["vibe", "Vibe"]
];

export default function StatBars({ stats }: StatBarsProps) {
  return (
    <div className="stats">
      {ORDER.map(([key, label]) => (
        <div className="stat" key={key}>
          <div className="stat-label">{label}</div>
          <div className="stat-bar">
            <div className="stat-fill" style={{ width: `${stats[key]}%` }} />
          </div>
          <div className="stat-value">{stats[key]}</div>
        </div>
      ))}
    </div>
  );
}
