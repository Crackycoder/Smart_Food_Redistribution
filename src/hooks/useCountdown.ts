import { useEffect, useState } from "react";

export function useCountdown(target: string | Date) {
  const compute = () => {
    const t = typeof target === "string" ? new Date(target).getTime() : target.getTime();
    return Math.max(0, t - Date.now());
  };
  const [ms, setMs] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setMs(compute()), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const expired = ms <= 0;
  let label = "Expired";
  if (!expired) {
    if (days > 0) label = `${days}d ${hours}h left`;
    else if (hours > 0) label = `${hours}h ${minutes}m left`;
    else label = `${minutes}m left`;
  }
  return { ms, expired, label };
}
