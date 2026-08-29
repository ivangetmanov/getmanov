function parseCalendarDate(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) return null;

  return { year, month, day };
}

export function isCalendarDateKey(key) {
  return Boolean(parseCalendarDate(key));
}

function calendarDateOrdinal(key) {
  const parsed = parseCalendarDate(key);
  if (!parsed) throw new TypeError(`Invalid calendar date: ${key}`);

  let { year } = parsed;
  const { month, day } = parsed;
  year -= month <= 2 ? 1 : 0;

  const era = Math.floor(year / 400);
  const yearOfEra = year - era * 400;
  const shiftedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365
    + Math.floor(yearOfEra / 4)
    - Math.floor(yearOfEra / 100)
    + dayOfYear;

  return era * 146097 + dayOfEra;
}

export function calendarDayDifference(arrival, departure) {
  return calendarDateOrdinal(departure) - calendarDateOrdinal(arrival);
}

export function billableStayDays(arrival, departure) {
  if (!arrival || !departure) return 0;
  const difference = calendarDayDifference(arrival, departure);
  return difference > 0 ? Math.max(2, difference) : 0;
}

export function isDateUnavailable(key, periods) {
  return periods.some((period) => key >= period.from && key <= period.to);
}
