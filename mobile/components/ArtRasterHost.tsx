import { useEffect, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import Svg, { G, Path, Rect, type Svg as SvgType } from "react-native-svg"
import { cacheDirectory, EncodingType, writeAsStringAsync } from "expo-file-system/legacy"

import { generatedColor, inkFor } from "@/lib/generated-art"

const LOGO_W = 392.262
const LOGO_H = 384.518

const PATH_A =
  "M264.463 99.726C264.779 99.5547 265.096 99.3835 265.413 99.2122C282.371 90.0432 288.936 68.5153 276.264 53.987C261.17 36.6824 242.38 22.7769 221.113 13.3972C189.124 -0.7117 153.351 -3.77856 119.427 4.6796C85.5032 13.1378 55.3568 32.6404 33.7359 60.1158C12.1149 87.5913 0.247925 121.478 0.00384521 156.44C-0.240204 191.401 11.1525 225.451 32.3878 253.225C53.623 281 83.4941 300.922 117.296 309.853C151.099 318.784 186.912 316.217 219.095 302.556C240.49 293.474 259.473 279.832 274.806 262.74C287.68 248.39 281.416 226.773 264.588 217.368C264.274 217.192 263.959 217.016 263.645 216.841C246.817 207.435 225.797 214.286 210.547 226.08C204.708 230.596 198.278 234.376 191.395 237.298C173.694 244.812 153.997 246.224 135.406 241.312C116.814 236.4 100.385 225.443 88.7059 210.167C77.0265 194.891 70.7605 176.164 70.8947 156.935C71.029 137.706 77.5558 119.068 89.4473 103.957C101.339 88.8451 117.919 78.1186 136.577 73.4666C155.235 68.8146 174.911 70.5014 192.505 78.2613C199.347 81.2791 205.723 85.1487 211.499 89.7461C226.582 101.752 247.505 108.895 264.463 99.726Z"
const PATH_B = "M0 54.745C0 24.5102 24.5101 0 54.7448 0C84.9795 0 109.49 24.5102 109.49 54.745C109.49 84.9798 84.9795 109.49 54.7448 109.49C24.5101 109.49 0 84.9798 0 54.745Z"
const PATH_C =
  "M0 43.3233C0 21.6617 6.39965 0 30.3265 0C54.2532 0 73.6494 19.3965 73.6494 43.3233C73.6494 67.2502 54.2532 86.6467 30.3265 86.6467C6.39965 86.6467 0 64.985 0 43.3233Z"

type Job = {
  width: number
  height: number
  color: string
  iconSize: number
  resolve: (uri: string) => void
  reject: (err: Error) => void
}

let start: ((job: Job) => void) | null = null
const waiting: Job[] = []

export function rasterizeGenerated(uri: string, kind: "avatar" | "banner") {
  const color = generatedColor(uri)
  const width = kind === "banner" ? 1200 : 512
  const height = kind === "banner" ? 400 : 512
  const iconSize = kind === "banner" ? 168 : 296
  return new Promise<string>((resolve, reject) => {
    const job: Job = { width, height, color, iconSize, resolve, reject }
    if (start) start(job)
    else waiting.push(job)
  })
}

export function ArtRasterHost() {
  const svgRef = useRef<SvgType>(null)
  const [job, setJob] = useState<Job | null>(null)
  const queue = useRef<Job[]>([])

  useEffect(() => {
    function run(next: Job) {
      if (job) queue.current.push(next)
      else setJob(next)
    }
    start = run
    waiting.splice(0).forEach(run)
    return () => {
      start = null
    }
  }, [job])

  useEffect(() => {
    if (!job) return
    const handle = job
    const timer = setTimeout(() => {
      const node = svgRef.current
      if (!node?.toDataURL) {
        handle.reject(new Error("raster"))
        setJob(queue.current.shift() ?? null)
        return
      }
      node.toDataURL(async (data) => {
        try {
          const raw = data.includes(",") ? data.split(",")[1] : data
          if (!raw) throw new Error("raster")
          const path = `${cacheDirectory}cradlink-art-${Date.now()}.png`
          await writeAsStringAsync(path, raw, { encoding: EncodingType.Base64 })
          handle.resolve(path)
        } catch (err) {
          handle.reject(err instanceof Error ? err : new Error("raster"))
        } finally {
          setJob(queue.current.shift() ?? null)
        }
      })
    }, 80)
    return () => clearTimeout(timer)
  }, [job])

  if (!job) return null
  const scale = job.iconSize / LOGO_W
  const tx = (job.width - LOGO_W * scale) / 2
  const ty = (job.height - LOGO_H * scale) / 2
  const ink = inkFor(job.color)

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={[styles.host, { width: job.width, height: job.height }]}
    >
      <Svg ref={svgRef} width={job.width} height={job.height} viewBox={`0 0 ${job.width} ${job.height}`}>
        <Rect x={0} y={0} width={job.width} height={job.height} fill={job.color} />
        <G transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <G transform="matrix(0.97 0.242 -0.242 0.97 76.224 0)">
            <Path d={PATH_A} fill={ink} fillRule="evenodd" transform="matrix(-1 0 0 -1 325.712 315.079)" />
            <Path d={PATH_B} fill={ink} fillRule="evenodd" transform="matrix(1 0 0 1 113.822 103.183)" />
            <Path d={PATH_C} fill={ink} fillRule="evenodd" transform="matrix(1 0 0 1 0 110.278)" />
          </G>
        </G>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0.02,
    zIndex: -1,
  },
})
