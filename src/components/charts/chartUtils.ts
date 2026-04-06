import { Dimensions } from 'react-native';

export type { TimeSeriesPoint } from '../../services/dashboard.service';

export type GranularityMode = 'W' | 'M' | '3M' | '6M' | 'Y';
export type ChartMode = 'abs' | 'rel';

export interface YAxisInfo {
  labels: string[];
  sections: number;
  maxValue: number;
  minValue: number;
  yAxisWidth: number;
}

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const CHART_HEIGHT = 150;
export const X_LABEL_HEIGHT = 20;
export const SVG_HEIGHT = CHART_HEIGHT + X_LABEL_HEIGHT;
export const LONG_PRESS_MS = 500;

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
export const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const TIME_RANGES = [
  { label: '4W', value: 4 },
  { label: '8W', value: 8 },
  { label: '3M', value: 12 },
  { label: '6M', value: 26 },
  { label: '1Y', value: 52 },
  { label: '2Y', value: 104 },
  { label: 'All', value: 0 },
];

export const GRANULARITY_MODES: { key: GranularityMode; label: string }[] = [
  { key: 'W', label: 'W' },
  { key: 'M', label: 'M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: 'Y', label: 'Y' },
];

export function viewportPoints(mode: GranularityMode): number {
  if (mode === 'W') return 7;
  if (mode === 'M') return 31;
  if (mode === '3M') return 13;
  if (mode === '6M') return 26;
  return 12;
}

export function formatKeyDate(key: string, mode: GranularityMode): string {
  if (mode === 'Y') {
    return `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
  }
  if (mode === '6M' || mode === '3M') {
    const dt = new Date(key + 'T00:00:00');
    const endDt = new Date(dt);
    endDt.setDate(endDt.getDate() + 6);
    const sM = MONTH_NAMES[dt.getMonth()];
    const eM = MONTH_NAMES[endDt.getMonth()];
    if (dt.getFullYear() === endDt.getFullYear()) {
      if (sM === eM) return `${sM} ${dt.getDate()} – ${endDt.getDate()}, ${dt.getFullYear()}`;
      return `${sM} ${dt.getDate()} – ${eM} ${endDt.getDate()}, ${dt.getFullYear()}`;
    }
    return `${sM} ${dt.getDate()}, ${dt.getFullYear()} – ${eM} ${endDt.getDate()}, ${endDt.getFullYear()}`;
  }
  const m = Number(key.slice(5, 7)) - 1;
  const d = Number(key.slice(8));
  return `${MONTH_NAMES[m]} ${d}`;
}

export function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export function formatPointDate(ts: number): string {
  const d = new Date(ts);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function computePointSpacing(mode: GranularityMode, chartWidth: number): number {
  return chartWidth / viewportPoints(mode);
}

export function formatDateRange(
  points: { date: number }[],
  firstIdx: number,
  lastIdx: number,
  mode: GranularityMode,
): string {
  if (points.length === 0) return '';
  const clampFirst = Math.max(0, Math.min(firstIdx, points.length - 1));
  const clampLast = Math.max(0, Math.min(lastIdx, points.length - 1));
  const startDate = new Date(points[clampFirst].date);
  const endDate = new Date(points[clampLast].date);

  if (mode === 'W') {
    const sMonth = MONTH_NAMES[startDate.getMonth()];
    const eMonth = MONTH_NAMES[endDate.getMonth()];
    if (sMonth === eMonth && startDate.getFullYear() === endDate.getFullYear()) {
      return `${sMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${sMonth} ${startDate.getDate()} – ${eMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    return `${sMonth} ${startDate.getDate()}, ${startDate.getFullYear()} – ${eMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }

  if (mode === 'M') {
    const sMonth = MONTH_NAMES[startDate.getMonth()];
    const eMonth = MONTH_NAMES[endDate.getMonth()];
    if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${sMonth} ${startDate.getDate()} – ${eMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    return `${sMonth} ${startDate.getDate()}, ${startDate.getFullYear()} – ${eMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }

  const sMonth = MONTH_NAMES[startDate.getMonth()];
  const eMonth = MONTH_NAMES[endDate.getMonth()];
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${sMonth} – ${eMonth} ${endDate.getFullYear()}`;
  }
  return `${sMonth} ${startDate.getFullYear()} – ${eMonth} ${endDate.getFullYear()}`;
}

function formatYValue(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

export function computeYAxisInfo(data: { value: number }[], minStep: number = 1): YAxisInfo {
  let maxVal = 0;
  let rawMin = Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i].value > maxVal) maxVal = data[i].value;
    if (data[i].value > 0 && data[i].value < rawMin) rawMin = data[i].value;
  }
  maxVal *= 1.1;
  if (rawMin === Infinity) rawMin = 0;

  let step: number;
  let sections: number;
  let baseVal: number;

  if (maxVal <= 0) {
    step = minStep;
    sections = 2;
    baseVal = 0;
  } else {
    const floorMin = Math.max(0, rawMin * 0.75);
    baseVal = Math.floor(floorMin / minStep) * minStep;
    const range = maxVal - baseVal;
    step = Math.max(minStep, Math.ceil(range / 4 / minStep) * minStep);
    sections = Math.max(2, Math.min(4, Math.ceil(range / step)));
  }

  const topVal = baseVal + step * sections;

  const labels: string[] = [];
  let longestLen = 1;
  for (let i = 0; i <= sections; i++) {
    const lbl = formatYValue(baseVal + step * i);
    labels.push(lbl);
    if (lbl.length > longestLen) longestLen = lbl.length;
  }

  const yAxisWidth = Math.max(16, longestLen * 7 + 4);

  return { labels, sections, maxValue: topVal, minValue: baseVal, yAxisWidth };
}

export function totalSlotsForRange(weeks: number, mode: GranularityMode): number {
  if (weeks === 0) {
    if (mode === 'Y') return 10 * 12;
    if (mode === '6M' || mode === '3M') return 10 * 52;
    if (mode === 'M') return 10 * 365;
    return 10 * 365;
  }
  const days = weeks * 7;
  if (mode === 'Y') return Math.ceil(days / 30);
  if (mode === '6M' || mode === '3M') return Math.ceil(days / 7);
  return days;
}

export function slotIndexForPoint(
  point: { date: number },
  rangeEndMs: number,
  totalSlots: number,
  mode: GranularityMode,
): number {
  const msPerDay = 86400000;
  if (mode === 'Y') {
    const endDate = new Date(rangeEndMs);
    const ptDate = new Date(point.date);
    const monthDiff =
      (endDate.getFullYear() - ptDate.getFullYear()) * 12 +
      (endDate.getMonth() - ptDate.getMonth());
    return totalSlots - 1 - monthDiff;
  }
  if (mode === '6M' || mode === '3M') {
    const daysDiff = Math.round((rangeEndMs - point.date) / msPerDay);
    const weeksDiff = Math.round(daysDiff / 7);
    return totalSlots - 1 - weeksDiff;
  }
  const daysDiff = Math.round((rangeEndMs - point.date) / msPerDay);
  return totalSlots - 1 - daysDiff;
}

export function xLabelInterval(_mode: GranularityMode): number {
  return 1;
}

export function slotToXLabel(slotIdx: number, totalSlots: number, nowMs: number, mode: GranularityMode): string {
  const msPerDay = 86400000;
  if (mode === 'Y') {
    const end = new Date(nowMs);
    const d = new Date(end.getFullYear(), end.getMonth() - (totalSlots - 1 - slotIdx), 1);
    return MONTH_INITIALS[d.getMonth()];
  }
  if (mode === '3M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * 7 * msPerDay;
    const d = new Date(ts);
    const prevTs = nowMs - (totalSlots - slotIdx) * 7 * msPerDay;
    const prev = new Date(prevTs);
    if (slotIdx === 0 || prev.getMonth() !== d.getMonth()) {
      return MONTH_NAMES[d.getMonth()];
    }
    return '';
  }
  if (mode === '6M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * 7 * msPerDay;
    const d = new Date(ts);
    const prevTs = nowMs - (totalSlots - slotIdx) * 7 * msPerDay;
    const prev = new Date(prevTs);
    if (prev.getMonth() !== d.getMonth()) return MONTH_NAMES[d.getMonth()];
    return '';
  }
  if (mode === 'M') {
    const ts = nowMs - (totalSlots - 1 - slotIdx) * msPerDay;
    const d = new Date(ts);
    if (d.getDay() === 1) return String(d.getDate());
    return '';
  }
  const ts = nowMs - (totalSlots - 1 - slotIdx) * msPerDay;
  const d = new Date(ts);
  return DAY_INITIALS[d.getDay()];
}
