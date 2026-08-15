import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/use-auth"
import { usernameTaken } from "@/lib/data/account"
import { handleKey, handleTakenBy, normalizeUsername, usernameIssue } from "@/lib/username"

export function useHandleAvailability(value: string, exceptUserId?: string) {
  const { people } = useAuth()
  const handle = normalizeUsername(value)
  const [taken, setTaken] = useState(false)
  const [checking, setChecking] = useState(false)
  const peopleKey = people.map((person) => `${person.id}:${handleKey(person)}`).join("|")

  useEffect(() => {
    if (usernameIssue(handle) || handle.length < 3) {
      setTaken(false)
      setChecking(false)
      return
    }
    if (handleTakenBy(people, handle, exceptUserId)) {
      setTaken(true)
      setChecking(false)
      return
    }
    let live = true
    setChecking(true)
    const timer = setTimeout(() => {
      void usernameTaken(handle, exceptUserId, people)
        .then((hit) => {
          if (live) setTaken(hit)
        })
        .catch(() => {
          if (live) setTaken(true)
        })
        .finally(() => {
          if (live) setChecking(false)
        })
    }, 280)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [exceptUserId, handle, people, peopleKey])

  return { handle, taken, checking }
}
