/**
 * Dincharya Focus OS - HTML5 Native Desktop Push Notifications
 * 
 * Manages system notifications so the user never misses an hourly time-block
 * transition even if the browser tab or PWA window is minimized.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return "denied";
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export function dispatchDesktopNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      silent: true, // We synthesize our own high-fidelity Web Audio chime
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("[Notification] Could not dispatch desktop notification:", err);
    return null;
  }
}
