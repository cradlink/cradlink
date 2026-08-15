import { useEffect, useRef, useState } from "react"
import {
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native"

import { Avatar } from "@/components/Avatar"
import { Text, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useReplies, MAX_BODY } from "@/hooks/use-replies"
import { useToast } from "@/hooks/use-toast"

const CARD = "#16181c"
const { width: SCREEN_W } = Dimensions.get("window")
const CARD_W = Math.min(SCREEN_W - 48, 360)

export function ReplyComposeHost() {
  const theme = useTheme()
  const { user } = useAuth()
  const { composing, closeCompose, add } = useReplies()
  const activity = composing?.activity ?? null
  const parent = composing?.parent ?? null
  const { show } = useToast()
  const { messages, tx } = useI18n()
  const inputRef = useRef<TextInput>(null)
  const [body, setBody] = useState("")
  const [busy, setBusy] = useState(false)
  const trimmed = body.trim()
  const canSend = Boolean(composing) && trimmed.length > 0 && trimmed.length <= MAX_BODY && !busy

  useEffect(() => {
    if (!composing) {
      setBody("")
      setBusy(false)
      return
    }
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeCompose()
      return true
    })
    const focus = setTimeout(() => inputRef.current?.focus(), 320)
    return () => {
      sub.remove()
      clearTimeout(focus)
    }
  }, [closeCompose, composing])

  async function send() {
    if (!activity || !canSend) return
    setBusy(true)
    try {
      await add(activity.id, trimmed, parent?.id ?? null)
      show({ title: messages.reply.posted })
      closeCompose()
    } catch {
      show({ title: messages.reply.couldnt, tone: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      visible={Boolean(composing)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={closeCompose}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.dim} onPress={closeCompose} />
        <View style={[styles.card, { borderColor: theme.border }]}>
          <Text style={styles.title}>{messages.reply.action}</Text>
          {parent ? (
            <>
              <Text style={styles.sub} lightColor="#536471" darkColor="#71767b" numberOfLines={1}>
                {tx(messages.reply.replyingTo, { name: parent.userName })}
              </Text>
              <Text style={styles.quote} lightColor="#536471" darkColor="#71767b" numberOfLines={2}>
                {parent.body}
              </Text>
            </>
          ) : activity ? (
            <Text style={styles.sub} lightColor="#536471" darkColor="#71767b" numberOfLines={1}>
              {activity.title}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Avatar name={user?.displayName ?? messages.common.you} src={user?.avatarUrl} size={36} />
            <TextInput
              ref={inputRef}
              value={body}
              onChangeText={setBody}
              placeholder={messages.reply.placeholder}
              placeholderTextColor={theme.mutedForeground}
              keyboardAppearance="dark"
              selectionColor={theme.primary}
              multiline
              maxLength={MAX_BODY}
              style={[styles.input, { color: theme.foreground }]}
            />
          </View>
          <Pressable
            onPress={() => void send()}
            disabled={!canSend}
            style={({ pressed }) => [
              styles.send,
              {
                backgroundColor: theme.foreground,
                opacity: !canSend ? 0.35 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.sendLabel, { color: theme.background }]}>
              {busy ? messages.reply.sending : messages.reply.send}
            </Text>
          </Pressable>
          <Pressable
            onPress={closeCompose}
            style={({ pressed }) => [styles.cancel, { borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.cancelLabel}>{messages.common.cancel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  card: {
    width: CARD_W,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
  },
  quote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 72,
    maxHeight: 140,
    fontSize: 16,
    lineHeight: 21,
    padding: 0,
    textAlignVertical: "top",
  },
  send: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  sendLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  cancel: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
})
