export type ClaimPlan = {
  isBuyout: boolean;
  hasFriendsStep: boolean;
  totalSteps: number;
  /** Everyone sharing the place, including the person reserving. */
  peopleTotal: number;
  /** Roommates Gida still has to find. */
  matchedCount: number;
  /** Seats reserved for friends who will join with the invite code. */
  codeSeats: number;
};

/** Derives the shape of a reservation from the answers given in the claim wizard. */
export function computeClaimPlan(
  wantsRoommates: boolean | null,
  roommateCount: number,
  haveCount: number,
  friendCount: number,
): ClaimPlan {
  const isBuyout = wantsRoommates === false;
  const hasFriendsStep = !isBuyout && haveCount > 0;
  return {
    isBuyout,
    hasFriendsStep,
    totalSteps: isBuyout ? 2 : hasFriendsStep ? 5 : 4,
    peopleTotal: isBuyout ? 1 : 1 + roommateCount,
    matchedCount: isBuyout ? 0 : Math.max(0, roommateCount - haveCount),
    codeSeats: isBuyout ? 0 : Math.max(0, haveCount - friendCount),
  };
}

export function reservationSuccessMessage(isBuyout: boolean, matchedCount: number): string {
  if (isBuyout) return "Spot reserved! You're all set for solo living.";
  if (matchedCount > 0) {
    return `Spot secured! ${matchedCount} open seat${matchedCount === 1 ? ' is' : 's are'} now listed for students who want roommates.`;
  }
  return 'Spot secured! Invite your friends to keep the group together.';
}
