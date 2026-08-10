export type TargetOccupancyOption = {
  targetOccupancy: number;
  label: string;
  description: string;
};

export function isValidTargetOccupancy(maxRoommates: number, targetOccupancy: number): boolean {
  return targetOccupancy >= 1 && targetOccupancy <= maxRoommates && Number.isInteger(targetOccupancy);
}

export function getTargetOccupancyOptions(maxRoommates: number): TargetOccupancyOption[] {
  const options: TargetOccupancyOption[] = [];
  const max = (maxRoommates > 0 && maxRoommates <= 8) ? maxRoommates : 4;
  
  for (let i = 1; i <= max; i++) {
    let label = '';
    let description = '';
    
    if (i === 1) {
      label = 'Just Me (Private)';
      description = 'You get the entire property to yourself.';
    } else {
      const roommateCount = i - 1;
      label = `Live with ${roommateCount} Roommate${roommateCount > 1 ? 's' : ''} (${i} People Total)`;
      description = i === max 
        ? `Most affordable. Share the house with ${roommateCount} matched roommate${roommateCount > 1 ? 's' : ''}.`
        : `You get a private room, sharing common areas with ${roommateCount} matched roommate${roommateCount > 1 ? 's' : ''}.`;
    }
    
    options.push({
      targetOccupancy: i,
      label,
      description,
    });
  }
  return options;
}

export function calculateBaseRent(totalRent: number, targetOccupancy: number): number {
  if (targetOccupancy <= 0) return 0;
  return Math.ceil(totalRent / targetOccupancy);
}

export function calculatePlatformFee(totalPodFee: number, targetOccupancy: number): number {
  if (targetOccupancy <= 0) return 0;
  return Math.ceil(totalPodFee / targetOccupancy);
}

export function calculateTotalUserCost(totalRent: number, totalPodFee: number, targetOccupancy: number): number {
  return calculateBaseRent(totalRent, targetOccupancy) + calculatePlatformFee(totalPodFee, targetOccupancy);
}

export function verifyPodCompleteness(currentTotalIntent: number, targetOccupancy: number): boolean {
  return currentTotalIntent === targetOccupancy && targetOccupancy > 0;
}
