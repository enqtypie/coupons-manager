"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/app/lib/date";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function MiniCalendar({ eventsByDate }: { eventsByDate: Map<string, string[]> }) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  // getDay() is Sunday-first (0-6); shift so the grid lines up with the
  // Monday-first weekday header above.
  const startWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Always render 6 full weeks (42 cells), padding both ends with blanks —
  // some months only need 4-5 rows, but a fixed row count keeps the card's
  // height constant as you page between months instead of it resizing.
  const cells: Array<{ day: number; dateStr: string } | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}` });
  }
  while (cells.length < 42) cells.push(null);

  return (
    <div className="mini-calendar">
      <p className="mini-calendar-today">Today: {formatDate(todayStr)}</p>
      <div className="mini-calendar-header">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={14} />
        </button>
        <span>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="mini-calendar-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="mini-calendar-weekday">
            {w}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (cell === null) {
            // Same box (padding/font-size) as a real day cell, just hidden —
            // otherwise an all-blank row collapses shorter than a row with
            // actual numbers, and the grid's total height shifts by month.
            return <span key={`empty-${i}`} className="mini-calendar-day mini-calendar-day--empty" />;
          }
          const dayEvents = eventsByDate.get(cell.dateStr);
          return (
            <span
              key={cell.dateStr}
              className={`mini-calendar-day${
                cell.dateStr === todayStr ? " mini-calendar-day--today" : ""
              }${dayEvents ? " mini-calendar-day--marked" : ""}`}
            >
              {cell.day}
              {dayEvents && (
                <span className="mini-calendar-tooltip">
                  {dayEvents.map((ev, idx) => (
                    <span key={idx} className="mini-calendar-tooltip-line">
                      {ev}
                    </span>
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
