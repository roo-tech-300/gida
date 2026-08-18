import type { MyPreferences } from '@/services/roommateService';
import type { RoommateProfile } from '@/types/roommates';

export type MatchBreakdown = {
  score: number;
  reasons: string[];
  isReady: boolean;
};

const CLEANLINESS_ORDER = ['Low', 'Medium', 'High', 'Very High'];

function chipValue(profile: RoommateProfile, label: string): string | undefined {
  return profile.chips.find((c) => c.label === label)?.value;
}

function normalizeArea(area: string | null | undefined): string {
  return (area ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function computeCompatibility(
  mine: MyPreferences | null,
  theirs: RoommateProfile,
): MatchBreakdown {
  if (!mine?.roommate) {
    return {
      score: 0,
      reasons: ['Complete your roommate profile to see your match.'],
      isReady: false,
    };
  }

  const reasons: string[] = [];
  let score = 50;
  const myRp = mine.roommate;
  const myLp = mine.living;

  const theirClean = chipValue(theirs, 'Clean');
  const myClean = myRp.cleanliness_level;
  if (theirClean && myClean) {
    const theirIndex = CLEANLINESS_ORDER.indexOf(theirClean);
    const myIndex = CLEANLINESS_ORDER.indexOf(myClean);
    if (theirIndex >= 0 && myIndex >= 0) {
      if (Math.abs(theirIndex - myIndex) <= 1) {
        score += 10;
        reasons.push('You have similar cleanliness expectations.');
      } else {
        score -= 8;
        reasons.push('Your cleanliness expectations differ a bit.');
      }
    }
  }

  const theirSleep = chipValue(theirs, 'Sleep');
  const mySleep = myRp.sleep_schedule;
  if (theirSleep && mySleep) {
    if (theirSleep === mySleep) {
      score += 8;
      reasons.push('You share the same sleep schedule.');
    } else if (theirSleep.toLowerCase().includes('night') === mySleep.toLowerCase().includes('night')) {
      score += 4;
      reasons.push('You are both on a similar day-night rhythm.');
    }
  }

  const theirVibe = chipValue(theirs, 'Vibe');
  const myVibe = myRp.personality_vibe;
  if (theirVibe && myVibe && theirVibe === myVibe) {
    score += 6;
    reasons.push('Your personality vibes match.');
  }

  const theirGuests = chipValue(theirs, 'Guests');
  const myGuests = myRp.guest_policy;
  if (theirGuests && myGuests && theirGuests === myGuests) {
    score += 6;
    reasons.push('You both agree on the guest policy.');
  }

  const theirStudy = chipValue(theirs, 'Study');
  const myStudy = myRp.study_habitat;
  if (theirStudy && myStudy && theirStudy === myStudy) {
    score += 6;
    reasons.push('You prefer a similar study environment.');
  }

  const mySmokeFree = myRp.smoker_allowed === false;
  if (mySmokeFree) {
    if (theirs.smokerAllowed === true) {
      score -= 10;
      reasons.push('They are open to smoking; you prefer smoke-free.');
    } else if (theirs.smokerAllowed === false) {
      score += 6;
      reasons.push('You both want a smoke-free space.');
    }
  }

  const myBudget = myLp?.max_budget ?? null;
  if (myBudget && theirs.maxBudget) {
    const ratio = Math.min(myBudget, theirs.maxBudget) / Math.max(myBudget, theirs.maxBudget);
    if (ratio >= 0.6) {
      score += 6;
      reasons.push('Your budgets align well.');
    }
  }

  const myArea = myLp?.preferred_area ?? null;
  if (myArea && theirs.preferredArea && normalizeArea(myArea) === normalizeArea(theirs.preferredArea)) {
    score += 5;
    reasons.push('You are both looking in the same area.');
  }

  if (reasons.length === 0) {
    reasons.push('No overlapping preferences yet — Say Hello to find out more.');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    isReady: true,
  };
}
