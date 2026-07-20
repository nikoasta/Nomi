// 运镜参考工具的「语义词汇表」：人话运镜 → 3D 相机轨迹参数。
// 工具(create_camera_move)的 schema 描述直接引用这里的取值，单一真相源。
// 配 cameraMoveBuilder.ts（词汇 → Scene3DState）。见 docs/plan/2026-06-22-ai-camera-move-tool.md。
// 景别(StagingShot/SHOT_FRAMING)复用站位词汇表，不重复（单一真相源）。

import { SHOT_FRAMING, type StagingShot } from './stagingVocab'

export { SHOT_FRAMING }
export type { StagingShot }

// 运镜类型 = 13 个常用电影运镜（10 个机位运动 + 3 个 FOV 参与动画的变焦族）。
export type CameraMove =
  | 'orbit_left'
  | 'orbit_right'
  | 'push_in'
  | 'pull_out'
  | 'crane_up'
  | 'crane_down'
  | 'track_left'
  | 'track_right'
  | 'arc_left'
  | 'arc_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'dolly_zoom'

export const CAMERA_MOVES: CameraMove[] = [
  'orbit_left',
  'orbit_right',
  'push_in',
  'pull_out',
  'crane_up',
  'crane_down',
  'track_left',
  'track_right',
  'arc_left',
  'arc_right',
  'zoom_in',
  'zoom_out',
  'dolly_zoom',
]

// 变焦族（FOV 随段进度渐变，binding.fovFrom/fovTo）。
export const ZOOM_MOVES = new Set<CameraMove>(['zoom_in', 'zoom_out', 'dolly_zoom'])

// 运镜速度 → 时长（秒），落在 Seedance 3-8s 甜区内。
export type CameraSpeed = 'slow' | 'medium' | 'fast'
export const CAMERA_SPEED_DURATION: Record<CameraSpeed, number> = { slow: 8, medium: 5, fast: 3 }

// Camera-move labels used for trajectory names and prompt fallbacks.
export const CAMERA_MOVE_LABEL: Record<CameraMove, string> = {
  orbit_left: 'Orbit left',
  orbit_right: 'Orbit right',
  push_in: 'Push in',
  pull_out: 'Pull out',
  crane_up: 'Crane up',
  crane_down: 'Crane down',
  track_left: 'Track left',
  track_right: 'Track right',
  arc_left: 'Arc left',
  arc_right: 'Arc right',
  zoom_in: 'Zoom in',
  zoom_out: 'Zoom out',
  dolly_zoom: 'Dolly zoom',
}

// 运镜专属景别（distance/fov）——**不复用站位的 SHOT_FRAMING**（那套为「主体占画面」收紧，
// 可见竖向 < 主体身高 2.5，运镜里会把头/脚裁掉）。运镜要让整个 2.5 高的主体始终在框内且留余量：
// 目标「可见竖向 = 2·distance·tan(fov/2) ≥ 3.0」（主体 2.5 + 约 20% 余量），逐景别已验算（见单测）：
//   wide  : 2·7  ·tan(20°) ≈ 5.10
//   medium: 2·4.8·tan(20°) ≈ 3.49
//   close : 2·3.6·tan(23°) ≈ 3.06
// push_in 的近端距离 = medium 距离，故推到底也不裁。
export const CAMERA_MOVE_FRAMING: Record<StagingShot, { distance: number; fov: number }> = {
  wide: { distance: 7, fov: 40 },
  medium: { distance: 4.8, fov: 40 },
  close: { distance: 3.6, fov: 46 },
}

// 运镜人话描述（喂给 AI 的 schema，让它选对运镜）。
export const CAMERA_MOVE_DESC: Record<CameraMove, string> = {
  orbit_left: 'The camera makes a wide counterclockwise orbit around the subject, revealing the surrounding space.',
  orbit_right: 'The camera makes a wide clockwise orbit around the subject, revealing the surrounding space.',
  push_in: 'The camera pushes toward the subject from the front, gradually enlarging the subject and increasing focus.',
  pull_out: 'The camera pulls away from the subject, gradually revealing the environment or creating an exit feeling.',
  crane_up: 'The camera rises in front of the subject, moving from eye level toward a high angle.',
  crane_down: 'The camera lowers in front of the subject, moving from a high angle toward eye level or a low angle.',
  track_left: 'The camera tracks left in front of the subject while keeping roughly the same distance.',
  track_right: 'The camera tracks right in front of the subject while keeping roughly the same distance.',
  arc_left: 'The camera moves along a small counterclockwise arc around the subject, gently changing viewpoint.',
  arc_right: 'The camera moves along a small clockwise arc around the subject, gently changing viewpoint.',
  zoom_in: 'The camera position stays fixed while the lens zooms in, narrowing FOV and compressing space.',
  zoom_out: 'The camera position stays fixed while the lens zooms out, widening FOV and revealing more environment.',
  dolly_zoom: 'Dolly zoom: the camera pulls back while zooming in, keeping subject size stable while the background stretches.',
}
