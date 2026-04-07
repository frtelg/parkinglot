import styles from "@/components/parking-lot-app.module.css";

import { snoozeChoices, snoozeChoiceLabels } from "../parking-lot-constants";
import { formatHumanReadableDateTime } from "../parking-lot-utils";
import type { SnoozeChoice } from "../types";

type SnoozePanelProps = {
  selectedChoice: SnoozeChoice;
  date: string;
  time: string;
  pendingAction: string | null;
  onSelectChoice: (choice: SnoozeChoice) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onSnooze: () => void;
};

export function SnoozePanel({
  selectedChoice,
  date,
  time,
  pendingAction,
  onSelectChoice,
  onDateChange,
  onTimeChange,
  onSnooze,
}: SnoozePanelProps) {
  return (
    <div className={styles.snoozePanel} aria-labelledby="snooze-panel-heading">
      <h3 id="snooze-panel-heading" className={styles.snoozeHeading}>
        Pause this item
      </h3>
      <p className={styles.snoozeHelp}>Move it out of Active for a while, then let it return automatically.</p>
      <div className={styles.snoozeChoiceGroup} role="radiogroup" aria-label="Snooze duration presets">
        {snoozeChoices.map((choice) => {
          const isSelected = selectedChoice === choice;

          return (
            <label key={choice} className={isSelected ? styles.snoozeChoiceActive : styles.snoozeChoice}>
              <input
                type="radio"
                name="snooze-duration"
                aria-label={snoozeChoiceLabels[choice]}
                value={choice}
                checked={isSelected}
                onChange={() => onSelectChoice(choice)}
                disabled={pendingAction === "snooze-item"}
              />
              <span>{snoozeChoiceLabels[choice]}</span>
            </label>
          );
        })}
      </div>
      <div className={styles.snoozeDateTimeRow}>
        <label className={styles.snoozeInputField}>
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} disabled={pendingAction === "snooze-item"} />
        </label>
        <label className={styles.snoozeInputField}>
          <span>Time</span>
          <input type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} disabled={pendingAction === "snooze-item"} />
        </label>
      </div>
      <div className={styles.snoozeActionRow}>
        <span className={styles.snoozeSummary}>
          Selected: {snoozeChoiceLabels[selectedChoice]} until {formatHumanReadableDateTime(date, time)}
        </span>
        <button type="button" className={styles.secondaryButton} disabled={pendingAction === "snooze-item"} onClick={onSnooze}>
          {pendingAction === "snooze-item" ? "Snoozing..." : "Snooze item"}
        </button>
      </div>
    </div>
  );
}
