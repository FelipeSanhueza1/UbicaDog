/**
 * Web Push and Browser Notification Service for UbicaDog
 * Manages desktop and mobile browser notifications for real-time proximity alerts
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { onClickUrl?: string }
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const defaultIcon = '/icon.svg';
    const notification = new Notification(title, {
      icon: options?.icon || defaultIcon,
      badge: defaultIcon,
      tag: 'ubicadog-proximity-alert',
      ...options,
    });

    if (options?.onClickUrl) {
      notification.onclick = () => {
        window.focus();
        window.location.href = options.onClickUrl!;
        notification.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('Could not display browser notification:', err);
    return false;
  }
}
