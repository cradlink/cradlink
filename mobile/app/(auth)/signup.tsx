import { SafeAreaView } from "react-native-safe-area-context"

import { AuthForm } from "@/components/auth/AuthForm"
import { View } from "@/components/Themed"

export default function SignupScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <AuthForm mode="signup" />
      </SafeAreaView>
    </View>
  )
}
