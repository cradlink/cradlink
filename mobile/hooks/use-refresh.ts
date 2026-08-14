import { useCallback, useRef, useState } from "react"

import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useMemberships } from "@/hooks/use-memberships"
import { useNotifications } from "@/hooks/use-notifications"

const MIN_MS = 540

export function useReloadAll() {
  const { reload: reloadActivities } = useActivities()
  const { reload: reloadMemberships } = useMemberships()
  const { reload: reloadUser } = useAuth()
  const { reload: reloadNotifications } = useNotifications()

  return useCallback(async () => {
    await Promise.all([reloadActivities(), reloadMemberships(), reloadUser(), reloadNotifications()])
  }, [reloadActivities, reloadMemberships, reloadNotifications, reloadUser])
}

export function usePullRefresh(load: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false)
  const [generation, setGeneration] = useState(0)
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setRefreshing(true)
    const started = Date.now()
    try {
      await load()
    } finally {
      const wait = MIN_MS - (Date.now() - started)
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
      setRefreshing(false)
      setGeneration((value) => value + 1)
      busy.current = false
    }
  }, [load])

  return { refreshing, generation, refresh }
}
