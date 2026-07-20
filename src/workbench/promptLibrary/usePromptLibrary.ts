import React from 'react'
import { fetchPromptLibrary, type LibraryPrompt } from '../api/promptLibraryApi'
import { runtimeT } from '../../i18n/runtimeTranslate'

type State = { items: LibraryPrompt[]; loading: boolean; error: string | null }

// 模块级缓存:面板反复开关不重拉(主进程也有 1h 缓存,这层省 IPC 往返+解析)。
let cached: LibraryPrompt[] | null = null

/** 提示词库数据:首次打开拉取,之后命中模块缓存;失败给可重试态。 */
export function usePromptLibrary(opened: boolean): State & { reload: () => void } {
  const [state, setState] = React.useState<State>({ items: cached ?? [], loading: false, error: null })

  const load = React.useCallback((force: boolean) => {
    if (!force && cached) {
      setState({ items: cached, loading: false, error: null })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fetchPromptLibrary()
      .then((items) => {
        cached = items
        setState({ items, loading: false, error: items.length ? null : runtimeT('promptLibrary.fetchEmpty.title') })
      })
      .catch((error: unknown) => {
        setState({ items: cached ?? [], loading: false, error: error instanceof Error ? error.message : runtimeT('promptLibrary.fetchEmpty.title') })
      })
  }, [])

  React.useEffect(() => {
    if (opened) load(false)
  }, [opened, load])

  return { ...state, reload: () => load(true) }
}
