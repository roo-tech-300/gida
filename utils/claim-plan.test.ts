import { computeClaimPlan, reservationSuccessMessage } from './claim-plan';

describe('computeClaimPlan', () => {
  it('treats "no roommates" as a two-step solo buyout', () => {
    expect(computeClaimPlan(false, 3, 2, 1)).toEqual({
      isBuyout: true, hasFriendsStep: false, totalSteps: 2, peopleTotal: 1, matchedCount: 0, codeSeats: 0,
    });
  });

  it('adds a friends step only when the user brings friends', () => {
    expect(computeClaimPlan(true, 2, 0, 0)).toMatchObject({ totalSteps: 4, hasFriendsStep: false, peopleTotal: 3, matchedCount: 2 });
    expect(computeClaimPlan(true, 3, 2, 1)).toMatchObject({ totalSteps: 5, hasFriendsStep: true, matchedCount: 1, codeSeats: 1 });
  });

  it('never goes negative', () => {
    expect(computeClaimPlan(true, 1, 3, 5)).toMatchObject({ matchedCount: 0, codeSeats: 0 });
  });
});

describe('reservationSuccessMessage', () => {
  it('describes each outcome', () => {
    expect(reservationSuccessMessage(true, 0)).toMatch(/solo/);
    expect(reservationSuccessMessage(false, 1)).toMatch(/1 roommate for you/);
    expect(reservationSuccessMessage(false, 2)).toMatch(/2 roommates for you/);
    expect(reservationSuccessMessage(false, 0)).toMatch(/Invite your friends/);
  });
});
