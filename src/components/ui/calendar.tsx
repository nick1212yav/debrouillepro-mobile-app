// src/components/ui/calendar.tsx
import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

// ── Types ─────────────────────────────────────────────────────────────────
export type CalendarMode = "single" | "range";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface CalendarProps {
  /** Mode de sélection. */
  mode?: CalendarMode;
  /** Date sélectionnée (mode single). */
  selected?: Date;
  /** Plage sélectionnée (mode range). */
  selectedRange?: DateRange;
  /** Callback (mode single). */
  onSelect?: (date: Date | undefined) => void;
  /** Callback (mode range). */
  onSelectRange?: (range: DateRange | undefined) => void;
  /** Mois initialement affiché. */
  defaultMonth?: Date;
  /** Contrôle externe du mois affiché. */
  month?: Date;
  /** Callback quand le mois change. */
  onMonthChange?: (month: Date) => void;
  /** Affiche les jours hors du mois courant. */
  showOutsideDays?: boolean;
  /** Désactive certaines dates. */
  disabled?: (date: Date) => boolean;
  /** Style additionnel pour le conteneur. */
  style?: ViewProps["style"];
  /** Label accessibilité. */
  accessibilityLabel?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────
const WEEKDAYS_SHORT = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a?: Date, b?: Date): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Retourne le lundi de la semaine contenant `date`. */
function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const diff = (day + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * Construit la grille 6×7 (42 jours) couvrant le mois.
 * Chaque cellule : { date, isOutside, isToday }.
 */
interface GridCell {
  date: Date;
  isOutside: boolean;
  isToday: boolean;
}

function buildMonthGrid(monthDate: Date): GridCell[] {
  const firstOfMonth = startOfMonth(monthDate);
  const gridStart = startOfWeekMonday(firstOfMonth);
  const today = startOfDay(new Date());
  const cells: GridCell[] = [];

  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({
      date,
      isOutside: date.getMonth() !== monthDate.getMonth(),
      isToday: isSameDay(date, today),
    });
  }

  return cells;
}

