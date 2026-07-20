/**
 * 「确认 + 删除整个供应商」的单一来源（P1）。
 * 两个入口共用：① 卡头快捷删除图标（OnboardingDrawer）② 展开后「接入管理」区的删除按钮（CustomVendorManage）。
 * 后端 deleteVendor 是同步 IPC；本函数只负责确认框 + 调用 + onChanged 刷新，busy/error UI 由各调用方自管。
 */
import { getDesktopBridge } from '../../desktop/bridge'
import { confirmDialog } from '../../design'
import { translateDisplayText } from '../../i18n/displayText'
import { getRuntimeLocale } from '../../i18n/runtimeLocale'
import { runtimeT } from '../../i18n/runtimeTranslate'

export async function confirmAndDeleteVendor(args: {
  vendorKey: string
  vendorName: string
  modelCount: number
  onChanged: () => void
}): Promise<{ deleted: boolean; error?: string }> {
  const bridge = getDesktopBridge()
  if (!bridge) return { deleted: false }
  const locale = getRuntimeLocale()
  const vendorName = translateDisplayText(locale, args.vendorName)
  const ok = await confirmDialog({
    title: runtimeT('vendorCard.deleteVendor'),
    message: runtimeT('vendorCard.deleteVendorMessage', { name: vendorName, count: args.modelCount }),
    confirmLabel: runtimeT('common.delete'),
    danger: true,
  })
  if (!ok) return { deleted: false }
  try {
    bridge.modelCatalog.deleteVendor(args.vendorKey)
    args.onChanged()
    return { deleted: true }
  } catch (e) {
    return { deleted: false, error: runtimeT('vendorCard.deleteFailed', { message: e instanceof Error ? e.message : String(e) }) }
  }
}
