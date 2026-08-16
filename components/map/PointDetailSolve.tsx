"use client";

import { useState } from "react";
import { QuestSolve } from "./QuestSolve";

// Řešení úkolu na detail stránce (server komponenta předá počáteční stav).
export function PointDetailSolve({
  pointId,
  solved: initiallySolved,
}: {
  pointId: string;
  solved: boolean;
}) {
  const [solved, setSolved] = useState(initiallySolved);

  if (solved) {
    return (
      <p className="font-medium text-emerald-400">✓ Vyřešeno</p>
    );
  }

  return (
    <QuestSolve
      onSolve={async (answer) => {
        const res = await fetch(`/api/points/${pointId}/solve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { correct?: boolean };
        if (data.correct) {
          setSolved(true);
          return true;
        }
        return false;
      }}
    />
  );
}
