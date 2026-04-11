import { useEffect, useState } from "react";

function formatTime(msRemaining) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function useCountdown(targetDate) {
  const [value, setValue] = useState("30:00");

  useEffect(() => {
    if (!targetDate) {
      return undefined;
    }

    const targetTime = new Date(targetDate).getTime();

    function updateCountdown() {
      setValue(formatTime(targetTime - Date.now()));
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetDate]);

  return value;
}

export default useCountdown;
