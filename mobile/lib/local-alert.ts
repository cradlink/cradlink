export async function showLocalAlert(title: string, body: string) {
  try {
    const Notifications = await import("expo-notifications")
    const current = await Notifications.getPermissionsAsync()
    const granted =
      current.status === "granted"
        ? true
        : (await Notifications.requestPermissionsAsync()).status === "granted"
    if (!granted) return
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    })
  } catch {
    /* optional — Expo Go / missing native module */
  }
}
