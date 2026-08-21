import { parse } from "csv-parse/sync";

/**
 * Parses uploaded CSV buffer into normalized survey record objects ready
 * for MongoDB insertion. Expected columns (case-insensitive):
 * recordId, district, enumeratorId, surveyDate, age, gender, education,
 * employmentStatus, householdSize, weeklyHours, monthlyIncome
 */
export function parseSurveyCSV(buffer, surveyId) {
  const rows = parse(buffer, { columns: true, skip_empty_lines: true, trim: true });

  return rows.map((row, idx) => ({
    recordId: row.recordId || `${surveyId}_${Date.now()}_${idx}`,
    surveyId,
    district: row.district,
    enumeratorId: row.enumeratorId,
    surveyDate: row.surveyDate,
    data: {
      age: toNumber(row.age),
      gender: row.gender,
      education: row.education,
      employmentStatus: row.employmentStatus,
      householdSize: toNumber(row.householdSize),
      weeklyHours: toNumber(row.weeklyHours),
      monthlyIncome: toNumber(row.monthlyIncome),
    },
  }));
}

function toNumber(val) {
  if (val === undefined || val === "" || val === null) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}
