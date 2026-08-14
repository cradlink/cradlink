import AsyncStorage from "@react-native-async-storage/async-storage"

const KEY = "cl.fireflies"

let on = true
const listeners = new Set<() => void>()

export function getFireflies() {
  return on
}

export function subscribeFireflies(listen: () => void) {
  listeners.add(listen)
  return () => {
    listeners.delete(listen)
  }
}

export async function loadFireflies() {
  const raw = await AsyncStorage.getItem(KEY)
  if (raw === "0") on = false
  if (raw === "1") on = true
  listeners.forEach((listen) => listen())
}

export async function setFireflies(next: boolean) {
  on = next
  listeners.forEach((listen) => listen())
  await AsyncStorage.setItem(KEY, next ? "1" : "0")
}
