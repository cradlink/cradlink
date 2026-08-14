import { useCallback, useEffect, useState } from "react"

import { getFireflies, setFireflies, subscribeFireflies } from "@/lib/fireflies"

export function useFireflies() {
  const [on, setOn] = useState(getFireflies)

  useEffect(() => subscribeFireflies(() => setOn(getFireflies())), [])

  const setEnabled = useCallback((next: boolean) => {
    void setFireflies(next)
  }, [])

  return { on, setEnabled }
}
