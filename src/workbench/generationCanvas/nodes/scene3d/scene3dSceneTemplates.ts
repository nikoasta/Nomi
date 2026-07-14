// 场景模板：一键搭好的灰模布景（城市街道/室内房间）。纯 builder——只产对象数组，
// **追加**进当前场景、绝不清用户已摆的东西（never-wipe 纪律）。
// 尺寸单位米；道具走 scene3dProps 的 spec（P1 无第二套道具），地面/家具用 mesh 图元。
import type { Scene3DObject, Scene3DPropKind, Scene3DVector3 } from './scene3dTypes'
import { createScene3DObjectId } from './scene3dSerializer'
import { makePropObject } from './scene3dPropSpecs'

export type Scene3DSceneTemplate = 'street' | 'room'

export const SCENE_TEMPLATE_LABEL: Record<Scene3DSceneTemplate, string> = {
  street: 'City street',
  room: 'Interior room',
}

export const SCENE_TEMPLATES: Scene3DSceneTemplate[] = ['street', 'room']

function meshBlock(
  name: string,
  color: string,
  scale: Scene3DVector3,
  position: Scene3DVector3,
  rotation: Scene3DVector3 = [0, 0, 0],
): Scene3DObject {
  return {
    id: createScene3DObjectId(),
    name,
    type: 'mesh',
    visible: true,
    position,
    rotation,
    scale,
    color,
    geometry: 'box',
  }
}

/** 平铺地面：plane 旋转平放，scale[0]=宽(x)、scale[1]=长(z)。微抬 y 避免与网格 z-fight。 */
function groundPlane(name: string, color: string, width: number, length: number, y = 0.02): Scene3DObject {
  return {
    id: createScene3DObjectId(),
    name,
    type: 'mesh',
    visible: true,
    position: [0, y, 0],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [width, length, 1],
    color,
    geometry: 'plane',
  }
}

function prop(kind: Scene3DPropKind, name: string, position: Scene3DVector3, rotationY = 0, scale?: Scene3DVector3): Scene3DObject {
  const object = makePropObject(kind)
  object.name = name
  object.position = position
  object.rotation = [0, rotationY, 0]
  if (scale) object.scale = scale
  return object
}

function buildStreet(): Scene3DObject[] {
  const objects: Scene3DObject[] = [
    groundPlane('Road', '#5a5d63', 8, 40),
    // 人行道两侧
    meshBlock('Sidewalk left', '#8f8a80', [3, 0.15, 40], [-5.5, 0.075, 0]),
    meshBlock('Sidewalk right', '#8f8a80', [3, 0.15, 40], [5.5, 0.075, 0]),
  ]
  // 中央虚线车道线（8 段）
  for (let index = 0; index < 8; index += 1) {
    objects.push(meshBlock('Lane marker', '#e8e4da', [0.15, 0.02, 2], [0, 0.04, -17.5 + index * 5]))
  }
  // 两侧楼块（错落高度）
  const buildingHeights = [1.0, 0.7, 1.3, 0.85, 1.15, 0.75]
  buildingHeights.forEach((heightScale, index) => {
    const side = index % 2 === 0 ? -1 : 1
    const z = -15 + Math.floor(index / 2) * 15
    objects.push(prop('building', 'Building', [side * 11, 0, z], 0, [1, heightScale, 1]))
  })
  // 行道树 + 路灯（路灯灯臂朝马路）
  for (const z of [-12, 0, 12]) {
    objects.push(prop('tree', 'Street tree', [-5.5, 0.15, z + 2]))
    objects.push(prop('tree', 'Street tree', [5.5, 0.15, z - 2]))
  }
  objects.push(prop('streetlamp', 'Streetlamp', [-4.6, 0.15, -8], 0))
  objects.push(prop('streetlamp', 'Streetlamp', [4.6, 0.15, 8], Math.PI))
  // 对向两辆车
  objects.push(prop('car', 'Car', [-2, 0.02, 6], 0))
  objects.push(prop('car', 'Car', [2, 0.02, -6], Math.PI))
  return objects
}

function buildRoom(): Scene3DObject[] {
  return [
    groundPlane('Floor', '#a89f90', 8, 6),
    // 三面墙（后 + 左右），门面留空给相机
    prop('wall', 'Back wall', [0, 0, -3], 0, [2, 1.1, 1]),
    prop('wall', 'Left wall', [-4, 0, 0], Math.PI / 2, [1.5, 1.1, 1]),
    prop('wall', 'Right wall', [4, 0, 0], Math.PI / 2, [1.5, 1.1, 1]),
    // 家具灰模
    meshBlock('Bed', '#b8aa98', [1.8, 0.5, 2.1], [-2.4, 0.25, -1.6]),
    meshBlock('Table', '#9d8f7c', [1.6, 0.75, 0.8], [2.2, 0.375, -2.2]),
    meshBlock('Sofa', '#8d9aa5', [2.0, 0.7, 0.9], [1.6, 0.35, 1.8], [0, Math.PI, 0]),
    {
      id: createScene3DObjectId(),
      name: 'Ceiling light',
      type: 'light',
      visible: true,
      position: [0, 2.6, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      lightType: 'point',
      lightColor: '#fff2dd',
      lightIntensity: 2.2,
    },
  ]
}

export function buildSceneTemplateObjects(template: Scene3DSceneTemplate): Scene3DObject[] {
  return template === 'street' ? buildStreet() : buildRoom()
}