// ── Calendar ──────────────────────────────────────────────────────────────
export function Calendar({
  mode = "single",
  selected,
  selectedRange,
  onSelect,
  onSelectRange,
  defaultMonth,
  month: controlledMonth,
  onMonthChange,
  showOutsideDays = true,
  disabled,
  style,
  accessibilityLabel = "Calendrier",
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(
    () => controlledMonth ?? defaultMonth ?? new Date(),
  );

  const currentMonth = controlledMonth ?? internalMonth;

  const changeMonth = React.useCallback(
    (next: Date) => {
      if (controlledMonth === undefined) {
        setInternalMonth(next);
      }
      onMonthChange?.(next);
    },
    [controlledMonth, onMonthChange],
  );

  const handlePrevMonth = () => changeMonth(addMonths(currentMonth, -1));
  const handleNextMonth = () => changeMonth(addMonths(currentMonth, 1));

  const cells = React.useMemo(
    () => buildMonthGrid(currentMonth),
    [currentMonth],
  );

  const handleDayPress = (date: Date) => {
    if (disabled?.(date)) return;

    if (mode === "single") {
      onSelect?.(date);
      return;
    }

    // mode range
    const current = selectedRange ?? {};
    if (!current.from || (current.from && current.to)) {
      // Démarre une nouvelle sélection
      onSelectRange?.({ from: date, to: undefined });
    } else {
      // Complète la plage
      if (date < current.from) {
        onSelectRange?.({ from: date, to: current.from });
      } else {
        onSelectRange?.({ from: current.from, to: date });
      }
    }
  };

  const monthLabel = `${MONTHS_FR[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
    >
      {/* Header : mois + navigation */}
      <View style={styles.header}>
        <Pressable
          onPress={handlePrevMonth}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}
          accessibilityLabel="Mois précédent"
          hitSlop={6}
        >
          <ChevronLeft size={16} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <Pressable
          onPress={handleNextMonth}
          style={({ pressed }) => [
            styles.navButton,
            pressed && styles.navButtonPressed,
          ]}
          accessibilityLabel="Mois suivant"
          hitSlop={6}
        >
          <ChevronRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Weekdays */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS_SHORT.map((d) => (
          <View key={d} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grille 6×7 */}
      <View style={styles.grid}>
        {cells.map((cell, index) => {
          const key = `${cell.date.toISOString()}-${index}`;

          if (cell.isOutside && !showOutsideDays) {
            return <View key={key} style={styles.dayCell} />;
          }

          const isSelected = isCellSelected(
            cell.date,
            mode,
            selected,
            selectedRange,
          );
          const isRangeStart = isCellRangeStart(cell.date, selectedRange);
          const isRangeEnd = isCellRangeEnd(cell.date, selectedRange);
          const isRangeMiddle = isCellRangeMiddle(cell.date, selectedRange);
          const isDisabled = disabled?.(cell.date) ?? false;

          return (
            <CalendarDayButton
              key={key}
              date={cell.date}
              isOutside={cell.isOutside}
              isToday={cell.isToday}
              isSelected={isSelected}
              isRangeStart={isRangeStart}
              isRangeEnd={isRangeEnd}
              isRangeMiddle={isRangeMiddle}
              isDisabled={isDisabled}
              onPress={() => handleDayPress(cell.date)}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── CalendarDayButton ─────────────────────────────────────────────────────
export interface CalendarDayButtonProps {
  date: Date;
  isOutside?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  isRangeStart?: boolean;
  isRangeEnd?: boolean;
  isRangeMiddle?: boolean;
  isDisabled?: boolean;
  onPress?: () => void;
}

export function CalendarDayButton({
  date,
  isOutside = false,
  isToday = false,
  isSelected = false,
  isRangeStart = false,
  isRangeEnd = false,
  isRangeMiddle = false,
  isDisabled = false,
  onPress,
}: CalendarDayButtonProps) {
  const dayLabel = String(date.getDate());

  const containerStyle = [
    styles.dayCell,
    isRangeMiddle && styles.dayCellRangeMiddle,
    isRangeStart && styles.dayCellRangeStart,
    isRangeEnd && styles.dayCellRangeEnd,
  ];

  const innerStyle = [
    styles.dayInner,
    isSelected && !isRangeMiddle && styles.dayInnerSelected,
    isRangeStart && styles.dayInnerRangeStart,
    isRangeEnd && styles.dayInnerRangeEnd,
    isToday && !isSelected && styles.dayInnerToday,
    isDisabled && styles.dayInnerDisabled,
  ];

  const textStyle = [
    styles.dayText,
    isOutside && styles.dayTextOutside,
    isSelected && !isRangeMiddle && styles.dayTextSelected,
    isRangeStart && styles.dayTextSelected,
    isRangeEnd && styles.dayTextSelected,
    isRangeMiddle && styles.dayTextRangeMiddle,
    isDisabled && styles.dayTextDisabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={date.toDateString()}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      hitSlop={2}
    >
      {({ pressed }) => (
        <View
          style={[innerStyle, pressed && !isDisabled && styles.dayInnerPressed]}
        >
          <Text style={textStyle}>{dayLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Sélection helpers ─────────────────────────────────────────────────────
function isCellSelected(
  date: Date,
  mode: CalendarMode,
  selected?: Date,
  range?: DateRange,
): boolean {
  if (mode === "single") {
    return isSameDay(date, selected);
  }
  return (
    isSameDay(date, range?.from) ||
    isSameDay(date, range?.to) ||
    isCellRangeMiddle(date, range)
  );
}

function isCellRangeStart(date: Date, range?: DateRange): boolean {
  return isSameDay(date, range?.from);
}

function isCellRangeEnd(date: Date, range?: DateRange): boolean {
  return isSameDay(date, range?.to);
}

function isCellRangeMiddle(date: Date, range?: DateRange): boolean {
  if (!range?.from || !range?.to) return false;
  return date > range.from && date < range.to;
}

// ── Styles ────────────────────────────────────────────────────────────────
const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignSelf: "flex-start",
    minWidth: CELL_SIZE * 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  navButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  monthLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayCell: {
    width: CELL_SIZE,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: CELL_SIZE * 7,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellRangeMiddle: {
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  dayCellRangeStart: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  dayCellRangeEnd: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInnerSelected: {
    backgroundColor: "#8B5CF6",
  },
  dayInnerRangeStart: {
    backgroundColor: "#8B5CF6",
  },
  dayInnerRangeEnd: {
    backgroundColor: "#8B5CF6",
  },
  dayInnerToday: {
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.6)",
  },
  dayInnerPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dayInnerDisabled: {
    opacity: 0.3,
  },
  dayText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  dayTextOutside: {
    color: "rgba(255,255,255,0.25)",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  dayTextRangeMiddle: {
    color: "#A78BFA",
  },
  dayTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
});

export default Calendar;
