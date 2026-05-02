export async function ensureNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const r = await Notification.requestPermission();
  return r === "granted";
}

export function browserNotify(title: string, body?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico" }); } catch {}
  }
}
