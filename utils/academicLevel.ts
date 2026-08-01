export const CURRENT_ACADEMIC_YEAR = 2026;

export interface StudentAcademicInfo {
  entryYear?: number;
  programDuration?: number;
}

export function calculateStudentLevel(info: StudentAcademicInfo): string {
  if (!info.entryYear) return 'N/A';
  const yearsInSchool = CURRENT_ACADEMIC_YEAR - info.entryYear + 1;
  if (yearsInSchool <= 0) return '100L';
  const calculatedLevel = yearsInSchool * 100;
  const maxLevel = (info.programDuration || 5) * 100;
  return calculatedLevel > maxLevel ? 'Alumni' : `${calculatedLevel}L`;
}

export function calculateAge(birthYear?: number): number | null {
  if (!birthYear) return null;
  return CURRENT_ACADEMIC_YEAR - birthYear;
}

export function birthYearFromAge(age: number): number {
  return CURRENT_ACADEMIC_YEAR - age;
}

export function entryYearFromLevel(level: number): number {
  return CURRENT_ACADEMIC_YEAR - level / 100 + 1;
}
