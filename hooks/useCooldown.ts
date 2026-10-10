import { useEffect, useState } from 'react';

type CooldownTimer = {
    secondsLeft: number;
    isActive: boolean;
    start: (durationSeconds: number) => void;
};

/** Simple second-by-second countdown, used to rate-limit resend actions. */
export function useCooldown(initialSeconds = 0): CooldownTimer {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const start = (durationSeconds: number) => setSecondsLeft(durationSeconds);

    return { secondsLeft, isActive: secondsLeft > 0, start };
}