import { useEffect, useRef, useState } from "react"
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"

import { Text, useTheme } from "@/components/Themed"
import { activityImages } from "@/lib/banners"
import type { Activity } from "@/lib/types"

export function ActivityCover({
  activity,
  compact = true,
}: {
  activity: Pick<Activity, "type" | "images" | "title">
  compact?: boolean
}) {
  const theme = useTheme()
  const pager = useRef<ScrollView>(null)
  const images = activityImages(activity)
  const [width, setWidth] = useState(0)
  const [page, setPage] = useState(0)
  const height = compact ? 168 : 220

  useEffect(() => {
    setPage(0)
    pager.current?.scrollTo({ x: 0, animated: false })
  }, [activity.images.join("|"), activity.type])

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return
    const next = Math.round(event.nativeEvent.contentOffset.x / width)
    if (next !== page && next >= 0 && next < images.length) setPage(next)
  }

  function goTo(index: number) {
    setPage(index)
    if (width) pager.current?.scrollTo({ x: index * width, animated: true })
  }

  return (
    <View style={styles.wrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View
        style={[
          styles.frame,
          { height, borderColor: theme.border, backgroundColor: theme.background },
        ]}
      >
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEnabled={images.length > 1 && width > 0}
        >
          {images.map((source, index) => (
            <Image
              key={`${activity.title}-${index}`}
              source={source}
              accessibilityLabel={activity.title}
              resizeMode="cover"
              style={{ width: width || 1, height }}
            />
          ))}
        </ScrollView>
        {images.length > 1 ? (
          <>
            <View style={styles.count}>
              <Text style={styles.countText}>
                {page + 1}/{images.length}
              </Text>
            </View>
            <View style={styles.dots}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, index === page ? styles.dotOn : styles.dotOff]}
                />
              ))}
            </View>
          </>
        ) : null}
      </View>
      {!compact && images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.map((source, index) => (
            <Pressable
              key={`thumb-${index}`}
              onPress={() => goTo(index)}
              style={[
                styles.thumb,
                { borderColor: index === page ? theme.foreground : theme.border },
              ]}
            >
              <Image source={source} style={styles.thumbImage} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "stretch",
    width: "100%",
  },
  frame: {
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  count: {
    position: "absolute",
    right: 8,
    top: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: "#fff",
  },
  dotOff: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  thumbs: {
    marginTop: 8,
    gap: 8,
  },
  thumb: {
    width: 72,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
})
