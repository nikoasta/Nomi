export const SUPPORTED_LOCALES = ['zh-CN', 'en', 'ru'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export type TranslationKey =
  | 'app.loading'
  | 'app.mainUi'
  | 'common.loading'
  | 'common.noImage'
  | 'common.imageLoadFailed'
  | 'common.imageLoadFailedWithUrl'
  | 'app.studioAria'
  | 'app.close.title'
  | 'app.close.message'
  | 'app.close.confirm'
  | 'app.close.cancel'
  | 'app.project.saveError'
  | 'app.project.notFound'
  | 'app.project.upgraded'
  | 'app.project.restoreError'
  | 'app.project.newError'
  | 'app.project.demoOpenError'
  | 'app.project.openFolderUnsupported'
  | 'app.project.openFolderError'
  | 'app.project.defaultName'
  | 'app.project.untitled'
  | 'app.project.renameSaveError'
  | 'app.folderInit.title'
  | 'app.folderInit.message'
  | 'app.folderInit.confirm'
  | 'app.delete.externalTitle'
  | 'app.delete.nativeTitle'
  | 'app.delete.externalMessage'
  | 'app.delete.nativeMessage'
  | 'app.delete.externalConfirm'
  | 'app.delete.nativeConfirm'
  | 'app.delete.externalSuccess'
  | 'app.delete.nativeSuccess'
  | 'app.delete.error'
  | 'app.canvas.loading'
  | 'app.canvas.loadingLabel'
  | 'language.switcher.aria'
  | 'language.switcher.leading'
  | 'language.zh'
  | 'language.en'
  | 'language.ru'
  | 'library.updated.justNow'
  | 'library.updated.minutesAgo'
  | 'library.updated.hoursAgo'
  | 'library.updated.daysAgo'
  | 'library.actions.replaySplash'
  | 'library.actions.modelCatalog'
  | 'library.actions.openBrowser'
  | 'library.actions.openAssetBox'
  | 'library.actions.assetBoxTitle'
  | 'library.actions.assetCount'
  | 'library.title'
  | 'library.startAria'
  | 'library.newBlank.title'
  | 'library.newBlank.description'
  | 'library.openFolder.title'
  | 'library.openFolder.description'
  | 'library.journey.title.first'
  | 'library.journey.title.replay'
  | 'library.journey.description'
  | 'library.modelStatus.aria'
  | 'library.modelStatus.title'
  | 'library.modelStatus.description'
  | 'library.modelStatus.button'
  | 'library.recent'
  | 'library.filter.aria'
  | 'library.filter.all'
  | 'library.filter.native'
  | 'library.filter.folder'
  | 'library.search.placeholder'
  | 'library.empty.noMatch'
  | 'library.empty.noCategory'
  | 'library.empty.clearSearch'
  | 'library.project.deleteAria'
  | 'library.project.deleteTitle'
  | 'library.project.folderUnavailable'
  | 'library.project.continue'
  | 'library.project.revealAria'
  | 'library.project.revealTitle'
  | 'theme.light'
  | 'theme.dark'
  | 'theme.appearance'
  | 'theme.lightMode'
  | 'theme.darkMode'
  | 'window.controls'
  | 'window.minimize'
  | 'window.maximize'
  | 'window.restore'
  | 'window.close'
  | 'about.dialog.aria'
  | 'about.currentVersion'
  | 'about.handbook.title'
  | 'about.handbook.subtitle'
  | 'about.update.desktopOnly'
  | 'about.update.checking'
  | 'about.update.upToDate'
  | 'about.update.available'
  | 'about.update.later'
  | 'about.update.download'
  | 'about.update.openDownload'
  | 'about.update.manualMac'
  | 'about.update.downloading'
  | 'about.update.background'
  | 'about.update.downloaded'
  | 'about.update.install'
  | 'about.update.error'
  | 'about.update.retry'
  | 'about.update.idle'
  | 'about.update.check'
  | 'errorBoundary.title'
  | 'errorBoundary.message'
  | 'errorBoundary.reload'
  | 'errorBoundary.copy'
  | 'chunk.loadFailed'
  | 'chunk.networkRecovering'
  | 'chunk.otherFeaturesOk'
  | 'chunk.reload'
  | 'splash.aria'
  | 'splash.skip'
  | 'splash.caption.start'
  | 'splash.caption.canvas'
  | 'splash.caption.control'
  | 'splash.caption.timeline'
  | 'splash.caption.brand'
  | 'splash.creation.prompt'
  | 'splash.node.opening'
  | 'splash.node.closeup'
  | 'splash.node.ending'
  | 'splash.timeline.video'
  | 'splash.timeline.audio'
  | 'splash.brand.slogan'
  | 'studio.appbar.aria'
  | 'studio.appbar.about'
  | 'studio.appbar.breadcrumb'
  | 'studio.appbar.backToLibrary'
  | 'studio.appbar.projectName'
  | 'studio.appbar.globalActions'
  | 'studio.appbar.openBrowser'
  | 'studio.appbar.browser'
  | 'studio.appbar.openAssetBox'
  | 'studio.appbar.assetBox'
  | 'studio.appbar.assetCount'
  | 'studio.appbar.openModelSetup'
  | 'studio.appbar.modelSetup'
  | 'studio.appbar.export'
  | 'studio.appbar.exportMp4'
  | 'studio.appbar.goPreviewExport'
  | 'studio.windowbar.aria'
  | 'studio.windowbar.quickActions'
  | 'studio.workspace.creation'
  | 'studio.workspace.generation'
  | 'studio.workspace.preview'
  | 'studio.workspace.loading'
  | 'studio.stepper.aria'
  | 'studio.stepper.creation'
  | 'studio.stepper.generation'
  | 'studio.stepper.preview'
  | 'generation.timeline.chunk'
  | 'generation.aria'
  | 'generation.expandTimeline'
  | 'generation.timeline'
  | 'generation.clipCount'
  | 'generation.aiSidebar'
  | 'generation.resizeAssistant'
  | 'preview.aria'
  | 'preview.timeline.region'
  | 'preview.timeline.actionPrefix'
  | 'preview.player.aria'
  | 'preview.placeholder.title'
  | 'preview.placeholder.description'
  | 'preview.videoPlayFailed'
  | 'preview.videoLoadFailed'
  | 'preview.controls.aria'
  | 'preview.play'
  | 'preview.pause'
  | 'preview.timelineEmpty'
  | 'preview.previousFrame'
  | 'preview.previousFrameTitle'
  | 'preview.nextFrame'
  | 'preview.nextFrameTitle'
  | 'preview.mute'
  | 'preview.unmute'
  | 'preview.volume'
  | 'preview.fullscreen'
  | 'preview.exitFullscreen'
  | 'preview.fullscreenTitle'
  | 'preview.aspectRatio'
  | 'preview.aspectRatioLeading'
  | 'preview.fitMode'
  | 'preview.fitLeading'
  | 'preview.fitContain'
  | 'preview.fitCover'
  | 'preview.framing'
  | 'preview.zoomOut'
  | 'preview.zoomCurrent'
  | 'preview.zoomReset'
  | 'preview.zoomIn'
  | 'preview.addText.aria'
  | 'preview.addText.title'
  | 'preview.text'
  | 'preview.caption'
  | 'preview.captionHint'
  | 'preview.titleCard'
  | 'preview.titleCardHint'
  | 'preview.textDragTitle'
  | 'preview.textSelectTitle'
  | 'preview.export.preparing'
  | 'preview.export.converting'
  | 'preview.export.recording'
  | 'preview.export.cancel'
  | 'preview.export.cancelDisabled'
  | 'preview.export.mp4'
  | 'preview.export.success'
  | 'preview.export.error'
  | 'preview.export.title.empty'
  | 'preview.export.title.converting'
  | 'preview.export.title.recording'
  | 'preview.export.title.ready'
  | 'preview.textStyle.aria'
  | 'preview.textStyle.fontSize'
  | 'preview.textStyle.decrease'
  | 'preview.textStyle.increase'
  | 'preview.textStyle.percent'
  | 'preview.textStyle.font'
  | 'timeline.selectedActions'
  | 'timeline.regenerateShot'
  | 'timeline.regenerateShotTitle'
  | 'timeline.nudgeEarlier'
  | 'timeline.copyClip'
  | 'timeline.nudgeLater'
  | 'timeline.aiArrange'
  | 'timeline.aiArrangeTitle'
  | 'timeline.aiArrange.success'
  | 'timeline.aiArrange.empty'
  | 'timeline.aiArrange.already'
  | 'timeline.splitExit'
  | 'timeline.splitEnter'
  | 'timeline.splitExitTitle'
  | 'timeline.splitEnterTitle'
  | 'timeline.redo'
  | 'timeline.redoTitle'
  | 'timeline.undo'
  | 'timeline.undoTitle'
  | 'timeline.zoomOut'
  | 'timeline.zoomReset'
  | 'timeline.zoomIn'
  | 'timeline.deleteSelected'
  | 'timeline.collapse'
  | 'timeline.ruler'
  | 'timeline.dragPlayhead'
  | 'timeline.textTrack'
  | 'timeline.textEmpty'
  | 'timeline.emptyText'
  | 'timeline.caption'
  | 'timeline.titleCard'
  | 'timeline.resizeLeft'
  | 'timeline.resizeRight'
  | 'timeline.emptyAudio'
  | 'timeline.emptyMedia'
  | 'timeline.dropAudioReject'
  | 'timeline.dropPlace'
  | 'timeline.overlayLayer'
  | 'timeline.addCaption'
  | 'timeline.audioDrop'
  | 'timeline.trimStart'
  | 'timeline.trimEnd'
  | 'mediaType.image'
  | 'mediaType.video'
  | 'asset.kind.all'
  | 'asset.kind.none'
  | 'asset.kind.image'
  | 'asset.kind.video'
  | 'asset.kind.audio'
  | 'assetPicker.limitReached'
  | 'assetPicker.search'
  | 'assetPicker.canvas'
  | 'assetPicker.projectRecent'
  | 'assetPicker.browseAll'
  | 'assetPicker.loading'
  | 'assetPicker.noMatch'
  | 'assetPicker.empty'
  | 'assetPicker.uploadingLabel'
  | 'assetPicker.uploading'
  | 'assetPicker.uploadLocal'
  | 'assetPicker.footer'
  | 'assetLibrary.source.aria'
  | 'assetLibrary.source.all'
  | 'assetLibrary.source.project'
  | 'assetLibrary.title'
  | 'assetLibrary.close'
  | 'assetLibrary.dialog.aria'
  | 'assetLibrary.upload'
  | 'assetLibrary.uploadAria'
  | 'assetLibrary.webCapture'
  | 'assetLibrary.webCaptureTitle'
  | 'assetLibrary.filePicker'
  | 'assetLibrary.search'
  | 'assetLibrary.categoryFilter'
  | 'assetLibrary.categoryDialog'
  | 'assetLibrary.categoryList'
  | 'assetLibrary.categoryTitle'
  | 'assetLibrary.deleteSelectedAria'
  | 'assetLibrary.deleteSelectedTitle'
  | 'assetLibrary.deleteDisabledTitle'
  | 'assetLibrary.dragMultiple'
  | 'assetLibrary.dragToTimelineAudio'
  | 'assetLibrary.dragToCanvas'
  | 'assetLibrary.selectableProjectAsset'
  | 'assetLibrary.mediaImport.success'
  | 'assetLibrary.audioImport.success'
  | 'assetLibrary.importSkipped.tooLarge'
  | 'assetLibrary.importSkipped.overLimit'
  | 'assetLibrary.importSkipped.duplicate'
  | 'assetLibrary.importSkipped.failed'
  | 'assetLibrary.importSkipped.summary'
  | 'assetLibrary.import.mediaFailed'
  | 'assetLibrary.import.audioFailed'
  | 'assetLibrary.import.unsupportedSkipped'
  | 'assetLibrary.delete.noProject'
  | 'assetLibrary.delete.selectFirst'
  | 'assetLibrary.delete.notDeletable'
  | 'assetLibrary.delete.confirmTitle'
  | 'assetLibrary.delete.confirmMessage'
  | 'assetLibrary.delete.confirm'
  | 'assetLibrary.delete.unsupported'
  | 'assetLibrary.delete.projectSuccess'
  | 'assetLibrary.delete.fileSuccess'
  | 'assetLibrary.delete.fileFailed'
  | 'assetLibrary.delete.failed'
  | 'assetLibrary.empty.project'
  | 'assetLibrary.empty.all'
  | 'assetLibrary.empty.noMatch'
  | 'assetLibrary.empty.description'
  | 'assetLibrary.empty.noMatchDescription'
  | 'assetMention.empty'
  | 'assetMention.choose'
  | 'assetMention.insertReference'
  | 'projectExplorer.aria'
  | 'projectExplorer.nav'
  | 'projectExplorer.findAssets'
  | 'projectExplorer.categories'
  | 'projectExplorer.promptLibrary'
  | 'projectExplorer.promptRail'
  | 'projectExplorer.skillLibrary'
  | 'projectExplorer.skillRail'
  | 'projectExplorer.assetLibrary'
  | 'projectExplorer.expandSidebar'
  | 'projectExplorer.collapseSidebar'
  | 'projectExplorer.webCapture'
  | 'projectExplorer.webCaptureTitle'
  | 'projectExplorer.newCategory'
  | 'categoryTree.builtin.shots'
  | 'categoryTree.builtin.cast'
  | 'categoryTree.builtin.scene'
  | 'categoryTree.builtin.prop'
  | 'categoryTree.builtin.audio'
  | 'categoryTree.customDefault'
  | 'categoryTree.copiedTo'
  | 'categoryTree.deleteCategory.title'
  | 'categoryTree.deleteCategory.message'
  | 'categoryTree.deleteNode.title'
  | 'categoryTree.deleteNode.message'
  | 'categoryTree.deleteGroup.title'
  | 'categoryTree.deleteGroup.message'
  | 'categoryTree.confirmDelete'
  | 'categoryTree.nodeName'
  | 'categoryTree.groupColor'
  | 'categoryTree.groupColorMessage'
  | 'categoryTree.menu.newGroup'
  | 'categoryTree.menu.rename'
  | 'categoryTree.menu.deleteCategory'
  | 'categoryTree.menu.copy'
  | 'categoryTree.menu.regenerateDerived'
  | 'categoryTree.menu.delete'
  | 'categoryTree.menu.changeColor'
  | 'categoryTree.menu.ungroup'
  | 'categoryTree.menu.deleteWithNodes'
  | 'categoryTree.emptyNodes'
  | 'categoryItem.nameAria'
  | 'groupItem.nameAria'
  | 'groupItem.empty'
  | 'nodeItem.derived'
  | 'nodeItem.kind.text'
  | 'nodeItem.kind.character'
  | 'nodeItem.kind.scene'
  | 'nodeItem.kind.image'
  | 'nodeItem.kind.keyframe'
  | 'nodeItem.kind.video'
  | 'nodeItem.kind.shot'
  | 'nodeItem.kind.output'
  | 'nodeItem.kind.panorama'
  | 'nodeItem.kind.default'
  | 'assetFinder.unstar'
  | 'assetFinder.markMain'
  | 'assetFinder.mainMark'
  | 'assetFinder.zone.film'
  | 'assetFinder.zone.reference'
  | 'assetFinder.search'
  | 'assetFinder.starOnly'
  | 'assetFinder.aiGroupTitle'
  | 'assetFinder.aiGrouping'
  | 'assetFinder.aiGroup'
  | 'assetFinder.aiGroupSuccess'
  | 'assetFinder.aiGroupNone'
  | 'assetFinder.aiGroupFailed'
  | 'assetFinder.textModelRequired'
  | 'assetFinder.empty.noFilm'
  | 'assetFinder.empty.noReference'
  | 'assetFinder.empty.noMatch'
  | 'assetFinder.empty.filterHint'
  | 'assetFinder.empty.filmHint'
  | 'assetFinder.empty.referenceHint'
  | 'assetFinder.ungrouped'
  | 'workspaceFiles.title'
  | 'workspaceFiles.listView'
  | 'workspaceFiles.sort'
  | 'workspaceFiles.sortAscending'
  | 'workspaceFiles.sortDescending'
  | 'workspaceFiles.refresh'
  | 'workspaceFiles.import'
  | 'workspaceFiles.importTitle'
  | 'workspaceFiles.importing'
  | 'workspaceFiles.mediaTypes'
  | 'workspaceFiles.noProject'
  | 'workspaceFiles.loading'
  | 'workspaceFiles.empty.title'
  | 'workspaceFiles.empty.description'
  | 'workspaceFiles.truncated'
  | 'workspaceFiles.readError'
  | 'filePreview.aria'
  | 'filePreview.reveal'
  | 'filePreview.close'
  | 'filePreview.unsupported'
  | 'filePreview.unsupportedHint'
  | 'filePreview.loading'
  | 'filePreview.readFailed'
  | 'activeSkill.title'
  | 'activeSkill.choose'
  | 'activeSkill.auto'
  | 'activeSkill.followMode'
  | 'activeSkill.playbookStages'
  | 'activeSkill.missingProviders'
  | 'activeSkill.connect'
  | 'activeSkill.authorName'
  | 'activeSkill.authorTitle'
  | 'activeSkill.authorDescription'
  | 'provider.text'
  | 'provider.image'
  | 'provider.video'
  | 'richText.bold'
  | 'richText.italic'
  | 'richText.h1'
  | 'richText.h2'
  | 'richText.bulletList'
  | 'richText.orderedList'
  | 'richText.blockquote'
  | 'richText.undo'
  | 'richText.redo'
  | 'workbenchEditor.placeholder'
  | 'workbenchEditor.toolbar'
  | 'workbenchEditor.aria'
  | 'textDocument.placeholder'
  | 'textDocument.toolbar'
  | 'textDocument.drag'
  | 'textDocument.label'
  | 'attachment.remove'
  | 'attachment.uploadFailed'
  | 'attachment.rail'
  | 'attachment.file'
  | 'staleConversation.divider'
  | 'canvas.navigation'
  | 'canvas.zoom'
  | 'canvas.fitView'
  | 'canvas.empty'
  | 'canvas.resetView'
  | 'canvas.zoomPercent'
  | 'canvas.tidy'
  | 'canvas.tidyTitle'
  | 'canvas.hideMinimap'
  | 'canvas.showMinimap'
  | 'canvas.minimapMinimum'
  | 'canvas.empty.title'
  | 'canvas.empty.description'
  | 'canvas.empty.createAria'
  | 'canvas.empty.create'
  | 'canvas.category.shots'
  | 'canvas.category.cast'
  | 'canvas.category.scene'
  | 'canvas.category.prop'
  | 'canvas.category.audio'
  | 'canvas.category.node'
  | 'canvas.gesture.aria'
  | 'canvas.gesture.panKeys'
  | 'canvas.gesture.pan'
  | 'canvas.gesture.zoomKeys'
  | 'canvas.gesture.zoom'
  | 'canvas.gesture.selectKeys'
  | 'canvas.gesture.select'
  | 'canvas.gesture.dismiss'
  | 'canvas.selection.aria'
  | 'canvas.selection.count'
  | 'canvas.selection.generateTitle'
  | 'canvas.selection.generate'
  | 'canvas.selection.ungroup'
  | 'canvas.selection.group'
  | 'canvas.selection.clear'
  | 'canvas.focusNodeMissing'
  | 'canvas.import.none'
  | 'canvas.import.one'
  | 'canvas.import.many'
  | 'inlineParams.configureModel'
  | 'inlineParams.openModelSetup'
  | 'inlineParams.configure'
  | 'inlineParams.booleanOn'
  | 'inlineParams.booleanOff'
  | 'inlineParams.model'
  | 'inlineParams.selectModel'
  | 'inlineParams.variant'
  | 'inlineParams.more'
  | 'inlineParams.provider'
  | 'modeBar.generationMode'
  | 'nodeComposer.promptPicker.aria'
  | 'nodeComposer.promptPicker.empty'
  | 'nodeComposer.promptPicker.open'
  | 'nodeComposer.promptPicker.title'
  | 'nodeComposer.promptPicker.button'
  | 'nodeComposer.textMode.aria'
  | 'nodeComposer.textMode.append'
  | 'nodeComposer.textMode.rewrite'
  | 'nodeComposer.textMode.replace'
  | 'nodeComposer.textMode.appendPlaceholder'
  | 'nodeComposer.textMode.rewritePlaceholder'
  | 'nodeComposer.textMode.replacePlaceholder'
  | 'nodeComposer.disabled.videoNeedsReference'
  | 'nodeComposer.disabled.videoNeedsFirstFrame'
  | 'nodeComposer.disabled.imageNeedsReference'
  | 'nodeComposer.disabled.imageNeedsReferenceDetailed'
  | 'nodeComposer.disabled.unsupported'
  | 'nodeComposer.generating'
  | 'nodeComposer.generateReferencesFirst'
  | 'nodeComposer.regenerate'
  | 'nodeComposer.generate'
  | 'nodeComposer.generateAsset'
  | 'nodeComposer.uploadingLabel'
  | 'nodeComposer.uploading'
  | 'nodeComposer.dropReference'
  | 'nodeRecoverable.aria'
  | 'nodeRecoverable.title'
  | 'nodeRecoverable.description'
  | 'nodeRecoverable.recover'
  | 'nodeRecoverable.recovering'
  | 'nodeRecoverable.markFailed'
  | 'aiHeader.conversationHistory'
  | 'assistantModel.aria'
  | 'assistantModel.title'
  | 'assetTile.addReference'
  | 'resultDownload.defaultVideoName'
  | 'resultDownload.defaultImageName'
  | 'resultDownload.success'
  | 'resultDownload.failed'
  | 'imageTransform.rotateLeft'
  | 'imageTransform.rotateRight'
  | 'imageTransform.flipHorizontal'
  | 'imageTransform.flipVertical'
  | 'imageEdit.aria'
  | 'imageEdit.makeup'
  | 'imageEdit.makeupTitle'
  | 'imageEdit.aiEdit'
  | 'imageEdit.decomposing'
  | 'imageEdit.decomposeLayers'
  | 'imageEdit.textEdit'
  | 'imageEdit.crop'
  | 'imageEdit.cropTitle'
  | 'imageEdit.removingBackground'
  | 'imageEdit.removeBackground'
  | 'imageEdit.removeBackgroundTitle'
  | 'imageEdit.gridSplit'
  | 'imageEdit.grid2'
  | 'imageEdit.grid3'
  | 'imageEdit.transform'
  | 'imageEdit.whiteboard'
  | 'imageEdit.whiteboardTitle'
  | 'imageEdit.download'
  | 'imageEdit.downloadTitle'
  | 'imageEdit.defaultImage'
  | 'imageEdit.decomposedElements'
  | 'imageEdit.progress.decode'
  | 'imageEdit.progress.inference'
  | 'imageEdit.progress.mask'
  | 'imageEdit.progress.encode'
  | 'imageEdit.progress.model'
  | 'imageEdit.progress.removing'
  | 'imageEdit.removeBackgroundFailed'
  | 'assistantMessage.processing'
  | 'assistantMessage.stopped'
  | 'conversation.new'
  | 'conversation.savedToHistory'
  | 'conversation.delete'
  | 'conversation.justNow'
  | 'conversation.minutesAgo'
  | 'conversation.hoursAgo'
  | 'conversation.yesterday'
  | 'resultToolbar.aria'
  | 'videoToolbar.aria'
  | 'videoToolbar.extracting'
  | 'videoToolbar.extractFirst'
  | 'videoToolbar.extractFirstTitle'
  | 'videoToolbar.extractLast'
  | 'videoToolbar.extractLastTitle'
  | 'node.toast.generateBeforeTimeline'
  | 'node.connection.to'
  | 'node.connection.from'
  | 'node.panoramaActions'
  | 'node.panoramaPreview'
  | 'node.panoramaReupload'
  | 'node.independentCopy'
  | 'node.sourceMissing'
  | 'node.locateSource'
  | 'node.independentCopyFromCategory'
  | 'node.independentCopyFrom'
  | 'node.independentCopySourceMissing'
  | 'node.provenance'
  | 'canvasToolbar.aria'
  | 'canvasToolbar.addMenu'
  | 'canvasToolbar.addNode'
  | 'canvasNodeKind.text'
  | 'canvasNodeKind.image'
  | 'canvasNodeKind.video'
  | 'canvasNodeKind.audio'
  | 'canvasNodeKind.model3d'
  | 'canvasNodeKind.whiteboard'
  | 'canvasNodeKind.panorama'
  | 'canvasNodeKind.scene3d'
  | 'canvasAssistant.launcher'
  | 'canvasAssistant.suffix'
  | 'canvasAssistant.panel'
  | 'canvasAssistant.dropTitle'
  | 'canvasAssistant.dropHint'
  | 'canvasAssistant.title'
  | 'canvasAssistant.collapse'
  | 'canvasAssistant.sendMessage'
  | 'canvasAssistant.placeholder'
  | 'canvasAssistant.addAttachment'
  | 'canvasAssistant.addAttachmentLong'
  | 'canvasAssistant.modeAria'
  | 'canvasAssistant.modeLeading'
  | 'canvasAssistant.mode.chat'
  | 'canvasAssistant.mode.refine'
  | 'canvasAssistant.stop'
  | 'canvasAssistant.send'
  | 'canvasAssistant.emptyTitle'
  | 'canvasAssistant.emptyBody'
  | 'canvasAssistant.suggestion.shots'
  | 'canvasAssistant.suggestion.prompt'
  | 'canvasAssistant.suggestion.connect'
  | 'canvasAssistant.reject'
  | 'canvasAssistant.confirm'
  | 'assistantError.provider'
  | 'assistantError.retry'
  | 'assistantError.modelSetup'
  | 'assistantError.technicalDetails'
  | 'noTextModel.readyTitle'
  | 'noTextModel.readyBody'
  | 'noTextModel.title'
  | 'noTextModel.bodyBefore'
  | 'noTextModel.bodyModel'
  | 'noTextModel.bodyAfter'
  | 'noTextModel.enable'
  | 'noTextModel.settings'
  | 'spend.agentDriven'
  | 'spend.autoIgnore'
  | 'spend.suppressSession'
  | 'spend.ignore'
  | 'spend.cancel'
  | 'spend.confirmGenerate'
  | 'nodeError.aria'
  | 'nodeError.provider'
  | 'nodeError.retry'
  | 'nodeError.copy'
  | 'nodeError.copied'
  | 'nodeError.technicalDetails'
  | 'creationAssistant.aria'
  | 'creationAssistant.title'
  | 'creationAssistant.expand'
  | 'creationAssistant.shrink'
  | 'creationAssistant.expandAria'
  | 'creationAssistant.shrinkAria'
  | 'creationAssistant.collapse'
  | 'creationAssistant.emptyTitle'
  | 'creationAssistant.emptyBody'
  | 'creationAssistant.suggestion.opening'
  | 'creationAssistant.suggestion.visual'
  | 'creationAssistant.suggestion.storyboard'
  | 'creationAssistant.emptyContent'
  | 'creationAssistant.reject'
  | 'creationAssistant.apply'
  | 'creationAssistant.placeholder'
  | 'creationAssistant.inputAria'
  | 'creationAssistant.modeAria'
  | 'creationAssistant.write.insert'
  | 'creationAssistant.write.replace'
  | 'creationAssistant.write.append'
  | 'creationAssistant.callFailed'
  | 'creationAssistant.defaultStoryboardPrompt'
  | 'creationAssistant.defaultFixationPrompt'
  | 'creationAssistant.attachmentPrompt'
  | 'creationAssistant.processCurrentDocument'
  | 'creationAssistant.cancelled'
  | 'creationAssistant.emptyResponse'
  | 'creationAssistant.truncated'
  | 'creationAssistant.errorPrefix'
  | 'creationAssistant.needStoryForStoryboard'
  | 'creationAssistant.needScriptForFixation'
  | 'creationAssistant.attachmentsUploading'
  | 'creationAssistant.revisingPlan'
  | 'creationAssistant.planningStoryboard'
  | 'creationAssistant.planningStoryboardStream'
  | 'creationAssistant.planUpdated'
  | 'creationAssistant.planReady'
  | 'creationAssistant.storyboardFailed'
  | 'creationAssistant.unknownError'
  | 'creationAssistant.fixationPlanning'
  | 'cardCommon.cutout'
  | 'cardCommon.cutoutNode'
  | 'cardCommon.cutoutProgress'
  | 'cardCommon.generating'
  | 'cardCommon.upload'
  | 'cardCommon.node'
  | 'editableTitle.edit'
  | 'card.characterImage'
  | 'card.sceneImage'
  | 'card.propImage'
  | 'card.unnamedCharacter'
  | 'card.unnamedScene'
  | 'card.unnamedProp'
  | 'card.ownerPrefix'
  | 'imageCrop.cancel'
  | 'imageCrop.confirmCrop'
  | 'imageCrop.confirmSplit'
  | 'audio.noSubtitles'
  | 'audio.subtitlesCopied'
  | 'audio.copyTranscript'
  | 'audio.copy'
  | 'audio.generateSubtitles'
  | 'audio.play'
  | 'audio.pause'
  | 'audio.upload'
  | 'audio.sound'
  | 'audio.uploadOrConnect'
  | 'storyboard.action.storyboardLead'
  | 'storyboard.action.storyboardCta'
  | 'storyboard.action.fixationLead'
  | 'storyboard.action.fixationCta'
  | 'storyboard.action.modeAria'
  | 'storyboard.action.imageMode'
  | 'storyboard.action.videoMode'
  | 'storyboard.action.imageHint'
  | 'storyboard.action.videoHint'
  | 'storyboard.action.started'
  | 'storyboard.plan.defaultTitle'
  | 'storyboard.plan.meta'
  | 'storyboard.plan.imageMode'
  | 'storyboard.plan.discardTitle'
  | 'storyboard.plan.discardMessage'
  | 'storyboard.plan.discardConfirm'
  | 'storyboard.plan.status.editing'
  | 'storyboard.plan.status.committed'
  | 'storyboard.plan.status.draft'
  | 'storyboard.plan.editingSummary'
  | 'storyboard.plan.collapseCard'
  | 'storyboard.plan.confirmInEditor'
  | 'storyboard.plan.committedSummary'
  | 'storyboard.plan.editAgain'
  | 'storyboard.plan.goGeneration'
  | 'storyboard.plan.emptyPrompt'
  | 'storyboard.plan.moreShots'
  | 'storyboard.plan.openEdit'
  | 'storyboard.plan.discard'
  | 'storyboard.editor.issue.noShots'
  | 'storyboard.editor.issue.emptyShotPrompt'
  | 'storyboard.editor.issue.danglingRef'
  | 'storyboard.editor.issue.anchorNoName'
  | 'storyboard.editor.landFailedTitle'
  | 'storyboard.editor.unknownError'
  | 'storyboard.editor.titleAria'
  | 'storyboard.editor.titlePlaceholder'
  | 'storyboard.editor.shotCount'
  | 'storyboard.editor.collapse'
  | 'storyboard.editor.discardPlan'
  | 'storyboard.editor.noticeLead'
  | 'storyboard.editor.noticeTail'
  | 'storyboard.editor.anchorsTitle'
  | 'storyboard.editor.anchorsHint'
  | 'storyboard.editor.noAnchors'
  | 'storyboard.editor.addAnchor'
  | 'storyboard.editor.shotsTitle'
  | 'storyboard.editor.addShot'
  | 'storyboard.editor.issuesSummary'
  | 'storyboard.editor.readySummary'
  | 'storyboard.editor.landing'
  | 'storyboard.editor.confirmLand'
  | 'storyboard.shot.durationSeconds'
  | 'storyboard.shot.defaultModel'
  | 'storyboard.shot.index'
  | 'storyboard.shot.kindAria'
  | 'storyboard.shot.kindLeading'
  | 'storyboard.shot.image'
  | 'storyboard.shot.video'
  | 'storyboard.shot.durationAria'
  | 'storyboard.shot.durationLeading'
  | 'storyboard.shot.imageModel'
  | 'storyboard.shot.videoModel'
  | 'storyboard.shot.modelLeading'
  | 'storyboard.shot.provider'
  | 'storyboard.shot.delete'
  | 'storyboard.shot.references'
  | 'storyboard.shot.unnamed'
  | 'storyboard.shot.removeReference'
  | 'storyboard.shot.danglingTitle'
  | 'storyboard.shot.danglingLabel'
  | 'storyboard.shot.danglingWarning'
  | 'storyboard.anchor.kindSwitchAria'
  | 'storyboard.anchor.kindSwitchTitle'
  | 'storyboard.anchor.kind.character'
  | 'storyboard.anchor.kind.scene'
  | 'storyboard.anchor.kind.prop'
  | 'storyboard.anchor.kind.style'
  | 'storyboard.anchor.namePlaceholder'
  | 'storyboard.anchor.nameAria'
  | 'storyboard.anchor.editDescription'
  | 'storyboard.anchor.delete'
  | 'storyboard.anchor.descriptionAria'
  | 'storyboard.anchor.visualPlaceholder'
  | 'storyboard.anchor.textPlaceholder'
  | 'storyboard.anchor.collapse'
  | 'storyboard.anchor.carrier.visualTitle'
  | 'storyboard.anchor.carrier.textTitle'
  | 'storyboard.anchor.carrier.visual'
  | 'storyboard.anchor.carrier.text'
  | 'browserAsset.open'
  | 'browserAsset.dialog'
  | 'browserAsset.title'
  | 'browserAsset.source.aria'
  | 'browserAsset.source.my'
  | 'browserAsset.source.transcript'
  | 'browserAsset.tab.all'
  | 'browserAsset.tab.image'
  | 'browserAsset.tab.video'
  | 'browserAsset.tab.prompt'
  | 'browserAsset.tab.folder'
  | 'browserAsset.capture.off'
  | 'browserAsset.capture.on'
  | 'browserAsset.capture.offTitle'
  | 'browserAsset.capture.onTitle'
  | 'browserAsset.promptSettings'
  | 'browserAsset.dock.restore'
  | 'browserAsset.dock.right'
  | 'browserAsset.dock.restoreTitle'
  | 'browserAsset.dock.rightTitle'
  | 'browserAsset.minimize'
  | 'browserAsset.search'
  | 'browserAsset.upload'
  | 'browserAsset.newFolder'
  | 'browserAsset.moreTools'
  | 'browserAsset.toggleLayout'
  | 'browserAsset.sort.oldest'
  | 'browserAsset.sort.newest'
  | 'browserAsset.filterCategories'
  | 'browserAsset.fileInput'
  | 'browserAsset.parentFolder'
  | 'browserAsset.breadcrumb'
  | 'browserAsset.promptMasonry'
  | 'browserAsset.list'
  | 'browserAsset.grid'
  | 'browserAsset.dropToSave'
  | 'browserAsset.assetActions'
  | 'browserAsset.importCanvas'
  | 'browserAsset.delete'
  | 'browserAsset.blankActions'
  | 'browserAsset.filter.dialog'
  | 'browserAsset.filter.show'
  | 'browserAsset.filter.showAll'
  | 'browserAsset.filter.categoryAria'
  | 'browserAsset.promptCategory.dialog'
  | 'browserAsset.promptCategory.title'
  | 'browserAsset.promptCategory.aria'
  | 'browserAsset.promptCategory.placeholder'
  | 'browserAsset.promptCategory.confirm'
  | 'browserAsset.promptCategory.add'
  | 'browserAsset.promptCategory.image'
  | 'browserAsset.promptCategory.video'
  | 'browserAsset.status.downloading'
  | 'browserAsset.status.importUnavailable'
  | 'browserAsset.status.downloadFailed'
  | 'browserAsset.status.folder'
  | 'browserAsset.status.saveFailed'
  | 'browserAsset.status.saving'
  | 'browserAsset.status.localText'
  | 'browserAsset.status.localImport'
  | 'browserAsset.status.extracting'
  | 'browserAsset.status.extractFailed'
  | 'browserAsset.newFolderTitle'
  | 'browserAsset.newFolderTitleIndexed'
  | 'browserAsset.unnamedAsset'
  | 'browserAsset.source.capture'
  | 'browserAsset.source.drag'
  | 'browserAsset.empty.noMatch.title'
  | 'browserAsset.empty.noMatch.description'
  | 'browserAsset.empty.folder.title'
  | 'browserAsset.empty.folder.description'
  | 'browserAsset.empty.prompt.title'
  | 'browserAsset.empty.prompt.description'
  | 'browserAsset.empty.assets.title'
  | 'browserAsset.empty.assets.description'
  | 'browserAsset.type.folder'
  | 'browserAsset.type.image'
  | 'browserAsset.type.video'
  | 'browserAsset.type.prompt'
  | 'browserPrompt.mode.replicate'
  | 'browserPrompt.mode.style'
  | 'browserPrompt.detail.aria'
  | 'browserPrompt.detail.title'
  | 'browserPrompt.detail.close'
  | 'browserPrompt.detail.referenceImages'
  | 'browserPrompt.detail.prompt'
  | 'browserPrompt.detail.model'
  | 'browserPrompt.detail.currentTextModel'
  | 'browserPrompt.detail.copied'
  | 'browserPrompt.detail.copy'
  | 'browserPrompt.card.extracting'
  | 'browserPrompt.card.extractFailed'
  | 'browserPrompt.card.empty'
  | 'browserPrompt.error.noReference'
  | 'browserPrompt.error.noVisionModel'
  | 'browserPrompt.error.noPromptReturned'
  | 'browserPrompt.error.noUsablePrompt'
  | 'browserPrompt.settings.aria'
  | 'browserPrompt.settings.title'
  | 'browserPrompt.settings.subtitle'
  | 'browserPrompt.settings.close'
  | 'browserPrompt.settings.default'
  | 'browserPrompt.settings.addCustom'
  | 'browserPrompt.settings.name'
  | 'browserPrompt.settings.prompt'
  | 'browserPrompt.settings.projectAvailable'
  | 'browserPrompt.settings.projectUnavailable'
  | 'browserPrompt.settings.resetDefault'
  | 'browserPrompt.settings.delete'
  | 'browserPrompt.settings.cancel'
  | 'browserPrompt.settings.save'
  | 'browserPrompt.settings.untitledTemplate'
  | 'browserDialog.aria'
  | 'browserDialog.loading'
  | 'browserDialog.newTab'
  | 'browserDialog.closeNamedTab'
  | 'browserDialog.closeBrowser'
  | 'browserDialog.back'
  | 'browserDialog.forward'
  | 'browserDialog.reload'
  | 'browserDialog.addressPlaceholder'
  | 'browserDialog.addressAria'
  | 'browserDialog.saveBookmark'
  | 'browserDialog.materialSites'
  | 'browserDialog.materialSitesList'
  | 'browserDialog.screenshotPrompt'
  | 'browserDialog.menuHint'
  | 'browserDialog.webContent'
  | 'browserDialog.emptyTitle'
  | 'browserDialog.emptyDescription'
  | 'browserDialog.startSearch'
  | 'browserDialog.open'
  | 'browserDialog.commonSites'
  | 'browserDialog.promptModePicker'
  | 'browserDialog.video'
  | 'browserDialog.tabMenu'
  | 'browserDialog.bookmarkMenu'
  | 'browserDialog.bookmarked'
  | 'browserDialog.bookmark'
  | 'browserDialog.closeTab'
  | 'browserDialog.closeAll'
  | 'browserDialog.rename'
  | 'browserDialog.delete'
  | 'browserDialog.defaultBookmark.nomi'
  | 'browserDialog.promptMode.replicateDescription'
  | 'browserDialog.promptMode.styleDescription'
  | 'browserDialog.siteHint.visual'
  | 'browserDialog.siteHint.designPortfolio'
  | 'browserDialog.siteHint.ui'
  | 'browserDialog.siteHint.conceptArt'
  | 'browserDialog.siteHint.chineseDiscovery'
  | 'browserDialog.siteHint.videoReference'
  | 'browserDialog.siteHint.filmFrames'
  | 'browserDialog.siteHint.creatorUpdates'
  | 'browserDialog.limitTabs'
  | 'browserDialog.createViewFailed'
  | 'browserDialog.renameBookmarkPrompt'
  | 'browserDialog.noPromptImages'
  | 'browserDialog.promptEntryFailed'
  | 'browserDialog.textSelectionSaveFailed'
  | 'browserDialog.textPromptSaved'
  | 'browserDialog.screenshotNeedsPage'
  | 'browserDialog.selectionUnsupported'
  | 'browserDialog.selectionFailed'
  | 'browserDialog.screenshotStyleTitle'
  | 'browserDialog.screenshotPromptTitle'
  | 'browserDialog.captureNeedsPage'
  | 'browserDialog.captureHoverHint'
  | 'browserDialog.captureFailed'
  | 'browserDialog.webVideo'
  | 'browserDialog.webImage'
  | 'tool.camera.title'
  | 'tool.camera.tooltip'
  | 'tool.camera.subtitle'
  | 'tool.camera.typeAria'
  | 'tool.camera.speed'
  | 'tool.camera.shot'
  | 'tool.camera.layerSoonTitle'
  | 'tool.camera.addLayer'
  | 'tool.camera.comingSoon'
  | 'tool.camera.readout'
  | 'tool.camera.apply'
  | 'tool.camera.toastCreated'
  | 'tool.camera.move.push_in'
  | 'tool.camera.move.pull_out'
  | 'tool.camera.move.orbit_left'
  | 'tool.camera.move.orbit_right'
  | 'tool.camera.move.crane_up'
  | 'tool.camera.move.crane_down'
  | 'tool.camera.move.track_left'
  | 'tool.camera.move.track_right'
  | 'tool.camera.move.arc_left'
  | 'tool.camera.move.arc_right'
  | 'tool.camera.move.zoom_in'
  | 'tool.camera.move.zoom_out'
  | 'tool.camera.move.dolly_zoom'
  | 'tool.camera.speed.slow'
  | 'tool.camera.speed.medium'
  | 'tool.camera.speed.fast'
  | 'tool.camera.shot.wide'
  | 'tool.camera.shot.medium'
  | 'tool.camera.shot.close'
  | 'tool.promptOptimizer.apply'
  | 'tool.promptOptimizer.rerun'
  | 'tool.promptOptimizer.resultHeader'
  | 'tool.promptOptimizer.ideaHeader'
  | 'tool.promptOptimizer.running'
  | 'tool.promptOptimizer.placeholder'
  | 'tool.promptOptimizer.ideaAria'
  | 'tool.promptOptimizer.run'
  | 'tool.promptOptimizer.aria'
  | 'tool.promptOptimizer.title'
  | 'tool.promptOptimizer.buttonIdle'
  | 'tool.promptOptimizer.noTextModel'
  | 'tool.promptOptimizer.emptyResult'
  | 'tool.promptOptimizer.failed'
  | 'tool.convertShot.badge'
  | 'tool.convertShot.aria'
  | 'tool.convertShot.title'
  | 'tool.convertShot.button'
  | 'tool.convertShot.already'
  | 'tool.convertShot.created'
  | 'tool.panorama.enterAria'
  | 'tool.panorama.enter'
  | 'tool.panorama.dialog'
  | 'tool.panorama.upload'
  | 'tool.panorama.notReady'
  | 'tool.panorama.screenshotFailed'
  | 'tool.panorama.screenshotTitle'
  | 'tool.panorama.screenshotPrompt'
  | 'tool.panorama.screenshotCreated'
  | 'tool.panorama.screenshotCapturing'
  | 'tool.panorama.screenshotCapturingShort'
  | 'tool.panorama.screenshotFrame'
  | 'tool.panorama.empty'
  | 'tool.panorama.closePreview'
  | 'tool.provenance.aria'
  | 'tool.provenance.title'
  | 'tool.provenance.close'
  | 'tool.provenance.empty'
  | 'tool.provenance.possibleReasons'
  | 'tool.provenance.reasonLegacy'
  | 'tool.provenance.reasonLocal'
  | 'tool.provenance.reasonFailed'
  | 'tool.provenance.provider'
  | 'tool.provenance.model'
  | 'tool.provenance.time'
  | 'tool.provenance.emptyPrompt'
  | 'tool.provenance.copyPrompt'
  | 'tool.provenance.params'
  | 'tool.provenance.regenerate'
  | 'whiteboard.title'
  | 'whiteboard.close'
  | 'whiteboard.closeAria'
  | 'whiteboard.saveMain'
  | 'whiteboard.screenshotCreateNode'
  | 'whiteboard.boardNotReady'
  | 'whiteboard.imageNodeMissing'
  | 'whiteboard.screenshotSaveFailed'
  | 'whiteboard.saveMainSuccess'
  | 'whiteboard.saveFailed'
  | 'whiteboard.screenshotCreated'
  | 'whiteboard.screenshotFailed'
  | 'whiteboard.aspectTitle'
  | 'whiteboard.ratio'
  | 'whiteboard.aspectSelect'
  | 'whiteboard.library.dragAdd'
  | 'whiteboard.library.title'
  | 'whiteboard.library.board'
  | 'whiteboard.library.results'
  | 'whiteboard.library.dragCopy'
  | 'whiteboard.library.emptyBoard'
  | 'whiteboard.library.emptyResults'
  | 'whiteboard.removeBgProcessing'
  | 'whiteboard.fullscreen'
  | 'whiteboard.exitFullscreen'
  | 'whiteboard.importImage'
  | 'whiteboard.customBrushColor'
  | 'whiteboard.colorAria'
  | 'whiteboard.deleteSelected'
  | 'whiteboard.imageReadFailed'
  | 'whiteboard.selectImageFile'
  | 'whiteboard.importFailed'
  | 'whiteboard.removeBgSuccess'
  | 'whiteboard.removeBgFailed'
  | 'whiteboard.leaferAria'
  | 'whiteboard.drawingLayerAria'
  | 'whiteboard.tool.brush'
  | 'whiteboard.tool.select'
  | 'whiteboard.tool.eraser'
  | 'whiteboard.tool.shape'
  | 'whiteboard.open'
  | 'whiteboard.openHint'
  | 'whiteboard.screenshotTitle'
  | 'whiteboard.imageResult'
  | 'whiteboard.importedImage'
  | 'whiteboard.originalImage'
  | 'whiteboard.material'
  | 'whiteboard.resultImage'
  | 'whiteboard.copySuffix'
  | 'whiteboard.backgroundLayer'
  | 'whiteboard.layerOne'
  | 'whiteboard.hideItem'
  | 'whiteboard.showItem'
  | 'promptLibrary.source.aria'
  | 'promptLibrary.source.mine'
  | 'promptLibrary.source.nomi'
  | 'promptLibrary.category.aria'
  | 'promptLibrary.category.all'
  | 'promptLibrary.title'
  | 'promptLibrary.close'
  | 'promptLibrary.search'
  | 'promptLibrary.new'
  | 'promptLibrary.noMatch.title'
  | 'promptLibrary.noMatch.description'
  | 'promptLibrary.loading'
  | 'promptLibrary.fetchEmpty.title'
  | 'promptLibrary.retry'
  | 'promptLibrary.dialog.aria'
  | 'promptLibrary.sentToCanvas'
  | 'promptLibrary.canvasNode'
  | 'promptLibrary.videoNode'
  | 'promptLibrary.deleted'
  | 'promptComposer.editTitle'
  | 'promptComposer.newTitle'
  | 'promptComposer.typeAria'
  | 'promptComposer.titlePlaceholder'
  | 'promptComposer.promptPlaceholder'
  | 'promptComposer.emptyError'
  | 'promptComposer.saveError'
  | 'promptComposer.cancel'
  | 'promptComposer.save'
  | 'promptComposer.saveToMine'
  | 'promptCard.mine'
  | 'promptCard.edit'
  | 'promptCard.delete'
  | 'promptPreview.noMedia'
  | 'promptPreview.close'
  | 'promptPreview.copy'
  | 'promptPreview.copied'
  | 'promptPreview.send'
  | 'promptPreview.sent'
  | 'promptPreview.source'
  | 'promptPreview.localOnly'
  | 'skillLibrary.source.aria'
  | 'skillLibrary.source.mine'
  | 'skillLibrary.source.builtin'
  | 'skillLibrary.authorName'
  | 'skillLibrary.title'
  | 'skillLibrary.close'
  | 'skillLibrary.search'
  | 'skillLibrary.importFile'
  | 'skillLibrary.newAi'
  | 'skillLibrary.newAiCompact'
  | 'skillLibrary.newTile'
  | 'skillLibrary.dialog.aria'
  | 'skillLibrary.exportFailed'
  | 'skillLibrary.deleteFailed'
  | 'skillLibrary.deleted'
  | 'skillLibrary.importInvalid'
  | 'skillLibrary.importSuccess'
  | 'skillLibrary.newSkill'
  | 'skillLibrary.importFailed'
  | 'skillLibrary.importReadFailed'
  | 'skillLibrary.noMatch.title'
  | 'skillLibrary.noMine.title'
  | 'skillLibrary.noBuiltin.title'
  | 'skillLibrary.noMatch.description'
  | 'skillLibrary.noMine.description'
  | 'skillCard.playbookStageCount'
  | 'skillCard.assistant'
  | 'skillCard.noDescription'
  | 'skillCard.useInCreation'
  | 'skillCard.exportAria'
  | 'skillCard.exportTooltip'
  | 'skillCard.deleteAria'
  | 'skillCard.deleteTooltip'
  | 'skillCard.builtinReadonly'
  | 'creation.aria'
  | 'creation.expandAssistant'
  | 'creation.aiSuffix'
  | 'onboardingChecklist.triggerAria'
  | 'onboardingChecklist.shortTitle'
  | 'onboardingChecklist.title'
  | 'onboardingChecklist.collapse'
  | 'onboardingChecklist.openHandbook'
  | 'onboardingChecklist.dismiss'
  | 'onboardingChecklist.step.model.label'
  | 'onboardingChecklist.step.model.hint'
  | 'onboardingChecklist.step.storyboard.label'
  | 'onboardingChecklist.step.storyboard.hint'
  | 'onboardingChecklist.step.generated.label'
  | 'onboardingChecklist.step.generated.hint'
  | 'onboardingChecklist.step.exported.label'
  | 'onboardingChecklist.step.exported.hint'
  | 'journey.finale.aria'
  | 'journey.finale.title'
  | 'journey.finale.body'
  | 'journey.finale.startReal'
  | 'journey.finale.browse'
  | 'journey.stepLabel'
  | 'journey.done'
  | 'journey.next'
  | 'journey.autoplay'
  | 'journey.skip'
  | 'journey.write.title'
  | 'journey.write.body'
  | 'journey.split.title'
  | 'journey.split.body'
  | 'journey.canvas.title'
  | 'journey.canvas.body'
  | 'journey.character.title'
  | 'journey.character.body'
  | 'journey.staging.title'
  | 'journey.staging.body'
  | 'journey.trajectory.title'
  | 'journey.trajectory.body'
  | 'journey.generate.title'
  | 'journey.generate.body'
  | 'journey.captions.title'
  | 'journey.captions.body'
  | 'journey.export.title'
  | 'journey.export.body'
  | 'handbook.dialog.aria'
  | 'handbook.close'
  | 'modelSetup.dialog.aria'
  | 'modelSetup.title'
  | 'modelSetup.capabilityIntro'
  | 'modelSetup.kind.image'
  | 'modelSetup.kind.video'
  | 'modelSetup.kind.text'
  | 'modelSetup.kind.audio'
  | 'modelSetup.kind.model3d'
  | 'modelSetup.kind.notConnected'
  | 'modelSetup.loading'
  | 'modelSetup.connected'
  | 'modelSetup.available'
  | 'modelSetup.modelsAvailable'
  | 'modelSetup.modelsEnabled'
  | 'modelSetup.configured'
  | 'modelSetup.recommended'
  | 'modelSetup.connectGenerationModels'
  | 'modelSetup.addModelRelay'
  | 'modelSetup.addModelRelayHint'
  | 'modelSetup.localComfyui'
  | 'modelSetup.dreaminaMember'
  | 'modelSetup.connectAssistantOptional'
  | 'modelSetup.deleteModel.title'
  | 'modelSetup.deleteModel.message'
  | 'modelSetup.deleteModel.confirm'
  | 'modelSetup.deleteModel.error'
  | 'modelSetup.actionFailed'
  | 'modelSetup.card.connected'
  | 'modelSetup.card.todo'
  | 'modelPicker.back'
  | 'modelPicker.title'
  | 'modelPicker.refetch'
  | 'modelPicker.sourceFetched'
  | 'modelPicker.fetchedCount'
  | 'modelPicker.searchPlaceholder'
  | 'modelPicker.selectedCount'
  | 'modelPicker.selectedTotal'
  | 'modelPicker.clear'
  | 'modelPicker.emptyNoModels'
  | 'modelPicker.emptyNoMatch'
  | 'modelPicker.unselectGroup'
  | 'modelPicker.selectGroup'
  | 'modelPicker.manualPlaceholder'
  | 'modelPicker.add'
  | 'modelPicker.cancel'
  | 'modelPicker.addModels'
  | 'vendorCard.defaultCredentialPlaceholder'
  | 'vendorCard.missingMultiCredential'
  | 'vendorCard.missingApiKey'
  | 'vendorCard.unlockFailed'
  | 'vendorCard.unlock'
  | 'vendorCard.cancel'
  | 'vendorCard.defaultCredentialHint'
  | 'vendorCard.credentialSaved'
  | 'vendorCard.change'
  | 'vendorCard.disconnect'
  | 'vendorCard.disconnectTitle'
  | 'vendorCard.disconnectMessage'
  | 'vendorCard.disconnectFailed'
  | 'vendorCard.invalidBaseUrl'
  | 'vendorCard.saveFailed'
  | 'vendorCard.save'
  | 'vendorCard.baseUrl'
  | 'vendorCard.editBaseUrl'

export type TranslationParams = Record<string, string | number>

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

export const translations: Record<SupportedLocale, Record<TranslationKey, string>> = {
  'zh-CN': {
    'app.loading': 'Nomi 加载中',
    'app.mainUi': '应用主界面',
    'common.loading': '加载中',
    'common.noImage': '无图片',
    'common.imageLoadFailed': '加载失败',
    'common.imageLoadFailedWithUrl': '图片加载失败：{{url}}',
    'app.studioAria': 'Nomi Studio',
    'app.close.title': '关闭 Nomi？',
    'app.close.message': '当前窗口将关闭，未完成的生成或导出任务可能会中断。',
    'app.close.confirm': '关闭',
    'app.close.cancel': '取消',
    'app.project.saveError': '项目保存失败，请检查本地磁盘权限',
    'app.project.notFound': '找不到项目文件，可能已被删除，请刷新项目库',
    'app.project.upgraded': '项目已升级到目录树：{{count}} 个节点已归类',
    'app.project.restoreError': '项目恢复失败',
    'app.project.newError': '新建项目失败，请检查本地磁盘权限',
    'app.project.demoOpenError': '打开示例项目失败，请检查本地磁盘权限',
    'app.project.openFolderUnsupported': '当前运行环境不支持打开项目文件夹',
    'app.project.openFolderError': '打开项目文件夹失败',
    'app.project.defaultName': '未命名项目 {{date}}',
    'app.project.untitled': '未命名 Nomi 项目',
    'app.project.renameSaveError': '项目重命名保存失败',
    'app.folderInit.title': '初始化为 Nomi 项目',
    'app.folderInit.message': '{{rootPath}}\n\nNomi 会创建 .nomi/，并把生成的图片、视频保存到 assets/ 和 exports/。',
    'app.folderInit.confirm': '初始化',
    'app.delete.externalTitle': '从库移除项目',
    'app.delete.nativeTitle': '删除项目',
    'app.delete.externalMessage': '确定从项目库移除「{{name}}」吗？这只解除绑定，你的原始文件夹和文件不会被删除。',
    'app.delete.nativeMessage': '确定删除「{{name}}」吗？项目文件夹和本地资源会从磁盘永久删除，无法恢复。',
    'app.delete.externalConfirm': '从库移除',
    'app.delete.nativeConfirm': '删除',
    'app.delete.externalSuccess': '已从库移除',
    'app.delete.nativeSuccess': '项目已删除',
    'app.delete.error': '项目删除失败',
    'app.canvas.loading': '生成画布加载中',
    'app.canvas.loadingLabel': '生成画布加载中',
    'language.switcher.aria': '切换界面语言',
    'language.switcher.leading': '语言',
    'language.zh': '中文',
    'language.en': 'English',
    'language.ru': 'Русский',
    'library.updated.justNow': '刚刚',
    'library.updated.minutesAgo': '{{count}} 分钟前',
    'library.updated.hoursAgo': '{{count}} 小时前',
    'library.updated.daysAgo': '{{count}} 天前',
    'library.actions.replaySplash': '看看 Nomi',
    'library.actions.modelCatalog': '模型接入',
    'library.actions.openBrowser': '浏览器',
    'library.actions.openAssetBox': '素材盒',
    'library.actions.assetBoxTitle': '素材盒',
    'library.actions.assetCount': '{{count}} 个素材',
    'library.title': '项目库',
    'library.startAria': '开始一个项目',
    'library.newBlank.title': '新建空白项目',
    'library.newBlank.description': '从一段文字或想法开始',
    'library.openFolder.title': '打开已有文件夹',
    'library.openFolder.description': '把素材文件夹变成项目',
    'library.journey.title.first': '看 Nomi 怎么出片',
    'library.journey.title.replay': '重看一遍引导',
    'library.journey.description': '60 秒预览，从一句话到成片',
    'library.modelStatus.aria': '模型状态',
    'library.modelStatus.title': '文本模型未接入',
    'library.modelStatus.description': '写故事、拆镜头都需要它；图片 / 视频模型可以等到生成前再接。',
    'library.modelStatus.button': '接入文本模型',
    'library.recent': '最近项目',
    'library.filter.aria': '筛选项目来源',
    'library.filter.all': '全部',
    'library.filter.native': '本地新建',
    'library.filter.folder': '外部文件夹',
    'library.search.placeholder': '搜索项目',
    'library.empty.noMatch': '没有匹配「{{query}}」的项目',
    'library.empty.noCategory': '这个分类下还没有项目',
    'library.empty.clearSearch': '清除搜索',
    'library.project.deleteAria': '删除项目 {{name}}',
    'library.project.deleteTitle': '删除项目',
    'library.project.folderUnavailable': '文件夹暂不可用',
    'library.project.continue': '继续创作',
    'library.project.revealAria': '打开项目文件夹 {{name}}',
    'library.project.revealTitle': '在访达中显示项目文件夹',
    'theme.light': '切换到浅色模式',
    'theme.dark': '切换到深色模式',
    'theme.appearance': '外观',
    'theme.lightMode': '浅色模式',
    'theme.darkMode': '深色模式',
    'window.controls': '窗口控制',
    'window.minimize': '最小化',
    'window.maximize': '最大化',
    'window.restore': '还原',
    'window.close': '关闭',
    'about.dialog.aria': '关于 Nomi',
    'about.currentVersion': '当前版本 {{version}}',
    'about.handbook.title': '上手手册',
    'about.handbook.subtitle': '流水线 · 90 秒首胜 · 能力对照 · 自查',
    'about.update.desktopOnly': '桌面版支持检查更新与一键升级。',
    'about.update.checking': '检查中…',
    'about.update.upToDate': '已是最新版本',
    'about.update.available': '发现新版 {{version}}',
    'about.update.later': '稍后',
    'about.update.download': '下载更新',
    'about.update.openDownload': '前往下载',
    'about.update.manualMac': 'macOS 需手动下载安装包替换旧版（应用未签名，暂不支持就地自动更新）',
    'about.update.downloading': '正在下载更新…',
    'about.update.background': '后台下载，可继续创作 · {{percent}}%',
    'about.update.downloaded': '下载完成',
    'about.update.install': '重启并安装',
    'about.update.error': '更新出错',
    'about.update.retry': '重试',
    'about.update.idle': '检查是否有新版本可用',
    'about.update.check': '检查更新',
    'errorBoundary.title': '出了点问题',
    'errorBoundary.message': '界面遇到一个错误。你可以重新加载继续，或复制错误信息反馈给我们。',
    'errorBoundary.reload': '重新加载',
    'errorBoundary.copy': '复制错误信息',
    'chunk.loadFailed': '{{label}}加载失败',
    'chunk.networkRecovering': '网络抖动中断加载，正在尝试恢复',
    'chunk.otherFeaturesOk': '其余功能不受影响；可重新加载重试',
    'chunk.reload': '重新加载',
    'splash.aria': 'Nomi 开屏介绍',
    'splash.skip': '跳过 ›',
    'splash.caption.start': '从你的一句话开始',
    'splash.caption.canvas': '几秒，铺成一张分镜画布',
    'splash.caption.control': '每一格，你说了算',
    'splash.caption.timeline': '排进时间轴，导出成片',
    'splash.caption.brand': '',
    'splash.creation.prompt': '把你的一句话…',
    'splash.node.opening': '镜 1 · 开场',
    'splash.node.closeup': '镜 2 · 特写',
    'splash.node.ending': '镜 3 · 收尾',
    'splash.timeline.video': '画面',
    'splash.timeline.audio': '声音',
    'splash.brand.slogan': 'AI 起草，你定稿',
    'studio.appbar.aria': 'Nomi 工作台',
    'studio.appbar.about': '关于 Nomi · 检查更新',
    'studio.appbar.breadcrumb': '位置导航',
    'studio.appbar.backToLibrary': '返回项目库',
    'studio.appbar.projectName': '项目名称',
    'studio.appbar.globalActions': '全局操作',
    'studio.appbar.openBrowser': '打开浏览器',
    'studio.appbar.browser': '浏览器',
    'studio.appbar.openAssetBox': '打开素材盒',
    'studio.appbar.assetBox': '素材盒',
    'studio.appbar.assetCount': '{{count}} 个素材',
    'studio.appbar.openModelSetup': '打开模型接入',
    'studio.appbar.modelSetup': '模型接入',
    'studio.appbar.export': '导出',
    'studio.appbar.exportMp4': '导出 MP4',
    'studio.appbar.goPreviewExport': '前往预览导出',
    'studio.windowbar.aria': '窗口标题栏',
    'studio.windowbar.quickActions': '项目快捷操作',
    'studio.workspace.creation': '创作区',
    'studio.workspace.generation': '生成区',
    'studio.workspace.preview': '预览区',
    'studio.workspace.loading': '{{label}}加载中',
    'studio.stepper.aria': '工作区切换',
    'studio.stepper.creation': '创作',
    'studio.stepper.generation': '生成',
    'studio.stepper.preview': '预览',
    'generation.timeline.chunk': '生成时间轴',
    'generation.aria': '生成区',
    'generation.expandTimeline': '展开生成时间轴',
    'generation.timeline': '时间轴',
    'generation.clipCount': '{{count}} 段',
    'generation.aiSidebar': '生成区 AI 侧栏',
    'generation.resizeAssistant': '拖动调整助手宽度',
    'preview.aria': '预览区',
    'preview.timeline.region': '预览时间轴',
    'preview.timeline.actionPrefix': '预览时间轴-',
    'preview.player.aria': '预览播放器',
    'preview.placeholder.title': '画面预览',
    'preview.placeholder.description': '从「生成区」拖入素材即可显示',
    'preview.videoPlayFailed': '视频播放失败：{{message}}',
    'preview.videoLoadFailed': '视频加载失败：{{message}}',
    'preview.controls.aria': '预览控制',
    'preview.play': '播放',
    'preview.pause': '暂停',
    'preview.timelineEmpty': '时间轴为空',
    'preview.previousFrame': '上一帧',
    'preview.previousFrameTitle': '上一帧（←）',
    'preview.nextFrame': '下一帧',
    'preview.nextFrameTitle': '下一帧（→）',
    'preview.mute': '静音',
    'preview.unmute': '取消静音',
    'preview.volume': '音量',
    'preview.fullscreen': '全屏',
    'preview.exitFullscreen': '退出全屏',
    'preview.fullscreenTitle': '全屏预览',
    'preview.aspectRatio': '预览画幅',
    'preview.aspectRatioLeading': '画幅',
    'preview.fitMode': '画面适配',
    'preview.fitLeading': '显示',
    'preview.fitContain': '适应',
    'preview.fitCover': '填充',
    'preview.framing': '预览构图',
    'preview.zoomOut': '缩小画面',
    'preview.zoomCurrent': '当前缩放',
    'preview.zoomReset': '重置画面',
    'preview.zoomIn': '放大画面',
    'preview.addText.aria': '添加文字',
    'preview.addText.title': '加字幕 / 标题卡（都是文字，可自由拖动缩放）',
    'preview.text': '文字',
    'preview.caption': '字幕',
    'preview.captionHint': '底部 · 小',
    'preview.titleCard': '标题卡',
    'preview.titleCardHint': '居中 · 大',
    'preview.textDragTitle': '拖动移动 · 四角缩放 · 双击改字',
    'preview.textSelectTitle': '点选 · 双击改字',
    'preview.export.preparing': '准备中…',
    'preview.export.converting': '转码 MP4…',
    'preview.export.recording': '导出中 {{percent}}%',
    'preview.export.cancel': '取消导出',
    'preview.export.cancelDisabled': '准备中，暂不可取消',
    'preview.export.mp4': '导出 MP4',
    'preview.export.success': '已导出到项目 exports 文件夹：{{path}}',
    'preview.export.error': '导出失败',
    'preview.export.title.empty': '时间轴为空，先添加素材',
    'preview.export.title.converting': '正在转码 MP4',
    'preview.export.title.recording': '导出中 {{percent}}%',
    'preview.export.title.ready': '导出 MP4：1080p · {{aspectRatio}} · 标准发布 · 保存到项目 exports 文件夹',
    'preview.textStyle.aria': '文字样式',
    'preview.textStyle.fontSize': '字号',
    'preview.textStyle.decrease': '减小字号',
    'preview.textStyle.increase': '增大字号',
    'preview.textStyle.percent': '字号百分比',
    'preview.textStyle.font': '字体',
    'timeline.selectedActions': '选中片段操作',
    'timeline.regenerateShot': '重新生成这个镜头',
    'timeline.regenerateShotTitle': '重新生成这个镜头（就地重出、贴回原位；改 prompt/参数请去画布节点）',
    'timeline.nudgeEarlier': '向前微调片段',
    'timeline.copyClip': '复制片段',
    'timeline.nudgeLater': '向后微调片段',
    'timeline.aiArrange': 'AI 拼片',
    'timeline.aiArrangeTitle': 'AI 拼片：把生成区的镜头按镜序排进时间轴（已在轨的跳过）',
    'timeline.aiArrange.success': '已把 {{count}} 个镜头按镜序排进时间轴',
    'timeline.aiArrange.empty': '生成区还没有镜头——先去生成区生成几个镜头再拼片',
    'timeline.aiArrange.already': '镜头都已在时间轴上了',
    'timeline.splitExit': '退出剪刀模式',
    'timeline.splitEnter': '剪刀模式（点片段处分割）',
    'timeline.splitExitTitle': '剪刀模式开启中：点片段即在光标处分割 · Esc 退出',
    'timeline.splitEnterTitle': '剪刀：进入后点片段即可在该处分割',
    'timeline.redo': '重做时间轴编辑',
    'timeline.redoTitle': '重做（⇧⌘Z）',
    'timeline.undo': '撤销时间轴编辑',
    'timeline.undoTitle': '撤销（⌘Z）',
    'timeline.zoomOut': '{{prefix}}缩小时间轴',
    'timeline.zoomReset': '重置缩放',
    'timeline.zoomIn': '{{prefix}}放大时间轴',
    'timeline.deleteSelected': '{{prefix}}删除选中片段',
    'timeline.collapse': '{{prefix}}收起时间轴',
    'timeline.ruler': '时间刻度',
    'timeline.dragPlayhead': '拖动播放头',
    'timeline.textTrack': '文字轨',
    'timeline.textEmpty': '用上方「字幕 / 标题卡」添加',
    'timeline.emptyText': '（空）',
    'timeline.caption': '字幕',
    'timeline.titleCard': '标题卡',
    'timeline.resizeLeft': '向左调整时长',
    'timeline.resizeRight': '向右调整时长',
    'timeline.emptyAudio': '从素材库拖入音频当配乐',
    'timeline.emptyMedia': '从生成区拖入素材',
    'timeline.dropAudioReject': '只有音频素材能放到音频轨',
    'timeline.dropPlace': '放到 {{timecode}}',
    'timeline.overlayLayer': '叠加层',
    'timeline.addCaption': '添加字幕',
    'timeline.audioDrop': '拖音频到此当配乐',
    'timeline.trimStart': '调整片段起点',
    'timeline.trimEnd': '调整片段终点',
    'mediaType.image': '图片',
    'mediaType.video': '视频',
    'asset.kind.all': '全部',
    'asset.kind.none': '无分类',
    'asset.kind.image': '图片',
    'asset.kind.video': '视频',
    'asset.kind.audio': '音频',
    'assetPicker.limitReached': '已到该类型上限',
    'assetPicker.search': '搜索素材名',
    'assetPicker.canvas': '画布',
    'assetPicker.projectRecent': '项目素材 · 最近',
    'assetPicker.browseAll': '浏览全部 →',
    'assetPicker.loading': '素材加载中',
    'assetPicker.noMatch': '没有匹配的素材',
    'assetPicker.empty': '还没有素材，上传或拖入开始',
    'assetPicker.uploadingLabel': '上传中',
    'assetPicker.uploading': '上传中…',
    'assetPicker.uploadLocal': '上传本地文件',
    'assetPicker.footer': '或把文件拖进来 · 从卡片拉条线 · 从素材面板拖到节点',
    'assetLibrary.source.aria': '素材来源筛选',
    'assetLibrary.source.all': '全部素材',
    'assetLibrary.source.project': '项目素材',
    'assetLibrary.title': '素材库',
    'assetLibrary.close': '关闭素材库',
    'assetLibrary.dialog.aria': '素材库',
    'assetLibrary.upload': '上传',
    'assetLibrary.uploadAria': '上传素材',
    'assetLibrary.webCapture': '网页捕捞',
    'assetLibrary.webCaptureTitle': '打开浏览器找参考：悬停图片点「捕捞」或直接拖进来',
    'assetLibrary.filePicker': '素材文件选择器',
    'assetLibrary.search': '搜索素材…',
    'assetLibrary.categoryFilter': '筛选素材分类',
    'assetLibrary.categoryDialog': '素材分类筛选',
    'assetLibrary.categoryList': '素材分类',
    'assetLibrary.categoryTitle': '分类：{{label}}',
    'assetLibrary.deleteSelectedAria': '删除 {{count}} 个项目素材',
    'assetLibrary.deleteSelectedTitle': '删除 {{count}} 个项目素材',
    'assetLibrary.deleteDisabledTitle': '请先选择项目素材',
    'assetLibrary.dragMultiple': '{{count}} 个素材',
    'assetLibrary.dragToTimelineAudio': '拖到时间轴音频轨',
    'assetLibrary.dragToCanvas': '拖到画布',
    'assetLibrary.selectableProjectAsset': '当前项目画布素材，可选择后删除',
    'assetLibrary.mediaImport.success': '已导入 {{count}} 个素材',
    'assetLibrary.audioImport.success': '已导入 {{count}} 个音频',
    'assetLibrary.importSkipped.tooLarge': '{{count}} 个过大',
    'assetLibrary.importSkipped.overLimit': '{{count}} 个超单次上限',
    'assetLibrary.importSkipped.duplicate': '{{count}} 个重复',
    'assetLibrary.importSkipped.failed': '{{count}} 个失败',
    'assetLibrary.importSkipped.summary': '已跳过：{{items}}',
    'assetLibrary.import.mediaFailed': '素材导入失败，请重试',
    'assetLibrary.import.audioFailed': '音频导入失败，请重试',
    'assetLibrary.import.unsupportedSkipped': '已跳过 {{count}} 个不支持的文件',
    'assetLibrary.delete.noProject': '删除失败：当前没有打开的项目',
    'assetLibrary.delete.selectFirst': '请先选中要删除的项目素材',
    'assetLibrary.delete.notDeletable': '选中的素材暂时无法删除',
    'assetLibrary.delete.confirmTitle': '删除 {{count}} 个项目素材？',
    'assetLibrary.delete.confirmMessage': '对应画布节点与「全部素材」中的落盘文件会同步删除。项目文件会移到系统回收站。',
    'assetLibrary.delete.confirm': '删除',
    'assetLibrary.delete.unsupported': '当前运行环境不支持删除项目素材',
    'assetLibrary.delete.projectSuccess': '已删除 {{count}} 个项目素材',
    'assetLibrary.delete.fileSuccess': '已删除 {{count}} 个落盘素材',
    'assetLibrary.delete.fileFailed': '{{count}} 个落盘素材删除失败',
    'assetLibrary.delete.failed': '删除项目素材失败，请检查文件权限',
    'assetLibrary.empty.project': '还没有项目素材',
    'assetLibrary.empty.all': '还没有素材',
    'assetLibrary.empty.noMatch': '没有匹配的素材',
    'assetLibrary.empty.description': '点「上传」导入图片、视频或音频，或在生成区生成后会自动出现在这里。',
    'assetLibrary.empty.noMatchDescription': '换个筛选或搜索词试试。',
    'assetMention.empty': '先加参考图',
    'assetMention.choose': '放入哪张',
    'assetMention.insertReference': '插入参考{{index}}',
    'projectExplorer.aria': '项目资源管理器',
    'projectExplorer.nav': '项目侧栏导航',
    'projectExplorer.findAssets': '找素材',
    'projectExplorer.categories': '分类',
    'projectExplorer.promptLibrary': '提示词库',
    'projectExplorer.promptRail': '提示词',
    'projectExplorer.skillLibrary': '技能库',
    'projectExplorer.skillRail': '技能',
    'projectExplorer.assetLibrary': '素材库',
    'projectExplorer.expandSidebar': '展开侧栏',
    'projectExplorer.collapseSidebar': '收起侧栏',
    'projectExplorer.webCapture': '网页捕捞',
    'projectExplorer.webCaptureTitle': '打开浏览器找参考：悬停图片点「捕捞」或直接拖进来',
    'projectExplorer.newCategory': '新建分类',
    'categoryTree.builtin.shots': '分镜',
    'categoryTree.builtin.cast': '角色',
    'categoryTree.builtin.scene': '场景',
    'categoryTree.builtin.prop': '道具',
    'categoryTree.builtin.audio': '声音',
    'categoryTree.customDefault': '新分类',
    'categoryTree.copiedTo': '已复制到 {{target}}',
    'categoryTree.deleteCategory.title': '删除分类',
    'categoryTree.deleteCategory.message': '删除分类「{{label}}」？里面的节点会移回「{{fallback}}」，不会丢失。',
    'categoryTree.deleteNode.title': '删除节点',
    'categoryTree.deleteNode.message': '删除节点「{{label}}」？跨分类副本不会受影响。',
    'categoryTree.deleteGroup.title': '删除子组',
    'categoryTree.deleteGroup.message': '删除子组「{{name}}」并删除其中 {{count}} 个节点？',
    'categoryTree.confirmDelete': '删除',
    'categoryTree.nodeName': '节点名称',
    'categoryTree.groupColor': '组颜色',
    'categoryTree.groupColorMessage': '输入 CSS 颜色值',
    'categoryTree.menu.newGroup': '新建子组',
    'categoryTree.menu.rename': '重命名',
    'categoryTree.menu.deleteCategory': '删除分类',
    'categoryTree.menu.copy': '复制',
    'categoryTree.menu.regenerateDerived': '派生重新生成',
    'categoryTree.menu.delete': '删除',
    'categoryTree.menu.changeColor': '改颜色',
    'categoryTree.menu.ungroup': '解组（保留节点）',
    'categoryTree.menu.deleteWithNodes': '删除（连节点）',
    'categoryTree.emptyNodes': '暂无节点',
    'categoryItem.nameAria': '分类名称',
    'groupItem.nameAria': '子组名称',
    'groupItem.empty': '空组',
    'nodeItem.derived': '由其他节点派生',
    'nodeItem.kind.text': '文',
    'nodeItem.kind.character': '角',
    'nodeItem.kind.scene': '景',
    'nodeItem.kind.image': '图',
    'nodeItem.kind.keyframe': '帧',
    'nodeItem.kind.video': '影',
    'nodeItem.kind.shot': '镜',
    'nodeItem.kind.output': '出',
    'nodeItem.kind.panorama': '全',
    'nodeItem.kind.default': '节',
    'assetFinder.unstar': '取消标记',
    'assetFinder.markMain': '标为主镜',
    'assetFinder.mainMark': '主镜',
    'assetFinder.zone.film': '成片',
    'assetFinder.zone.reference': '参考',
    'assetFinder.search': '搜素材…',
    'assetFinder.starOnly': '只看标记过的',
    'assetFinder.aiGroupTitle': '读没归好那些的提示词，用 AI 归成命名组',
    'assetFinder.aiGrouping': '正在用 AI 归类…',
    'assetFinder.aiGroup': '用 AI 整理未分组的 {{count}} 张',
    'assetFinder.aiGroupSuccess': '已归好 {{groups}} 组（{{count}} 张）',
    'assetFinder.aiGroupNone': '没找到能确定归类的，已保持未分组',
    'assetFinder.aiGroupFailed': 'AI 分组失败',
    'assetFinder.textModelRequired': '请先在「模型接入」里启用一个文本模型',
    'assetFinder.empty.noFilm': '还没有成片',
    'assetFinder.empty.noReference': '还没有参考',
    'assetFinder.empty.noMatch': '没有匹配的素材',
    'assetFinder.empty.filterHint': '换个搜索或清掉星标筛选。',
    'assetFinder.empty.filmHint': '在生成区生成镜头后会自动出现在这里。',
    'assetFinder.empty.referenceHint': '导入图片或拖入参考后出现在这里。',
    'assetFinder.ungrouped': '未分组',
    'workspaceFiles.title': '素材',
    'workspaceFiles.listView': '列表视图',
    'workspaceFiles.sort': '排序素材',
    'workspaceFiles.sortAscending': '升序排列',
    'workspaceFiles.sortDescending': '降序排列',
    'workspaceFiles.refresh': '刷新项目文件',
    'workspaceFiles.import': '导入素材',
    'workspaceFiles.importTitle': '把本地文件拷贝进项目素材文件夹',
    'workspaceFiles.importing': '正在导入',
    'workspaceFiles.mediaTypes': '图片、视频、音频',
    'workspaceFiles.noProject': '打开项目后显示文件',
    'workspaceFiles.loading': '正在读取项目文件…',
    'workspaceFiles.empty.title': '还没有文件',
    'workspaceFiles.empty.description': '点上方「导入本地文件」，或把文件拖进来。',
    'workspaceFiles.truncated': '文件较多，已显示前 500 个',
    'workspaceFiles.readError': '无法读取项目文件夹，请检查权限或重新打开文件夹',
    'filePreview.aria': '预览 {{name}}',
    'filePreview.reveal': '在 Finder 打开',
    'filePreview.close': '关闭',
    'filePreview.unsupported': '这种格式暂不支持预览',
    'filePreview.unsupportedHint': '用上方「在 Finder 打开」查看',
    'filePreview.loading': '加载中…',
    'filePreview.readFailed': '读取失败：{{message}}',
    'activeSkill.title': '当前技能 · 点击切换',
    'activeSkill.choose': '选择创作技能',
    'activeSkill.auto': '自动',
    'activeSkill.followMode': '跟随创作模式（{{label}}）',
    'activeSkill.playbookStages': 'playbook · {{count}} 段',
    'activeSkill.missingProviders': '缺{{providers}}模型，跑到生成会卡住',
    'activeSkill.connect': '去接入',
    'activeSkill.authorName': 'AI 写技能',
    'activeSkill.authorTitle': '让 AI 帮我写技能',
    'activeSkill.authorDescription': '贴别家的技能 / 说需求 / 附文档，AI 转写成 Nomi 能用的',
    'provider.text': '文本',
    'provider.image': '图像',
    'provider.video': '视频',
    'richText.bold': '加粗',
    'richText.italic': '斜体',
    'richText.h1': '一级标题',
    'richText.h2': '二级标题',
    'richText.bulletList': '项目符号',
    'richText.orderedList': '编号列表',
    'richText.blockquote': '引用',
    'richText.undo': '撤销',
    'richText.redo': '重做',
    'workbenchEditor.placeholder': '从这里开始写你的故事、脚本或文案……  选中文字，点右侧即可生成图片 / 视频节点。',
    'workbenchEditor.toolbar': '文本工具栏',
    'workbenchEditor.aria': '创作文档编辑区',
    'textDocument.placeholder': '在这里写文本……',
    'textDocument.toolbar': '文本格式',
    'textDocument.drag': '拖动文本节点',
    'textDocument.label': '文本',
    'attachment.remove': '移除附件',
    'attachment.uploadFailed': '上传失败',
    'attachment.rail': '已添加的附件',
    'attachment.file': '文件',
    'staleConversation.divider': '以上对话 AI 已不再记得',
    'canvas.navigation': '画布导航',
    'canvas.zoom': '画布缩放',
    'canvas.fitView': '适应视图',
    'canvas.empty': '画布为空',
    'canvas.resetView': '重置视图',
    'canvas.zoomPercent': '缩放比例',
    'canvas.tidy': '整理画布',
    'canvas.tidyTitle': '整理画布（散乱时一键收纳 · ⌘Z 撤销）',
    'canvas.hideMinimap': '隐藏小地图',
    'canvas.showMinimap': '显示小地图',
    'canvas.minimapMinimum': '至少 {{count}} 个节点后显示小地图',
    'canvas.empty.title': '这里还没有{{name}}',
    'canvas.empty.description': '添加第一个节点开始创作，之后可以拖动、分组、跨分类复制。',
    'canvas.empty.createAria': '新建一个{{name}}节点',
    'canvas.empty.create': '+ 新建{{name}}',
    'canvas.category.shots': '画面',
    'canvas.category.cast': '角色',
    'canvas.category.scene': '场景',
    'canvas.category.prop': '道具',
    'canvas.category.audio': '声音',
    'canvas.category.node': '节点',
    'canvas.gesture.aria': '画布手势提示',
    'canvas.gesture.panKeys': '双指滑',
    'canvas.gesture.pan': '平移',
    'canvas.gesture.zoomKeys': '⌘ + 滚轮',
    'canvas.gesture.zoom': '缩放',
    'canvas.gesture.selectKeys': '空白拖',
    'canvas.gesture.select': '框选',
    'canvas.gesture.dismiss': '知道了，关闭手势提示',
    'canvas.selection.aria': '选中区域操作',
    'canvas.selection.count': '已选 {{count}} 个',
    'canvas.selection.generateTitle': '生成选中节点（参考先生成、镜头后生成；缺参考的会提示先生成参考卡）',
    'canvas.selection.generate': '生成 {{count}} 个',
    'canvas.selection.ungroup': '解除分组 (⇧⌘G)',
    'canvas.selection.group': '创建分组 (⌘G)',
    'canvas.selection.clear': '清除选择',
    'canvas.focusNodeMissing': '源节点已不存在',
    'canvas.import.none': '没有可导入画布的素材',
    'canvas.import.one': '已导入画布',
    'canvas.import.many': '已导入 {{count}} 个素材到画布',
    'inlineParams.configureModel': '去配置模型',
    'inlineParams.openModelSetup': '点击打开模型接入页',
    'inlineParams.configure': '去配置 →',
    'inlineParams.booleanOn': '开',
    'inlineParams.booleanOff': '关',
    'inlineParams.model': '模型',
    'inlineParams.selectModel': '选择模型',
    'inlineParams.variant': '变体',
    'inlineParams.more': '更多',
    'inlineParams.provider': '供应商',
    'modeBar.generationMode': '生成方式',
    'nodeComposer.promptPicker.aria': '素材盒提示词',
    'nodeComposer.promptPicker.empty': '素材盒暂无可用提示词',
    'nodeComposer.promptPicker.open': '打开素材盒提示词',
    'nodeComposer.promptPicker.title': '素材盒提示词',
    'nodeComposer.promptPicker.button': '提示词',
    'nodeComposer.textMode.aria': '生成模式',
    'nodeComposer.textMode.append': '续写',
    'nodeComposer.textMode.rewrite': '改写',
    'nodeComposer.textMode.replace': '重写',
    'nodeComposer.textMode.appendPlaceholder': '续写要求…（留空＝直接接着往下写）',
    'nodeComposer.textMode.rewritePlaceholder': '改写要求…（先在正文里选中要改的文字）',
    'nodeComposer.textMode.replacePlaceholder': '重写要求…（替换整篇）',
    'nodeComposer.disabled.videoNeedsReference': '需要先添加参考素材（拖入 / 连线 / 点 +）',
    'nodeComposer.disabled.videoNeedsFirstFrame': '需要先连接一个图片节点作为首帧',
    'nodeComposer.disabled.imageNeedsReference': '图生图需要参考图（拖入 / 连线 / 点 +），或切回「文生图」',
    'nodeComposer.disabled.imageNeedsReferenceDetailed': '图生图需要参考图：请连接图片节点或添加参考，或切回「文生图」',
    'nodeComposer.disabled.unsupported': '「{{kind}}」类型暂不支持直接生成',
    'nodeComposer.generating': '生成中…',
    'nodeComposer.generateReferencesFirst': '先生成参考，再生成本镜',
    'nodeComposer.regenerate': '重新生成',
    'nodeComposer.generate': '生成',
    'nodeComposer.generateAsset': '生成素材',
    'nodeComposer.uploadingLabel': '上传中',
    'nodeComposer.uploading': '上传中…',
    'nodeComposer.dropReference': '松手添加为参考',
    'nodeRecoverable.aria': '任务可能已在上游完成，可重新拉取结果',
    'nodeRecoverable.title': '任务可能已在上游完成',
    'nodeRecoverable.description': '等待已超上限，但上游可能仍出了片。点下面直接拉回，不用去服务商后台下载。',
    'nodeRecoverable.recover': '重新拉取结果',
    'nodeRecoverable.recovering': '正在拉取…',
    'nodeRecoverable.markFailed': '标记为失败',
    'aiHeader.conversationHistory': '会话历史',
    'assistantModel.aria': '助手模型',
    'assistantModel.title': '助手用哪个模型（建议选 GPT / Claude / DeepSeek 系，能稳定执行画布操作）',
    'assetTile.addReference': '加参考',
    'resultDownload.defaultVideoName': '视频',
    'resultDownload.defaultImageName': '图片',
    'resultDownload.success': '已保存到本地',
    'resultDownload.failed': '下载失败',
    'imageTransform.rotateLeft': '向左旋转 90°',
    'imageTransform.rotateRight': '向右旋转 90°',
    'imageTransform.flipHorizontal': '水平翻转',
    'imageTransform.flipVertical': '垂直翻转',
    'imageEdit.aria': '图片操作',
    'imageEdit.makeup': '定妆',
    'imageEdit.makeupTitle': '定妆：基于这张图，预填一份角色/场景身份板提示词到新节点（不自动生成）',
    'imageEdit.aiEdit': 'AI 编辑',
    'imageEdit.decomposing': '拆解中',
    'imageEdit.decomposeLayers': '拆解元素（拆成可编辑图层）',
    'imageEdit.textEdit': '改字（保留字体改文字）',
    'imageEdit.crop': '裁剪',
    'imageEdit.cropTitle': '裁剪（可拖取景框，加入堆叠并设为主图）',
    'imageEdit.removingBackground': '抠图中',
    'imageEdit.removeBackground': '抠图',
    'imageEdit.removeBackgroundTitle': '抠图（去除背景，加入堆叠并设为主图）',
    'imageEdit.gridSplit': '切图',
    'imageEdit.grid2': '四视图（2×2）',
    'imageEdit.grid3': '九宫格（3×3）',
    'imageEdit.transform': '变换',
    'imageEdit.whiteboard': '画板',
    'imageEdit.whiteboardTitle': '在画板中编辑（自动导入当前图片）',
    'imageEdit.download': '下载',
    'imageEdit.downloadTitle': '下载 / 另存到本地',
    'imageEdit.defaultImage': '图片',
    'imageEdit.decomposedElements': '拆解元素',
    'imageEdit.progress.decode': '读取图片中',
    'imageEdit.progress.inference': '识别主体中',
    'imageEdit.progress.mask': '生成透明遮罩',
    'imageEdit.progress.encode': '导出透明 PNG',
    'imageEdit.progress.model': '加载抠图模型',
    'imageEdit.progress.removing': '抠图中',
    'imageEdit.removeBackgroundFailed': '抠图失败，请检查网络连接后重试',
    'assistantMessage.processing': '处理中',
    'assistantMessage.stopped': '已停止',
    'conversation.new': '新对话',
    'conversation.savedToHistory': '当前会存入历史',
    'conversation.delete': '删除这段对话',
    'conversation.justNow': '刚刚',
    'conversation.minutesAgo': '{{count}} 分钟前',
    'conversation.hoursAgo': '{{count}} 小时前',
    'conversation.yesterday': '昨天',
    'resultToolbar.aria': '结果操作',
    'videoToolbar.aria': '视频操作',
    'videoToolbar.extracting': '抽帧中…',
    'videoToolbar.extractFirst': '抽首帧',
    'videoToolbar.extractFirstTitle': '抽取这段视频的第一帧 → 落成独立图片节点（可当首帧/参考）',
    'videoToolbar.extractLast': '抽尾帧',
    'videoToolbar.extractLastTitle': '抽取这段视频的最后一帧 → 落成独立图片节点（可当尾帧/接力源/参考）',
    'node.toast.generateBeforeTimeline': '该节点还没生成画面，先点「生成」',
    'node.connection.to': '连接到此节点',
    'node.connection.from': '从此节点开始连线',
    'node.panoramaActions': '全景图操作',
    'node.panoramaPreview': '全景预览',
    'node.panoramaReupload': '重新上传',
    'node.independentCopy': '独立副本',
    'node.sourceMissing': '源节点已不存在',
    'node.locateSource': '定位源节点：{{label}}',
    'node.independentCopyFromCategory': '独立副本（来自 {{category}}·{{label}}）',
    'node.independentCopyFrom': '独立副本（来自 {{label}}）',
    'node.independentCopySourceMissing': '独立副本（源节点已不存在）',
    'node.provenance': '生成记录 / Provenance',
    'canvasToolbar.aria': '生成画布工具栏',
    'canvasToolbar.addMenu': '添加节点菜单',
    'canvasToolbar.addNode': '添加{{label}}节点',
    'canvasNodeKind.text': '文本',
    'canvasNodeKind.image': '图片',
    'canvasNodeKind.video': '视频',
    'canvasNodeKind.audio': '声音',
    'canvasNodeKind.model3d': '3D 模型',
    'canvasNodeKind.whiteboard': '画板',
    'canvasNodeKind.panorama': '全景图',
    'canvasNodeKind.scene3d': '3D 场景',
    'canvasAssistant.launcher': '生成区 AI 启动器',
    'canvasAssistant.suffix': '生成',
    'canvasAssistant.panel': '生成区 AI 助手',
    'canvasAssistant.dropTitle': '拖到这里添加附件',
    'canvasAssistant.dropHint': '图片 / PDF / Word / Excel / txt · 单个上限 30MB',
    'canvasAssistant.title': '生成助手',
    'canvasAssistant.collapse': '收起 AI',
    'canvasAssistant.sendMessage': '给生成助手发送消息',
    'canvasAssistant.placeholder': '告诉我画布上想怎么搭...',
    'canvasAssistant.addAttachment': '添加附件',
    'canvasAssistant.addAttachmentLong': '添加附件（也可拖拽 / 粘贴）',
    'canvasAssistant.modeAria': 'AI 模式',
    'canvasAssistant.modeLeading': '模式',
    'canvasAssistant.mode.chat': '问答',
    'canvasAssistant.mode.refine': '润色',
    'canvasAssistant.stop': '停止',
    'canvasAssistant.send': '发送',
    'canvasAssistant.emptyTitle': '我帮你搭画布',
    'canvasAssistant.emptyBody': '铺镜头、改提示词、连节点都交给我；出图按节点上的「生成」键。',
    'canvasAssistant.suggestion.shots': '列 3 个镜头铺到画布',
    'canvasAssistant.suggestion.prompt': '给选中的镜头写一版提示词',
    'canvasAssistant.suggestion.connect': '把镜头按先后顺序连起来',
    'canvasAssistant.reject': '拒绝',
    'canvasAssistant.confirm': '确认',
    'assistantError.provider': '服务商：{{message}}',
    'assistantError.retry': '重试',
    'assistantError.modelSetup': '去模型接入',
    'assistantError.technicalDetails': '技术详情',
    'noTextModel.readyTitle': '大脑已就位',
    'noTextModel.readyBody': '「模型设置」里多了一行「文本」。现在可以拆镜头、对话了——再发一次试试。',
    'noTextModel.title': '创作助手还缺一个文本大脑',
    'noTextModel.bodyBefore': '你接的是图片 / 视频生成模型，负责出画面。拆镜头、对话、写文案需要一个',
    'noTextModel.bodyModel': '文本对话模型',
    'noTextModel.bodyAfter': '当大脑。',
    'noTextModel.enable': '启用 {{name}}',
    'noTextModel.settings': '去模型设置',
    'spend.agentDriven': '经 AI 助手（MCP）驱动 · 需你确认花费',
    'spend.autoIgnore': '{{seconds}}s 后自动忽略',
    'spend.suppressSession': '本次会话不再提示',
    'spend.ignore': '忽略',
    'spend.cancel': '取消',
    'spend.confirmGenerate': '确认生成',
    'nodeError.aria': '生成失败：{{reason}}',
    'nodeError.provider': '服务商原话：',
    'nodeError.retry': '重试生成',
    'nodeError.copy': '复制详情',
    'nodeError.copied': '已复制',
    'nodeError.technicalDetails': '技术详情',
    'creationAssistant.aria': 'AI 创作区',
    'creationAssistant.title': '创作助手',
    'creationAssistant.expand': '放大对话',
    'creationAssistant.shrink': '缩小',
    'creationAssistant.expandAria': '放大创作助手',
    'creationAssistant.shrinkAria': '缩小创作助手',
    'creationAssistant.collapse': '收起创作助手',
    'creationAssistant.emptyTitle': '需要一点灵感？',
    'creationAssistant.emptyBody': '告诉 AI 你想写什么，它会给你一个开头。',
    'creationAssistant.suggestion.opening': '给我一个开头',
    'creationAssistant.suggestion.visual': '把这段写得更有画面感',
    'creationAssistant.suggestion.storyboard': '梳理成分镜脚本',
    'creationAssistant.emptyContent': '（空内容）',
    'creationAssistant.reject': '拒绝',
    'creationAssistant.apply': '应用',
    'creationAssistant.placeholder': '拆成镜头、做成视频、立张角色卡，或问我任何事…',
    'creationAssistant.inputAria': '创作 AI 输入',
    'creationAssistant.modeAria': '创作模式',
    'creationAssistant.write.insert': '插入到光标',
    'creationAssistant.write.replace': '替换选区',
    'creationAssistant.write.append': '追加到文末',
    'creationAssistant.callFailed': '创作 AI 调用失败',
    'creationAssistant.defaultStoryboardPrompt': '🎬 拆镜头',
    'creationAssistant.defaultFixationPrompt': '🎭 立角色卡',
    'creationAssistant.attachmentPrompt': '请看这些附件',
    'creationAssistant.processCurrentDocument': '{{mode}}：处理当前文稿',
    'creationAssistant.cancelled': '（已停止）',
    'creationAssistant.emptyResponse': '（空响应：AI 没有返回文本）',
    'creationAssistant.truncated': '⚠️ 这条回复可能没说完（达到模型单次输出上限被截断）。需要的话直接说「继续」。',
    'creationAssistant.errorPrefix': '（错误）{{message}}',
    'creationAssistant.needStoryForStoryboard': '先在左侧写一段故事，再让 AI 拆镜头。',
    'creationAssistant.needScriptForFixation': '先在左侧写一段剧本，再让 AI 按剧本定妆。',
    'creationAssistant.attachmentsUploading': '附件还在上传，请等上传完成再发送。',
    'creationAssistant.revisingPlan': '正在按你的要求修改方案…',
    'creationAssistant.planningStoryboard': '正在拆镜头，整理分镜方案…',
    'creationAssistant.planningStoryboardStream': '正在拆镜头…',
    'creationAssistant.planUpdated': '方案已按你的要求更新，见下方编辑器。',
    'creationAssistant.planReady': '分镜方案已生成，见下方卡片——可打开编辑、修改后确认落画布。',
    'creationAssistant.storyboardFailed': '拆镜头失败：{{message}}',
    'creationAssistant.unknownError': '未知错误',
    'creationAssistant.fixationPlanning': '已切到生成区，正在让 AI 按剧本为角色/场景定妆。',
    'cardCommon.cutout': '抠图中',
    'cardCommon.cutoutNode': '抠图节点',
    'cardCommon.cutoutProgress': '{{title}} 正在生成透明 PNG',
    'cardCommon.generating': '生成中',
    'cardCommon.upload': '+ 上传{{label}}',
    'cardCommon.node': '节点',
    'editableTitle.edit': '点击编辑名字',
    'card.characterImage': '角色图',
    'card.sceneImage': '场景图',
    'card.propImage': '道具图',
    'card.unnamedCharacter': '未命名角色',
    'card.unnamedScene': '未命名场景',
    'card.unnamedProp': '未命名道具',
    'card.ownerPrefix': '属于 {{name}}',
    'imageCrop.cancel': '取消',
    'imageCrop.confirmCrop': '确认裁剪',
    'imageCrop.confirmSplit': '确认切图',
    'audio.noSubtitles': '暂无可生成字幕的内容',
    'audio.subtitlesCopied': '字幕已复制（SRT，可粘贴为 .srt）',
    'audio.copyTranscript': '复制转写文本',
    'audio.copy': '复制',
    'audio.generateSubtitles': '生成字幕',
    'audio.play': '播放',
    'audio.pause': '暂停',
    'audio.upload': '上传音频',
    'audio.sound': '声音',
    'audio.uploadOrConnect': '上传或连接音频',
    'storyboard.action.storyboardLead': '看起来你想把故事拆成镜头。',
    'storyboard.action.storyboardCta': '拆成镜头 · 落画布',
    'storyboard.action.fixationLead': '看起来你想给角色立卡。',
    'storyboard.action.fixationCta': '立角色卡',
    'storyboard.action.modeAria': '分镜类型',
    'storyboard.action.imageMode': '图片分镜',
    'storyboard.action.videoMode': '视频分镜',
    'storyboard.action.imageHint': '每镜一张静态画面，满意后可转视频',
    'storyboard.action.videoHint': '每镜一段带时长的视频',
    'storyboard.action.started': '已开始',
    'storyboard.plan.defaultTitle': '分镜方案',
    'storyboard.plan.meta': '{{shots}} 个镜头 · {{anchors}} 个参考锚 · {{tail}}',
    'storyboard.plan.imageMode': '图片分镜',
    'storyboard.plan.discardTitle': '丢弃这份方案？',
    'storyboard.plan.discardMessage': '方案和你的修改会清空，可以重新让 AI 拆镜头。',
    'storyboard.plan.discardConfirm': '丢弃',
    'storyboard.plan.status.editing': '编辑中',
    'storyboard.plan.status.committed': '已落画布',
    'storyboard.plan.status.draft': '草稿',
    'storyboard.plan.editingSummary': '正在左侧编辑器中修改 · {{count}} 个镜头',
    'storyboard.plan.collapseCard': '收起卡片',
    'storyboard.plan.confirmInEditor': '在编辑器里确认即落画布',
    'storyboard.plan.committedSummary': '{{count}} 个镜头已建成画布节点',
    'storyboard.plan.editAgain': '再次编辑',
    'storyboard.plan.goGeneration': '去生成区',
    'storyboard.plan.emptyPrompt': '（未写提示词）',
    'storyboard.plan.moreShots': '还有 {{count}} 个镜头',
    'storyboard.plan.openEdit': '打开编辑',
    'storyboard.plan.discard': '丢弃',
    'storyboard.editor.issue.noShots': '还没有镜头',
    'storyboard.editor.issue.emptyShotPrompt': '镜 {{index}} 没写提示词',
    'storyboard.editor.issue.danglingRef': '镜 {{index}} 有失效引用',
    'storyboard.editor.issue.anchorNoName': '有锚还没起名字',
    'storyboard.editor.landFailedTitle': '落画布失败',
    'storyboard.editor.unknownError': '未知错误，请重试。',
    'storyboard.editor.titleAria': '方案标题',
    'storyboard.editor.titlePlaceholder': '给方案起个名字',
    'storyboard.editor.shotCount': '{{count}} 镜',
    'storyboard.editor.collapse': '收起',
    'storyboard.editor.discardPlan': '丢弃方案',
    'storyboard.editor.noticeLead': 'AI 草拟，随便改',
    'storyboard.editor.noticeTail': '确认前不生成、不花钱',
    'storyboard.editor.anchorsTitle': '跨镜头要一致的',
    'storyboard.editor.anchorsHint': '生成参考图=锁长相 · 仅提示词=写进 prompt',
    'storyboard.editor.noAnchors': '还没有锚——加一个，或直接写镜头。',
    'storyboard.editor.addAnchor': '添加锚（角色 / 场景 / 道具 / 风格）',
    'storyboard.editor.shotsTitle': '分镜 · {{count}} 镜',
    'storyboard.editor.addShot': '添加镜头',
    'storyboard.editor.issuesSummary': '{{count}} 处待处理：{{issue}}',
    'storyboard.editor.readySummary': '全部就绪 · {{anchors}} 锚 · {{shots}} 镜',
    'storyboard.editor.landing': '落画布中…',
    'storyboard.editor.confirmLand': '确认落画布',
    'storyboard.shot.durationSeconds': '{{seconds}} 秒',
    'storyboard.shot.defaultModel': '默认模型',
    'storyboard.shot.index': '镜 {{index}}',
    'storyboard.shot.kindAria': '镜头类型',
    'storyboard.shot.kindLeading': '类型',
    'storyboard.shot.image': '图片',
    'storyboard.shot.video': '视频',
    'storyboard.shot.durationAria': '时长',
    'storyboard.shot.durationLeading': '时长',
    'storyboard.shot.imageModel': '图片模型',
    'storyboard.shot.videoModel': '视频模型',
    'storyboard.shot.modelLeading': '模型',
    'storyboard.shot.provider': '供应商',
    'storyboard.shot.delete': '删除镜头',
    'storyboard.shot.references': '参考',
    'storyboard.shot.unnamed': '未命名',
    'storyboard.shot.removeReference': '移除参考 {{name}}',
    'storyboard.shot.danglingTitle': '引用已失效，点一下移除',
    'storyboard.shot.danglingLabel': '失效引用',
    'storyboard.shot.danglingWarning': '有引用的锚已被删除——移除失效标签，或回上面重新加锚',
    'storyboard.anchor.kindSwitchAria': '类型：{{kind}}，点击切换',
    'storyboard.anchor.kindSwitchTitle': '点击切换类型',
    'storyboard.anchor.kind.character': '角色',
    'storyboard.anchor.kind.scene': '场景',
    'storyboard.anchor.kind.prop': '道具',
    'storyboard.anchor.kind.style': '风格',
    'storyboard.anchor.namePlaceholder': '起个名字',
    'storyboard.anchor.nameAria': '锚名字',
    'storyboard.anchor.editDescription': '编辑描述',
    'storyboard.anchor.delete': '删除锚',
    'storyboard.anchor.descriptionAria': '锚描述',
    'storyboard.anchor.visualPlaceholder': '外貌/服装/光线，给生成模型的参考描述',
    'storyboard.anchor.textPlaceholder': '能用文字说清的特征（色调/品牌色/服装词），会拼进每个引用它的镜头',
    'storyboard.anchor.collapse': '收起',
    'storyboard.anchor.carrier.visualTitle': '点切换为「仅提示词」',
    'storyboard.anchor.carrier.textTitle': '点切换为「生成参考图」',
    'storyboard.anchor.carrier.visual': '参考图',
    'storyboard.anchor.carrier.text': '文字',
    'browserAsset.open': '打开资产包',
    'browserAsset.dialog': '资产包',
    'browserAsset.title': '素材盒',
    'browserAsset.source.aria': '素材来源',
    'browserAsset.source.my': '项目素材',
    'browserAsset.source.transcript': '提示词库',
    'browserAsset.tab.all': '全部',
    'browserAsset.tab.image': '图片',
    'browserAsset.tab.video': '视频',
    'browserAsset.tab.prompt': '提示词',
    'browserAsset.tab.folder': '文件夹',
    'browserAsset.capture.off': '关闭资源捕捞',
    'browserAsset.capture.on': '开启资源捕捞',
    'browserAsset.capture.offTitle': '关闭资源捕捞',
    'browserAsset.capture.onTitle': '资源捕捞：悬停资源后按 Ctrl+C 保存',
    'browserAsset.promptSettings': '提示词提取设置',
    'browserAsset.dock.restore': '恢复浮动素材盒',
    'browserAsset.dock.right': '吸附到右侧',
    'browserAsset.dock.restoreTitle': '恢复浮动',
    'browserAsset.dock.rightTitle': '吸附到右侧',
    'browserAsset.minimize': '最小化资产包',
    'browserAsset.search': '搜索素材',
    'browserAsset.upload': '上传素材',
    'browserAsset.newFolder': '新建文件夹',
    'browserAsset.moreTools': '更多素材工具',
    'browserAsset.toggleLayout': '切换素材布局',
    'browserAsset.sort.oldest': '最早优先',
    'browserAsset.sort.newest': '最新优先',
    'browserAsset.filterCategories': '筛选分类',
    'browserAsset.fileInput': '选择素材文件',
    'browserAsset.parentFolder': '返回上一级文件夹',
    'browserAsset.breadcrumb': '文件夹路径',
    'browserAsset.promptMasonry': '提示词库瀑布流',
    'browserAsset.list': '素材列表',
    'browserAsset.grid': '素材网格',
    'browserAsset.dropToSave': '松开以保存到素材盒',
    'browserAsset.assetActions': '素材操作',
    'browserAsset.importCanvas': '导入画布',
    'browserAsset.delete': '删除',
    'browserAsset.blankActions': '空白区域操作',
    'browserAsset.filter.dialog': '素材分类筛选',
    'browserAsset.filter.show': '显示',
    'browserAsset.filter.showAll': '显示全部',
    'browserAsset.filter.categoryAria': '素材分类',
    'browserAsset.promptCategory.dialog': '提示词分类筛选',
    'browserAsset.promptCategory.title': '提示词分类',
    'browserAsset.promptCategory.aria': '提示词分类',
    'browserAsset.promptCategory.placeholder': '输入分类名称',
    'browserAsset.promptCategory.confirm': '确认添加提示词分类',
    'browserAsset.promptCategory.add': '添加分类',
    'browserAsset.promptCategory.image': '图片提示词',
    'browserAsset.promptCategory.video': '视频提示词',
    'browserAsset.status.downloading': '下载中...',
    'browserAsset.status.importUnavailable': '无法导入网页素材',
    'browserAsset.status.downloadFailed': '下载失败',
    'browserAsset.status.folder': '文件夹',
    'browserAsset.status.saveFailed': '保存失败',
    'browserAsset.status.saving': '保存中...',
    'browserAsset.status.localText': '本地文本',
    'browserAsset.status.localImport': '本地导入',
    'browserAsset.status.extracting': '提取中...',
    'browserAsset.status.extractFailed': '提取失败',
    'browserAsset.newFolderTitle': '新建文件夹',
    'browserAsset.newFolderTitleIndexed': '新建文件夹 {{index}}',
    'browserAsset.unnamedAsset': '未命名素材',
    'browserAsset.source.capture': '网页捕捞',
    'browserAsset.source.drag': '网页拖拽',
    'browserAsset.empty.noMatch.title': '没有匹配的素材',
    'browserAsset.empty.noMatch.description': '换个分类或搜索词试试。',
    'browserAsset.empty.folder.title': '文件夹还是空的',
    'browserAsset.empty.folder.description': '拖入素材，或把已选素材移动到这里。',
    'browserAsset.empty.prompt.title': '还没有提示词',
    'browserAsset.empty.prompt.description': '从浏览器图片或截图提取提示词后会出现在这里。',
    'browserAsset.empty.assets.title': '还没有素材',
    'browserAsset.empty.assets.description': '上传本地文件，或在浏览器里捕捞图片和视频。',
    'browserAsset.type.folder': '文件夹',
    'browserAsset.type.image': '图片',
    'browserAsset.type.video': '视频',
    'browserAsset.type.prompt': '提示词',
    'browserPrompt.mode.replicate': '画面复刻',
    'browserPrompt.mode.style': '画面风格',
    'browserPrompt.detail.aria': '提示词详情',
    'browserPrompt.detail.title': '提示词详情',
    'browserPrompt.detail.close': '关闭提示词详情',
    'browserPrompt.detail.referenceImages': '参考图片',
    'browserPrompt.detail.prompt': '提示词',
    'browserPrompt.detail.model': '模型',
    'browserPrompt.detail.currentTextModel': '当前文本模型',
    'browserPrompt.detail.copied': '已复制',
    'browserPrompt.detail.copy': '复制',
    'browserPrompt.card.extracting': '正在分析参考图并提取提示词...',
    'browserPrompt.card.extractFailed': '提示词提取失败',
    'browserPrompt.card.empty': '暂无提示词',
    'browserPrompt.error.noReference': '没有可分析的参考图',
    'browserPrompt.error.noVisionModel': '请先在「模型接入」里启用一个支持图片输入的文本模型',
    'browserPrompt.error.noPromptReturned': '模型没有返回提示词',
    'browserPrompt.error.noUsablePrompt': '模型没有返回可用提示词',
    'browserPrompt.settings.aria': '提示词提取设置',
    'browserPrompt.settings.title': '提示词提取设置',
    'browserPrompt.settings.subtitle': '保存到当前项目 .nomi/browser-prompt-extraction.json',
    'browserPrompt.settings.close': '关闭提示词提取设置',
    'browserPrompt.settings.default': '默认',
    'browserPrompt.settings.addCustom': '添加自定义',
    'browserPrompt.settings.name': '名称',
    'browserPrompt.settings.prompt': '提示词',
    'browserPrompt.settings.projectAvailable': '设置会随项目文件夹迁移',
    'browserPrompt.settings.projectUnavailable': '当前项目目录不可用，保存会失败',
    'browserPrompt.settings.resetDefault': '恢复默认',
    'browserPrompt.settings.delete': '删除',
    'browserPrompt.settings.cancel': '取消',
    'browserPrompt.settings.save': '保存',
    'browserPrompt.settings.untitledTemplate': '未命名模板',
    'browserDialog.aria': '浏览器',
    'browserDialog.loading': '加载中...',
    'browserDialog.newTab': '新建标签页',
    'browserDialog.closeNamedTab': '关闭 {{title}}',
    'browserDialog.closeBrowser': '关闭浏览器',
    'browserDialog.back': '后退',
    'browserDialog.forward': '前进',
    'browserDialog.reload': '刷新',
    'browserDialog.addressPlaceholder': '输入网址或搜索关键词',
    'browserDialog.addressAria': '地址栏',
    'browserDialog.saveBookmark': '保存为书签',
    'browserDialog.materialSites': '素材网站',
    'browserDialog.materialSitesList': '素材网站列表',
    'browserDialog.screenshotPrompt': '截图提取提示词',
    'browserDialog.menuHint': '右键标签或书签打开菜单',
    'browserDialog.webContent': '网页内容',
    'browserDialog.emptyTitle': '打开网页参考',
    'browserDialog.emptyDescription': '输入网址直达，或用 Bing 搜索关键词',
    'browserDialog.startSearch': '搜 Bing 或输入网址',
    'browserDialog.open': '打开',
    'browserDialog.commonSites': '常用参考站点',
    'browserDialog.promptModePicker': '选择提示词提取方式',
    'browserDialog.video': '视频',
    'browserDialog.tabMenu': '{{title}} 标签菜单',
    'browserDialog.bookmarkMenu': '{{title}} 书签菜单',
    'browserDialog.bookmarked': '已收藏',
    'browserDialog.bookmark': '收藏',
    'browserDialog.closeTab': '关闭标签',
    'browserDialog.closeAll': '关闭全部',
    'browserDialog.rename': '重命名',
    'browserDialog.delete': '删除',
    'browserDialog.defaultBookmark.nomi': 'Nomi 官网',
    'browserDialog.promptMode.replicateDescription': '还原主体、构图、光影和细节',
    'browserDialog.promptMode.styleDescription': '提取配色、字体、构图、效果 JSON',
    'browserDialog.siteHint.visual': '视觉灵感',
    'browserDialog.siteHint.designPortfolio': '设计作品集',
    'browserDialog.siteHint.ui': 'UI 灵感',
    'browserDialog.siteHint.conceptArt': '概念美术',
    'browserDialog.siteHint.chineseDiscovery': '中文种草',
    'browserDialog.siteHint.videoReference': '视频参考',
    'browserDialog.siteHint.filmFrames': '电影分镜',
    'browserDialog.siteHint.creatorUpdates': '创作者动态',
    'browserDialog.limitTabs': '最多只能打开 {{limit}} 个标签页',
    'browserDialog.createViewFailed': '浏览器视图创建失败',
    'browserDialog.renameBookmarkPrompt': '重命名书签',
    'browserDialog.noPromptImages': '没有找到可提取提示词的图片。',
    'browserDialog.promptEntryFailed': '图片提示词提取入口失败',
    'browserDialog.textSelectionSaveFailed': '保存网页选中文字失败',
    'browserDialog.textPromptSaved': '已保存到素材盒提示词库',
    'browserDialog.screenshotNeedsPage': '打开网页后才能截图提取提示词。',
    'browserDialog.selectionUnsupported': '当前浏览器不支持选区截图。',
    'browserDialog.selectionFailed': '选区截图失败',
    'browserDialog.screenshotStyleTitle': '网页选区风格',
    'browserDialog.screenshotPromptTitle': '网页选区提示词',
    'browserDialog.captureNeedsPage': '打开网页后才能使用资源捕捞。',
    'browserDialog.captureHoverHint': '先将鼠标悬停在图片或视频上，再按 Ctrl+C 保存。',
    'browserDialog.captureFailed': '网页素材捕捞失败',
    'browserDialog.webVideo': '网页视频',
    'browserDialog.webImage': '网页图片',
    'tool.camera.title': '运镜',
    'tool.camera.tooltip': '运镜：不用搭 3D 场景，一键生成灰模运镜片接入本镜',
    'tool.camera.subtitle': '不用搭 3D 场景',
    'tool.camera.typeAria': '运镜类型',
    'tool.camera.speed': '速度',
    'tool.camera.shot': '景别',
    'tool.camera.layerSoonTitle': '叠加第二段运镜——敬请期待',
    'tool.camera.addLayer': '叠一层',
    'tool.camera.comingSoon': '敬请期待',
    'tool.camera.readout': '{{move}} · {{speed}} · {{duration}}s → 灰模运镜片自动接入 video_ref',
    'tool.camera.apply': '应用',
    'tool.camera.toastCreated': '已生成「{{move}} · {{speed}} · {{duration}}s」运镜片，正在离屏渲染并接入本镜运镜参考。',
    'tool.camera.move.push_in': '推进',
    'tool.camera.move.pull_out': '拉远',
    'tool.camera.move.orbit_left': '左环绕',
    'tool.camera.move.orbit_right': '右环绕',
    'tool.camera.move.crane_up': '升镜',
    'tool.camera.move.crane_down': '降镜',
    'tool.camera.move.track_left': '左移',
    'tool.camera.move.track_right': '右移',
    'tool.camera.move.arc_left': '左弧移',
    'tool.camera.move.arc_right': '右弧移',
    'tool.camera.move.zoom_in': '变焦近',
    'tool.camera.move.zoom_out': '变焦远',
    'tool.camera.move.dolly_zoom': '滑动变焦',
    'tool.camera.speed.slow': '慢',
    'tool.camera.speed.medium': '中',
    'tool.camera.speed.fast': '快',
    'tool.camera.shot.wide': '远',
    'tool.camera.shot.medium': '中',
    'tool.camera.shot.close': '近',
    'tool.promptOptimizer.apply': '应用到提示词',
    'tool.promptOptimizer.rerun': '重新优化',
    'tool.promptOptimizer.resultHeader': 'Nomi 优化版（高亮=改动）',
    'tool.promptOptimizer.ideaHeader': '说一句想法，Nomi 帮你改这条',
    'tool.promptOptimizer.running': '正在优化…',
    'tool.promptOptimizer.placeholder': '如：换成黄昏、情绪更紧张、加点雾气…（留空也能优化）',
    'tool.promptOptimizer.ideaAria': '优化想法',
    'tool.promptOptimizer.run': '优化这条提示词',
    'tool.promptOptimizer.aria': '用 Nomi 优化提示词',
    'tool.promptOptimizer.title': '用 Nomi 优化提示词',
    'tool.promptOptimizer.buttonIdle': '优化',
    'tool.promptOptimizer.noTextModel': '请先在「模型接入」里启用一个文本模型',
    'tool.promptOptimizer.emptyResult': '没拿到优化结果，请重试',
    'tool.promptOptimizer.failed': '优化失败',
    'tool.convertShot.badge': '镜头 {{index}}',
    'tool.convertShot.aria': '把这张图转成视频镜头（作为首帧）',
    'tool.convertShot.title': '转视频镜头 · 这张图作为首帧',
    'tool.convertShot.button': '转视频',
    'tool.convertShot.already': '这一镜已转过视频，已选中它',
    'tool.convertShot.created': '已转出视频镜头 · 这张图作为首帧',
    'tool.panorama.enterAria': '进入全景预览',
    'tool.panorama.enter': '进入全景',
    'tool.panorama.dialog': '全景预览',
    'tool.panorama.upload': '+ 上传全景图',
    'tool.panorama.notReady': '全景还没准备好，请稍后再试',
    'tool.panorama.screenshotFailed': '截图失败，请重试',
    'tool.panorama.screenshotTitle': '全景截图',
    'tool.panorama.screenshotPrompt': '全景取景框截图',
    'tool.panorama.screenshotCreated': '已创建全景截图节点',
    'tool.panorama.screenshotCapturing': '截图中…',
    'tool.panorama.screenshotCapturingShort': '截图中',
    'tool.panorama.screenshotFrame': '截图取景框',
    'tool.panorama.empty': '上传全景图或连接图片节点',
    'tool.panorama.closePreview': '关闭预览',
    'tool.provenance.aria': '生成 Provenance',
    'tool.provenance.title': '生成记录 · {{name}}',
    'tool.provenance.close': '关闭',
    'tool.provenance.empty': '该节点没有可追溯的生成记录。',
    'tool.provenance.possibleReasons': '可能原因：',
    'tool.provenance.reasonLegacy': '节点来自 v0.4.0 之前的旧项目（Provenance 是 v0.5 新增能力）',
    'tool.provenance.reasonLocal': '素材为本地导入，非 AI 生成',
    'tool.provenance.reasonFailed': '生成调用失败，未写入 Provenance',
    'tool.provenance.provider': '供应商',
    'tool.provenance.model': '模型',
    'tool.provenance.time': '时间',
    'tool.provenance.emptyPrompt': '(空)',
    'tool.provenance.copyPrompt': '复制 Prompt',
    'tool.provenance.params': '参数',
    'tool.provenance.regenerate': '用相同参数重生成',
    'whiteboard.title': '画板',
    'whiteboard.close': '关闭',
    'whiteboard.closeAria': '关闭画板',
    'whiteboard.saveMain': '保存为主图',
    'whiteboard.screenshotCreateNode': '截图并创建图片节点',
    'whiteboard.boardNotReady': '画布还未准备好',
    'whiteboard.imageNodeMissing': '图片节点不存在',
    'whiteboard.screenshotSaveFailed': '画板截图保存失败，请稍后重试',
    'whiteboard.saveMainSuccess': '已保存为主图',
    'whiteboard.saveFailed': '画板保存失败',
    'whiteboard.screenshotCreated': '已创建画板截图节点',
    'whiteboard.screenshotFailed': '画板截图失败',
    'whiteboard.aspectTitle': '画板比例',
    'whiteboard.ratio': '比例',
    'whiteboard.aspectSelect': '选择画板比例',
    'whiteboard.library.dragAdd': '拖到画板中添加',
    'whiteboard.library.title': '素材库',
    'whiteboard.library.board': '画板',
    'whiteboard.library.results': '结果',
    'whiteboard.library.dragCopy': '拖到画板中复制',
    'whiteboard.library.emptyBoard': '画板中的图片节点结果会显示在这里',
    'whiteboard.library.emptyResults': '连接的图片节点结果会显示在这里',
    'whiteboard.removeBgProcessing': '抠图处理中',
    'whiteboard.fullscreen': '全屏',
    'whiteboard.exitFullscreen': '退出全屏',
    'whiteboard.importImage': '导入图片',
    'whiteboard.customBrushColor': '自定义画笔颜色',
    'whiteboard.colorAria': '颜色 {{color}}',
    'whiteboard.deleteSelected': '删除选中元素',
    'whiteboard.imageReadFailed': '图片读取失败',
    'whiteboard.selectImageFile': '请选择图片文件',
    'whiteboard.importFailed': '导入图片失败',
    'whiteboard.removeBgSuccess': '已替换为抠图结果',
    'whiteboard.removeBgFailed': '抠图失败，请检查网络连接后重试',
    'whiteboard.leaferAria': 'Leafer 画板',
    'whiteboard.drawingLayerAria': '绘图操作层',
    'whiteboard.tool.brush': '画笔',
    'whiteboard.tool.select': '选择',
    'whiteboard.tool.eraser': '橡皮',
    'whiteboard.tool.shape': '形状',
    'whiteboard.open': '打开画板',
    'whiteboard.openHint': '点击打开画板',
    'whiteboard.screenshotTitle': '{{name}} 截图',
    'whiteboard.imageResult': '图片结果',
    'whiteboard.importedImage': '导入图片',
    'whiteboard.originalImage': '原图',
    'whiteboard.material': '素材',
    'whiteboard.resultImage': '结果图片',
    'whiteboard.copySuffix': '副本',
    'whiteboard.backgroundLayer': '背景',
    'whiteboard.layerOne': '图层 1',
    'whiteboard.hideItem': '隐藏{{name}}',
    'whiteboard.showItem': '显示{{name}}',
    'promptLibrary.source.aria': '提示词来源',
    'promptLibrary.source.mine': '我的库',
    'promptLibrary.source.nomi': 'Nomi 精选',
    'promptLibrary.category.aria': '提示词类型筛选',
    'promptLibrary.category.all': '全部',
    'promptLibrary.title': '提示词库',
    'promptLibrary.close': '关闭提示词库',
    'promptLibrary.search': '搜提示词…',
    'promptLibrary.new': '新建',
    'promptLibrary.noMatch.title': '没有匹配的提示词',
    'promptLibrary.noMatch.description': '换个筛选或搜索词试试。',
    'promptLibrary.loading': '正在从公开库拉取提示词…',
    'promptLibrary.fetchEmpty.title': '没拉到提示词',
    'promptLibrary.retry': '重试',
    'promptLibrary.dialog.aria': '提示词库',
    'promptLibrary.sentToCanvas': '已送上画布 · {{kind}}节点',
    'promptLibrary.canvasNode': '分镜',
    'promptLibrary.videoNode': '视频',
    'promptLibrary.deleted': '已从我的库删除 · {{title}}',
    'promptComposer.editTitle': '编辑提示词',
    'promptComposer.newTitle': '新建提示词',
    'promptComposer.typeAria': '提示词类型',
    'promptComposer.titlePlaceholder': '标题（选填，如「黄昏剪影」）',
    'promptComposer.promptPlaceholder': '把验证过好用的提示词粘进来…',
    'promptComposer.emptyError': '提示词不能为空',
    'promptComposer.saveError': '保存失败',
    'promptComposer.cancel': '取消',
    'promptComposer.save': '保存',
    'promptComposer.saveToMine': '存进我的库',
    'promptCard.mine': '我的',
    'promptCard.edit': '编辑',
    'promptCard.delete': '删除',
    'promptPreview.noMedia': '此条暂无封面媒体',
    'promptPreview.close': '关闭',
    'promptPreview.copy': '复制提示词',
    'promptPreview.copied': '已复制',
    'promptPreview.send': '送上画布',
    'promptPreview.sent': '已送上画布',
    'promptPreview.source': '来源',
    'promptPreview.localOnly': '我的库 · 仅本地',
    'skillLibrary.source.aria': '技能来源',
    'skillLibrary.source.mine': '我的技能',
    'skillLibrary.source.builtin': 'Nomi 内置',
    'skillLibrary.authorName': 'AI 写技能',
    'skillLibrary.title': '技能库',
    'skillLibrary.close': '关闭技能库',
    'skillLibrary.search': '搜技能…',
    'skillLibrary.importFile': '导入文件',
    'skillLibrary.newAi': '用 AI 新建',
    'skillLibrary.newAiCompact': 'AI 新建',
    'skillLibrary.newTile': '用 AI 新建一个',
    'skillLibrary.dialog.aria': '技能库',
    'skillLibrary.exportFailed': '导出失败：没找到这个技能',
    'skillLibrary.deleteFailed': '删除失败',
    'skillLibrary.deleted': '已删除 · {{name}}',
    'skillLibrary.importInvalid': '导入失败：不是合法的技能包文件（JSON 解析失败）',
    'skillLibrary.importSuccess': '已导入 · {{name}}',
    'skillLibrary.newSkill': '新技能',
    'skillLibrary.importFailed': '导入失败：{{message}}',
    'skillLibrary.importReadFailed': '导入失败：读不出这个文件',
    'skillLibrary.noMatch.title': '没有匹配的技能',
    'skillLibrary.noMine.title': '你还没有自己的技能',
    'skillLibrary.noBuiltin.title': '没有内置技能',
    'skillLibrary.noMatch.description': '换个搜索词试试。',
    'skillLibrary.noMine.description': '点「用 AI 新建」让 AI 帮你写一个，或「导入文件」接别人的技能包。',
    'skillCard.playbookStageCount': 'playbook · {{count}} 段',
    'skillCard.assistant': '助手',
    'skillCard.noDescription': '暂无说明',
    'skillCard.useInCreation': '在创作区用',
    'skillCard.exportAria': '导出 {{name}}',
    'skillCard.exportTooltip': '导出技能包',
    'skillCard.deleteAria': '删除 {{name}}',
    'skillCard.deleteTooltip': '删除技能',
    'skillCard.builtinReadonly': '内置技能 · 只读',
    'creation.aria': '创作区',
    'creation.expandAssistant': '展开创作助手',
    'creation.aiSuffix': '创作',
    'onboardingChecklist.triggerAria': '上手 4 步，已完成 {{done}} / {{total}}',
    'onboardingChecklist.shortTitle': '上手',
    'onboardingChecklist.title': '上手 4 步',
    'onboardingChecklist.collapse': '收起',
    'onboardingChecklist.openHandbook': '看完整手册',
    'onboardingChecklist.dismiss': '不再提示',
    'onboardingChecklist.step.model.label': '接入模型',
    'onboardingChecklist.step.model.hint': '连一个 AI 服务（用你自己的 Key）。',
    'onboardingChecklist.step.storyboard.label': '拆一个镜头',
    'onboardingChecklist.step.storyboard.hint': '在创作区说「拆成镜头」，铺成画布。',
    'onboardingChecklist.step.generated.label': '生成一张',
    'onboardingChecklist.step.generated.hint': '在镜头卡里选模型，点「生成」出图。',
    'onboardingChecklist.step.exported.label': '导出成片',
    'onboardingChecklist.step.exported.hint': '排进时间轴，右上「导出」输出 MP4。',
    'journey.finale.aria': '引导结束',
    'journey.finale.title': '这就是全程，现在轮到你',
    'journey.finale.body': '从一句话到成片，每一步都在你眼皮底下。要不要用你自己的故事走一遍？',
    'journey.finale.startReal': '用我自己的故事走一遍',
    'journey.finale.browse': '先逛逛',
    'journey.stepLabel': '讲解 {{current}}/{{total}}',
    'journey.done': '完成',
    'journey.next': '下一步',
    'journey.autoplay': '自动播放中',
    'journey.skip': '跳过',
    'journey.write.title': '① 一切从你的一句话开始',
    'journey.write.body': '在创作区写下你的故事，AI 一个字一个字陪你码。',
    'journey.split.title': '② AI 把故事拆成镜头',
    'journey.split.body': '跨镜的人物、场景一致项也帮你锁好。',
    'journey.canvas.title': '③ 一键铺成画布',
    'journey.canvas.body': '每个镜头一张卡，全在你眼皮底下。',
    'journey.character.title': '同一个人，每镜长一样',
    'journey.character.body': '靠这张身份卡锁住脸——小孩和小机器人每个镜头都不串。',
    'journey.staging.title': '谁站哪、朝哪',
    'journey.staging.body': '用 3D 摆一下站位，AI 照着画——比如屋顶上两个并排坐。',
    'journey.trajectory.title': '想要推拉摇移',
    'journey.trajectory.body': '画一条相机轨迹，AI 复刻这个运镜——比如夕阳下缓缓拉远。',
    'journey.generate.title': '这就是出好的成片',
    'journey.generate.body': '示例已生成好——你自己用时，点每张卡的生成按钮出你的版本。',
    'journey.captions.title': '排进时间轴',
    'journey.captions.body': '给镜头加字幕、标题卡，节奏你说了算。',
    'journey.export.title': '成片拿走',
    'journey.export.body': '一键导出 MP4，整条流水线就此走完。',
    'handbook.dialog.aria': '上手手册',
    'handbook.close': '关闭上手手册',
    'modelSetup.dialog.aria': '模型设置',
    'modelSetup.title': '模型设置',
    'modelSetup.capabilityIntro': '你现在已经能生成',
    'modelSetup.kind.image': '图片',
    'modelSetup.kind.video': '视频',
    'modelSetup.kind.text': '文本',
    'modelSetup.kind.audio': '配音',
    'modelSetup.kind.model3d': '3D',
    'modelSetup.kind.notConnected': '未接',
    'modelSetup.loading': '加载中…',
    'modelSetup.connected': '已接入',
    'modelSetup.available': '可接入',
    'modelSetup.modelsAvailable': '{{count}} 个模型可用',
    'modelSetup.modelsEnabled': '{{enabled}} / {{total}} 个模型已启用',
    'modelSetup.configured': '已配置',
    'modelSetup.recommended': '新手推荐',
    'modelSetup.connectGenerationModels': '接入生成模型',
    'modelSetup.addModelRelay': '添加模型 / 中转站',
    'modelSetup.addModelRelayHint': 'new-api 一次拉全图·视频·文本 · 也可接官方厂商 / 自定义接口',
    'modelSetup.localComfyui': '有本地 ComfyUI？',
    'modelSetup.dreaminaMember': '有即梦会员？',
    'modelSetup.connectAssistantOptional': '接入编程助手 · 可选',
    'modelSetup.deleteModel.title': '删除模型',
    'modelSetup.deleteModel.message': '删除「{{name}}」？此操作不可恢复，之后要用需重新拉取。',
    'modelSetup.deleteModel.confirm': '删除',
    'modelSetup.deleteModel.error': '删除失败',
    'modelSetup.actionFailed': '操作失败',
    'modelSetup.card.connected': '已连通',
    'modelSetup.card.todo': '待接入',
    'modelPicker.back': '返回',
    'modelPicker.title': '选择要添加的模型',
    'modelPicker.refetch': '重新拉取',
    'modelPicker.sourceFetched': '{{source}}{{host}}{{total}}',
    'modelPicker.fetchedCount': '拉到 {{count}} 个',
    'modelPicker.searchPlaceholder': '搜索模型 id…',
    'modelPicker.selectedCount': '已选 {{count}}',
    'modelPicker.selectedTotal': ' / 共 {{total}}',
    'modelPicker.clear': '清空',
    'modelPicker.emptyNoModels': '这个地址没列出模型，在下方手填模型 id',
    'modelPicker.emptyNoMatch': '没有匹配的模型',
    'modelPicker.unselectGroup': '取消本组',
    'modelPicker.selectGroup': '全选本组',
    'modelPicker.manualPlaceholder': '没列出来的，输入模型 id 回车添加',
    'modelPicker.add': '添加',
    'modelPicker.cancel': '取消',
    'modelPicker.addModels': '添加 {{count}} 个模型',
    'vendorCard.defaultCredentialPlaceholder': '粘贴你的 API Key（sk-…）',
    'vendorCard.missingMultiCredential': '请把上面每一项都填上。',
    'vendorCard.missingApiKey': '请先粘贴 API Key。',
    'vendorCard.unlockFailed': '解锁失败：{{message}}',
    'vendorCard.unlock': '解锁',
    'vendorCard.cancel': '取消',
    'vendorCard.defaultCredentialHint': '填一次即可，密钥本地加密存储、只在调用时使用。',
    'vendorCard.credentialSaved': '凭证已保存',
    'vendorCard.change': '更换',
    'vendorCard.disconnect': '断开',
    'vendorCard.disconnectTitle': '断开供应商',
    'vendorCard.disconnectMessage': '断开「{{name}}」？该家模型会回到"未连通"，需重新填 key。',
    'vendorCard.disconnectFailed': '断开失败：{{message}}',
    'vendorCard.invalidBaseUrl': '接入地址需以 http(s):// 开头。',
    'vendorCard.saveFailed': '保存失败：{{message}}',
    'vendorCard.save': '保存',
    'vendorCard.baseUrl': '接入地址：{{baseUrl}}',
    'vendorCard.editBaseUrl': '编辑 {{name}} 接入地址',
  },
  en: {
    'app.loading': 'Loading Nomi',
    'app.mainUi': 'Main interface',
    'common.loading': 'Loading',
    'common.noImage': 'No image',
    'common.imageLoadFailed': 'Load failed',
    'common.imageLoadFailedWithUrl': 'Image failed to load: {{url}}',
    'app.studioAria': 'Nomi Studio',
    'app.close.title': 'Close Nomi?',
    'app.close.message': 'This window will close. Unfinished generation or export jobs may be interrupted.',
    'app.close.confirm': 'Close',
    'app.close.cancel': 'Cancel',
    'app.project.saveError': 'Project save failed. Check local disk permissions.',
    'app.project.notFound': 'Project files were not found. They may have been deleted. Refresh the project library.',
    'app.project.upgraded': 'Project upgraded to the folder tree: {{count}} nodes categorized',
    'app.project.restoreError': 'Project restore failed',
    'app.project.newError': 'Project creation failed. Check local disk permissions.',
    'app.project.demoOpenError': 'Demo project failed to open. Check local disk permissions.',
    'app.project.openFolderUnsupported': 'This runtime cannot open the project folder.',
    'app.project.openFolderError': 'Failed to open project folder',
    'app.project.defaultName': 'Untitled project {{date}}',
    'app.project.untitled': 'Untitled Nomi Project',
    'app.project.renameSaveError': 'Project rename failed to save',
    'app.folderInit.title': 'Initialize as a Nomi project',
    'app.folderInit.message': '{{rootPath}}\n\nNomi will create .nomi/ and save generated images and videos to assets/ and exports/.',
    'app.folderInit.confirm': 'Initialize',
    'app.delete.externalTitle': 'Remove project from library',
    'app.delete.nativeTitle': 'Delete project',
    'app.delete.externalMessage': 'Remove "{{name}}" from the project library? This only removes the binding. Your original folder and files will not be deleted.',
    'app.delete.nativeMessage': 'Delete "{{name}}"? The project folder and local assets will be permanently deleted from disk.',
    'app.delete.externalConfirm': 'Remove',
    'app.delete.nativeConfirm': 'Delete',
    'app.delete.externalSuccess': 'Removed from library',
    'app.delete.nativeSuccess': 'Project deleted',
    'app.delete.error': 'Project deletion failed',
    'app.canvas.loading': 'Loading generation canvas',
    'app.canvas.loadingLabel': 'Loading generation canvas',
    'language.switcher.aria': 'Switch interface language',
    'language.switcher.leading': 'Language',
    'language.zh': '中文',
    'language.en': 'English',
    'language.ru': 'Русский',
    'library.updated.justNow': 'Just now',
    'library.updated.minutesAgo': '{{count}} min ago',
    'library.updated.hoursAgo': '{{count}} hr ago',
    'library.updated.daysAgo': '{{count}} days ago',
    'library.actions.replaySplash': 'See what Nomi can do',
    'library.actions.modelCatalog': 'Model setup',
    'library.actions.openBrowser': 'Browser',
    'library.actions.openAssetBox': 'Asset box',
    'library.actions.assetBoxTitle': 'Asset box',
    'library.actions.assetCount': '{{count}} assets',
    'library.title': 'Project Library',
    'library.startAria': 'Start a project',
    'library.newBlank.title': 'New blank project',
    'library.newBlank.description': 'Start from a line of text or an idea',
    'library.openFolder.title': 'Open existing folder',
    'library.openFolder.description': 'Turn a media folder into a project',
    'library.journey.title.first': 'Watch Nomi make a video',
    'library.journey.title.replay': 'Replay the guide',
    'library.journey.description': '60-second preview, from one sentence to a finished cut',
    'library.modelStatus.aria': 'Model status',
    'library.modelStatus.title': 'No text model connected',
    'library.modelStatus.description': 'Stories and shot breakdowns need a text model. Image and video models can wait until generation.',
    'library.modelStatus.button': 'Connect text model',
    'library.recent': 'Recent projects',
    'library.filter.aria': 'Filter project source',
    'library.filter.all': 'All',
    'library.filter.native': 'Local',
    'library.filter.folder': 'External folders',
    'library.search.placeholder': 'Search projects',
    'library.empty.noMatch': 'No projects match "{{query}}"',
    'library.empty.noCategory': 'No projects in this category yet',
    'library.empty.clearSearch': 'Clear search',
    'library.project.deleteAria': 'Delete project {{name}}',
    'library.project.deleteTitle': 'Delete project',
    'library.project.folderUnavailable': 'Folder unavailable',
    'library.project.continue': 'Continue creating',
    'library.project.revealAria': 'Open project folder {{name}}',
    'library.project.revealTitle': 'Show project folder in Finder',
    'theme.light': 'Switch to light mode',
    'theme.dark': 'Switch to dark mode',
    'theme.appearance': 'Appearance',
    'theme.lightMode': 'Light mode',
    'theme.darkMode': 'Dark mode',
    'window.controls': 'Window controls',
    'window.minimize': 'Minimize',
    'window.maximize': 'Maximize',
    'window.restore': 'Restore',
    'window.close': 'Close',
    'about.dialog.aria': 'About Nomi',
    'about.currentVersion': 'Current version {{version}}',
    'about.handbook.title': 'Getting started handbook',
    'about.handbook.subtitle': 'Pipeline · 90-second win · Capabilities · Checklist',
    'about.update.desktopOnly': 'The desktop app supports update checks and one-click upgrades.',
    'about.update.checking': 'Checking...',
    'about.update.upToDate': 'You are on the latest version',
    'about.update.available': 'New version available: {{version}}',
    'about.update.later': 'Later',
    'about.update.download': 'Download update',
    'about.update.openDownload': 'Open download',
    'about.update.manualMac': 'On macOS, download the package manually and replace the old app. This unsigned build cannot auto-update in place yet.',
    'about.update.downloading': 'Downloading update...',
    'about.update.background': 'Downloading in the background · {{percent}}%',
    'about.update.downloaded': 'Download complete',
    'about.update.install': 'Restart and install',
    'about.update.error': 'Update error',
    'about.update.retry': 'Retry',
    'about.update.idle': 'Check whether a new version is available',
    'about.update.check': 'Check for updates',
    'errorBoundary.title': 'Something went wrong',
    'errorBoundary.message': 'The interface hit an error. Reload to continue, or copy the error details and send them to us.',
    'errorBoundary.reload': 'Reload',
    'errorBoundary.copy': 'Copy error details',
    'chunk.loadFailed': '{{label}} failed to load',
    'chunk.networkRecovering': 'A network interruption stopped loading. Trying to recover.',
    'chunk.otherFeaturesOk': 'Other features are not affected. Reload to try again.',
    'chunk.reload': 'Reload',
    'splash.aria': 'Nomi intro',
    'splash.skip': 'Skip ›',
    'splash.caption.start': 'Start with one sentence',
    'splash.caption.canvas': 'In seconds, it becomes a storyboard canvas',
    'splash.caption.control': 'Every frame stays under your direction',
    'splash.caption.timeline': 'Arrange it on the timeline and export a cut',
    'splash.caption.brand': '',
    'splash.creation.prompt': 'Turn one sentence into...',
    'splash.node.opening': 'Shot 1 · Opening',
    'splash.node.closeup': 'Shot 2 · Close-up',
    'splash.node.ending': 'Shot 3 · Ending',
    'splash.timeline.video': 'Video',
    'splash.timeline.audio': 'Audio',
    'splash.brand.slogan': 'AI drafts. You direct.',
    'studio.appbar.aria': 'Nomi workbench',
    'studio.appbar.about': 'About Nomi · Check for updates',
    'studio.appbar.breadcrumb': 'Location',
    'studio.appbar.backToLibrary': 'Back to project library',
    'studio.appbar.projectName': 'Project name',
    'studio.appbar.globalActions': 'Global actions',
    'studio.appbar.openBrowser': 'Open browser',
    'studio.appbar.browser': 'Browser',
    'studio.appbar.openAssetBox': 'Open asset box',
    'studio.appbar.assetBox': 'Asset box',
    'studio.appbar.assetCount': '{{count}} assets',
    'studio.appbar.openModelSetup': 'Open model setup',
    'studio.appbar.modelSetup': 'Model setup',
    'studio.appbar.export': 'Export',
    'studio.appbar.exportMp4': 'Export MP4',
    'studio.appbar.goPreviewExport': 'Go to preview export',
    'studio.windowbar.aria': 'Window title bar',
    'studio.windowbar.quickActions': 'Project quick actions',
    'studio.workspace.creation': 'Creation',
    'studio.workspace.generation': 'Generation',
    'studio.workspace.preview': 'Preview',
    'studio.workspace.loading': 'Loading {{label}}',
    'studio.stepper.aria': 'Switch workspace',
    'studio.stepper.creation': 'Create',
    'studio.stepper.generation': 'Generate',
    'studio.stepper.preview': 'Preview',
    'generation.timeline.chunk': 'Generation timeline',
    'generation.aria': 'Generation workspace',
    'generation.expandTimeline': 'Expand generation timeline',
    'generation.timeline': 'Timeline',
    'generation.clipCount': '{{count}} clips',
    'generation.aiSidebar': 'Generation AI sidebar',
    'generation.resizeAssistant': 'Drag to resize assistant',
    'preview.aria': 'Preview workspace',
    'preview.timeline.region': 'Preview timeline',
    'preview.timeline.actionPrefix': 'Preview timeline - ',
    'preview.player.aria': 'Preview player',
    'preview.placeholder.title': 'Video preview',
    'preview.placeholder.description': 'Drag media from Generation to see it here',
    'preview.videoPlayFailed': 'Video playback failed: {{message}}',
    'preview.videoLoadFailed': 'Video failed to load: {{message}}',
    'preview.controls.aria': 'Preview controls',
    'preview.play': 'Play',
    'preview.pause': 'Pause',
    'preview.timelineEmpty': 'Timeline is empty',
    'preview.previousFrame': 'Previous frame',
    'preview.previousFrameTitle': 'Previous frame (←)',
    'preview.nextFrame': 'Next frame',
    'preview.nextFrameTitle': 'Next frame (→)',
    'preview.mute': 'Mute',
    'preview.unmute': 'Unmute',
    'preview.volume': 'Volume',
    'preview.fullscreen': 'Fullscreen',
    'preview.exitFullscreen': 'Exit fullscreen',
    'preview.fullscreenTitle': 'Fullscreen preview',
    'preview.aspectRatio': 'Preview aspect ratio',
    'preview.aspectRatioLeading': 'Aspect',
    'preview.fitMode': 'Media fit',
    'preview.fitLeading': 'Fit',
    'preview.fitContain': 'Contain',
    'preview.fitCover': 'Cover',
    'preview.framing': 'Preview framing',
    'preview.zoomOut': 'Zoom out',
    'preview.zoomCurrent': 'Current zoom',
    'preview.zoomReset': 'Reset framing',
    'preview.zoomIn': 'Zoom in',
    'preview.addText.aria': 'Add text',
    'preview.addText.title': 'Add captions or title cards. Text can be moved and resized freely.',
    'preview.text': 'Text',
    'preview.caption': 'Caption',
    'preview.captionHint': 'Bottom · small',
    'preview.titleCard': 'Title card',
    'preview.titleCardHint': 'Centered · large',
    'preview.textDragTitle': 'Drag to move · resize corners · double-click to edit',
    'preview.textSelectTitle': 'Select · double-click to edit',
    'preview.export.preparing': 'Preparing...',
    'preview.export.converting': 'Transcoding MP4...',
    'preview.export.recording': 'Exporting {{percent}}%',
    'preview.export.cancel': 'Cancel export',
    'preview.export.cancelDisabled': 'Preparing, cannot cancel yet',
    'preview.export.mp4': 'Export MP4',
    'preview.export.success': 'Exported to project exports folder: {{path}}',
    'preview.export.error': 'Export failed',
    'preview.export.title.empty': 'Timeline is empty. Add media first.',
    'preview.export.title.converting': 'Transcoding MP4',
    'preview.export.title.recording': 'Exporting {{percent}}%',
    'preview.export.title.ready': 'Export MP4: 1080p · {{aspectRatio}} · standard publishing · saved to the project exports folder',
    'preview.textStyle.aria': 'Text style',
    'preview.textStyle.fontSize': 'Size',
    'preview.textStyle.decrease': 'Decrease text size',
    'preview.textStyle.increase': 'Increase text size',
    'preview.textStyle.percent': 'Text size percent',
    'preview.textStyle.font': 'Font',
    'timeline.selectedActions': 'Selected clip actions',
    'timeline.regenerateShot': 'Regenerate this shot',
    'timeline.regenerateShotTitle': 'Regenerate this shot in place. Edit prompt or parameters on the canvas node.',
    'timeline.nudgeEarlier': 'Nudge clip earlier',
    'timeline.copyClip': 'Copy clip',
    'timeline.nudgeLater': 'Nudge clip later',
    'timeline.aiArrange': 'AI arrange',
    'timeline.aiArrangeTitle': 'AI arrange: place generated shots on the timeline in shot order, skipping clips already present.',
    'timeline.aiArrange.success': 'Placed {{count}} shots on the timeline in shot order',
    'timeline.aiArrange.empty': 'Generation has no shots yet. Generate a few shots first, then arrange.',
    'timeline.aiArrange.already': 'All shots are already on the timeline',
    'timeline.splitExit': 'Exit split mode',
    'timeline.splitEnter': 'Split mode',
    'timeline.splitExitTitle': 'Split mode is on: click a clip to split at the cursor · Esc exits',
    'timeline.splitEnterTitle': 'Scissors: click a clip to split it at that point',
    'timeline.redo': 'Redo timeline edit',
    'timeline.redoTitle': 'Redo (⇧⌘Z)',
    'timeline.undo': 'Undo timeline edit',
    'timeline.undoTitle': 'Undo (⌘Z)',
    'timeline.zoomOut': '{{prefix}}zoom out timeline',
    'timeline.zoomReset': 'Reset zoom',
    'timeline.zoomIn': '{{prefix}}zoom in timeline',
    'timeline.deleteSelected': '{{prefix}}delete selected clips',
    'timeline.collapse': '{{prefix}}collapse timeline',
    'timeline.ruler': 'Time ruler',
    'timeline.dragPlayhead': 'Drag playhead',
    'timeline.textTrack': 'Text track',
    'timeline.textEmpty': 'Use Caption / Title card above to add text',
    'timeline.emptyText': '(empty)',
    'timeline.caption': 'Caption',
    'timeline.titleCard': 'Title card',
    'timeline.resizeLeft': 'Adjust duration left',
    'timeline.resizeRight': 'Adjust duration right',
    'timeline.emptyAudio': 'Drag audio from the asset library to add music',
    'timeline.emptyMedia': 'Drag media from Generation',
    'timeline.dropAudioReject': 'Only audio assets can be placed on the audio track',
    'timeline.dropPlace': 'Place at {{timecode}}',
    'timeline.overlayLayer': 'Overlay layer',
    'timeline.addCaption': 'Add caption',
    'timeline.audioDrop': 'Drag audio here as music',
    'timeline.trimStart': 'Adjust clip start',
    'timeline.trimEnd': 'Adjust clip end',
    'mediaType.image': 'Image',
    'mediaType.video': 'Video',
    'asset.kind.all': 'All',
    'asset.kind.none': 'No category',
    'asset.kind.image': 'Image',
    'asset.kind.video': 'Video',
    'asset.kind.audio': 'Audio',
    'assetPicker.limitReached': 'This media type is at its limit',
    'assetPicker.search': 'Search asset names',
    'assetPicker.canvas': 'Canvas',
    'assetPicker.projectRecent': 'Project assets · recent',
    'assetPicker.browseAll': 'Browse all →',
    'assetPicker.loading': 'Loading assets',
    'assetPicker.noMatch': 'No matching assets',
    'assetPicker.empty': 'No assets yet. Upload or drop files to start.',
    'assetPicker.uploadingLabel': 'Uploading',
    'assetPicker.uploading': 'Uploading...',
    'assetPicker.uploadLocal': 'Upload local file',
    'assetPicker.footer': 'Drop files here · drag a wire from a card · drag from the asset panel to a node',
    'assetLibrary.source.aria': 'Asset source filter',
    'assetLibrary.source.all': 'All assets',
    'assetLibrary.source.project': 'Project assets',
    'assetLibrary.title': 'Asset library',
    'assetLibrary.close': 'Close asset library',
    'assetLibrary.dialog.aria': 'Asset library',
    'assetLibrary.upload': 'Upload',
    'assetLibrary.uploadAria': 'Upload assets',
    'assetLibrary.webCapture': 'Web capture',
    'assetLibrary.webCaptureTitle': 'Open the browser for references: hover images to capture them, or drag them in.',
    'assetLibrary.filePicker': 'Asset file picker',
    'assetLibrary.search': 'Search assets...',
    'assetLibrary.categoryFilter': 'Filter asset category',
    'assetLibrary.categoryDialog': 'Asset category filter',
    'assetLibrary.categoryList': 'Asset categories',
    'assetLibrary.categoryTitle': 'Category: {{label}}',
    'assetLibrary.deleteSelectedAria': 'Delete {{count}} project assets',
    'assetLibrary.deleteSelectedTitle': 'Delete {{count}} project assets',
    'assetLibrary.deleteDisabledTitle': 'Select project assets first',
    'assetLibrary.dragMultiple': '{{count}} assets',
    'assetLibrary.dragToTimelineAudio': 'Drag to the timeline audio track',
    'assetLibrary.dragToCanvas': 'Drag to canvas',
    'assetLibrary.selectableProjectAsset': 'Current project canvas asset. Select it to delete.',
    'assetLibrary.mediaImport.success': 'Imported {{count}} assets',
    'assetLibrary.audioImport.success': 'Imported {{count}} audio files',
    'assetLibrary.importSkipped.tooLarge': '{{count}} too large',
    'assetLibrary.importSkipped.overLimit': '{{count}} over the per-import limit',
    'assetLibrary.importSkipped.duplicate': '{{count}} duplicates',
    'assetLibrary.importSkipped.failed': '{{count}} failed',
    'assetLibrary.importSkipped.summary': 'Skipped: {{items}}',
    'assetLibrary.import.mediaFailed': 'Asset import failed. Try again.',
    'assetLibrary.import.audioFailed': 'Audio import failed. Try again.',
    'assetLibrary.import.unsupportedSkipped': 'Skipped {{count}} unsupported files',
    'assetLibrary.delete.noProject': 'Delete failed: no project is open',
    'assetLibrary.delete.selectFirst': 'Select the project assets to delete first',
    'assetLibrary.delete.notDeletable': 'The selected assets cannot be deleted yet',
    'assetLibrary.delete.confirmTitle': 'Delete {{count}} project assets?',
    'assetLibrary.delete.confirmMessage': 'Matching canvas nodes and saved files in All assets will be deleted together. Project files will be moved to the system trash.',
    'assetLibrary.delete.confirm': 'Delete',
    'assetLibrary.delete.unsupported': 'This runtime cannot delete project assets',
    'assetLibrary.delete.projectSuccess': 'Deleted {{count}} project assets',
    'assetLibrary.delete.fileSuccess': 'Deleted {{count}} saved assets',
    'assetLibrary.delete.fileFailed': '{{count}} saved assets failed to delete',
    'assetLibrary.delete.failed': 'Project asset deletion failed. Check file permissions.',
    'assetLibrary.empty.project': 'No project assets yet',
    'assetLibrary.empty.all': 'No assets yet',
    'assetLibrary.empty.noMatch': 'No matching assets',
    'assetLibrary.empty.description': 'Upload images, videos, or audio, or generate media and it will appear here automatically.',
    'assetLibrary.empty.noMatchDescription': 'Try a different filter or search term.',
    'assetMention.empty': 'Add a reference image first',
    'assetMention.choose': 'Choose image',
    'assetMention.insertReference': 'Insert reference {{index}}',
    'projectExplorer.aria': 'Project explorer',
    'projectExplorer.nav': 'Project sidebar navigation',
    'projectExplorer.findAssets': 'Find assets',
    'projectExplorer.categories': 'Categories',
    'projectExplorer.promptLibrary': 'Prompt library',
    'projectExplorer.promptRail': 'Prompts',
    'projectExplorer.skillLibrary': 'Skill library',
    'projectExplorer.skillRail': 'Skills',
    'projectExplorer.assetLibrary': 'Asset library',
    'projectExplorer.expandSidebar': 'Expand sidebar',
    'projectExplorer.collapseSidebar': 'Collapse sidebar',
    'projectExplorer.webCapture': 'Web capture',
    'projectExplorer.webCaptureTitle': 'Open the browser for references: hover images to capture them, or drag them in.',
    'projectExplorer.newCategory': 'New category',
    'categoryTree.builtin.shots': 'Shots',
    'categoryTree.builtin.cast': 'Cast',
    'categoryTree.builtin.scene': 'Scenes',
    'categoryTree.builtin.prop': 'Props',
    'categoryTree.builtin.audio': 'Audio',
    'categoryTree.customDefault': 'New category',
    'categoryTree.copiedTo': 'Copied to {{target}}',
    'categoryTree.deleteCategory.title': 'Delete category',
    'categoryTree.deleteCategory.message': 'Delete "{{label}}"? Its nodes will move back to "{{fallback}}" and will not be lost.',
    'categoryTree.deleteNode.title': 'Delete node',
    'categoryTree.deleteNode.message': 'Delete "{{label}}"? Copies in other categories are not affected.',
    'categoryTree.deleteGroup.title': 'Delete group',
    'categoryTree.deleteGroup.message': 'Delete "{{name}}" and its {{count}} nodes?',
    'categoryTree.confirmDelete': 'Delete',
    'categoryTree.nodeName': 'Node name',
    'categoryTree.groupColor': 'Group color',
    'categoryTree.groupColorMessage': 'Enter a CSS color value',
    'categoryTree.menu.newGroup': 'New group',
    'categoryTree.menu.rename': 'Rename',
    'categoryTree.menu.deleteCategory': 'Delete category',
    'categoryTree.menu.copy': 'Copy',
    'categoryTree.menu.regenerateDerived': 'Regenerate derived',
    'categoryTree.menu.delete': 'Delete',
    'categoryTree.menu.changeColor': 'Change color',
    'categoryTree.menu.ungroup': 'Ungroup (keep nodes)',
    'categoryTree.menu.deleteWithNodes': 'Delete with nodes',
    'categoryTree.emptyNodes': 'No nodes yet',
    'categoryItem.nameAria': 'Category name',
    'groupItem.nameAria': 'Group name',
    'groupItem.empty': 'Empty group',
    'nodeItem.derived': 'Derived from another node',
    'nodeItem.kind.text': 'T',
    'nodeItem.kind.character': 'C',
    'nodeItem.kind.scene': 'S',
    'nodeItem.kind.image': 'I',
    'nodeItem.kind.keyframe': 'K',
    'nodeItem.kind.video': 'V',
    'nodeItem.kind.shot': 'Sh',
    'nodeItem.kind.output': 'O',
    'nodeItem.kind.panorama': 'P',
    'nodeItem.kind.default': 'N',
    'assetFinder.unstar': 'Remove mark',
    'assetFinder.markMain': 'Mark as main shot',
    'assetFinder.mainMark': 'Main shot',
    'assetFinder.zone.film': 'Film',
    'assetFinder.zone.reference': 'Reference',
    'assetFinder.search': 'Search assets...',
    'assetFinder.starOnly': 'Marked only',
    'assetFinder.aiGroupTitle': 'Read prompts for ungrouped shots and let AI organize them into named groups.',
    'assetFinder.aiGrouping': 'AI is grouping...',
    'assetFinder.aiGroup': 'Use AI to organize {{count}} ungrouped shots',
    'assetFinder.aiGroupSuccess': 'Grouped {{count}} shots into {{groups}} groups',
    'assetFinder.aiGroupNone': 'No confident grouping found. Items stayed ungrouped.',
    'assetFinder.aiGroupFailed': 'AI grouping failed',
    'assetFinder.textModelRequired': 'Enable a text model in Model setup first',
    'assetFinder.empty.noFilm': 'No film shots yet',
    'assetFinder.empty.noReference': 'No references yet',
    'assetFinder.empty.noMatch': 'No matching assets',
    'assetFinder.empty.filterHint': 'Try another search or clear the marked filter.',
    'assetFinder.empty.filmHint': 'Generated shots will appear here automatically.',
    'assetFinder.empty.referenceHint': 'Imported images and dropped references will appear here.',
    'assetFinder.ungrouped': 'Ungrouped',
    'workspaceFiles.title': 'Assets',
    'workspaceFiles.listView': 'List view',
    'workspaceFiles.sort': 'Sort assets',
    'workspaceFiles.sortAscending': 'Ascending',
    'workspaceFiles.sortDescending': 'Descending',
    'workspaceFiles.refresh': 'Refresh project files',
    'workspaceFiles.import': 'Import assets',
    'workspaceFiles.importTitle': 'Copy local files into the project asset folder',
    'workspaceFiles.importing': 'Importing',
    'workspaceFiles.mediaTypes': 'Images, video, audio',
    'workspaceFiles.noProject': 'Open a project to show files',
    'workspaceFiles.loading': 'Reading project files...',
    'workspaceFiles.empty.title': 'No files yet',
    'workspaceFiles.empty.description': 'Use Import assets above, or drag files here.',
    'workspaceFiles.truncated': 'Many files found. Showing the first 500.',
    'workspaceFiles.readError': 'Could not read the project folder. Check permissions or reopen the folder.',
    'filePreview.aria': 'Preview {{name}}',
    'filePreview.reveal': 'Open in Finder',
    'filePreview.close': 'Close',
    'filePreview.unsupported': 'Preview is not supported for this format yet',
    'filePreview.unsupportedHint': 'Use "Open in Finder" above to view it.',
    'filePreview.loading': 'Loading...',
    'filePreview.readFailed': 'Read failed: {{message}}',
    'activeSkill.title': 'Current skill · click to switch',
    'activeSkill.choose': 'Choose creation skill',
    'activeSkill.auto': 'Auto',
    'activeSkill.followMode': 'Follows creation mode ({{label}})',
    'activeSkill.playbookStages': 'playbook · {{count}} stages',
    'activeSkill.missingProviders': 'Missing {{providers}} models. Generation may get stuck.',
    'activeSkill.connect': 'Connect',
    'activeSkill.authorName': 'AI skill writer',
    'activeSkill.authorTitle': 'Let AI write a skill',
    'activeSkill.authorDescription': 'Paste another tool’s skill, describe what you need, or attach docs. AI will rewrite it for Nomi.',
    'provider.text': 'Text',
    'provider.image': 'Image',
    'provider.video': 'Video',
    'richText.bold': 'Bold',
    'richText.italic': 'Italic',
    'richText.h1': 'Heading 1',
    'richText.h2': 'Heading 2',
    'richText.bulletList': 'Bullet list',
    'richText.orderedList': 'Numbered list',
    'richText.blockquote': 'Quote',
    'richText.undo': 'Undo',
    'richText.redo': 'Redo',
    'workbenchEditor.placeholder': 'Start writing your story, script, or copy here... Select text and use the side action to generate image or video nodes.',
    'workbenchEditor.toolbar': 'Text toolbar',
    'workbenchEditor.aria': 'Creation document editor',
    'textDocument.placeholder': 'Write text here...',
    'textDocument.toolbar': 'Text formatting',
    'textDocument.drag': 'Drag text node',
    'textDocument.label': 'Text',
    'attachment.remove': 'Remove attachment',
    'attachment.uploadFailed': 'Upload failed',
    'attachment.rail': 'Added attachments',
    'attachment.file': 'File',
    'staleConversation.divider': 'AI no longer remembers the conversation above',
    'canvas.navigation': 'Canvas navigation',
    'canvas.zoom': 'Canvas zoom',
    'canvas.fitView': 'Fit view',
    'canvas.empty': 'Canvas is empty',
    'canvas.resetView': 'Reset view',
    'canvas.zoomPercent': 'Zoom percent',
    'canvas.tidy': 'Tidy canvas',
    'canvas.tidyTitle': 'Tidy canvas: collect scattered nodes in one click · undo with ⌘Z',
    'canvas.hideMinimap': 'Hide minimap',
    'canvas.showMinimap': 'Show minimap',
    'canvas.minimapMinimum': 'Minimap appears after {{count}} nodes',
    'canvas.empty.title': 'No {{name}} yet',
    'canvas.empty.description': 'Add the first node to start creating. Later you can drag, group, and copy across categories.',
    'canvas.empty.createAria': 'Create a {{name}} node',
    'canvas.empty.create': '+ New {{name}}',
    'canvas.category.shots': 'shots',
    'canvas.category.cast': 'characters',
    'canvas.category.scene': 'scenes',
    'canvas.category.prop': 'props',
    'canvas.category.audio': 'audio',
    'canvas.category.node': 'node',
    'canvas.gesture.aria': 'Canvas gesture hint',
    'canvas.gesture.panKeys': 'Two-finger drag',
    'canvas.gesture.pan': 'Pan',
    'canvas.gesture.zoomKeys': '⌘ + wheel',
    'canvas.gesture.zoom': 'Zoom',
    'canvas.gesture.selectKeys': 'Drag empty area',
    'canvas.gesture.select': 'Select',
    'canvas.gesture.dismiss': 'Got it, close gesture hint',
    'canvas.selection.aria': 'Selection actions',
    'canvas.selection.count': '{{count}} selected',
    'canvas.selection.generateTitle': 'Generate selected nodes. References run first, shots run after; missing references will be reported.',
    'canvas.selection.generate': 'Generate {{count}}',
    'canvas.selection.ungroup': 'Ungroup (⇧⌘G)',
    'canvas.selection.group': 'Create group (⌘G)',
    'canvas.selection.clear': 'Clear selection',
    'canvas.focusNodeMissing': 'Source node no longer exists',
    'canvas.import.none': 'No assets can be imported to the canvas',
    'canvas.import.one': 'Imported to canvas',
    'canvas.import.many': 'Imported {{count}} assets to canvas',
    'inlineParams.configureModel': 'Configure models',
    'inlineParams.openModelSetup': 'Open model setup',
    'inlineParams.configure': 'Configure →',
    'inlineParams.booleanOn': 'On',
    'inlineParams.booleanOff': 'Off',
    'inlineParams.model': 'Model',
    'inlineParams.selectModel': 'Select model',
    'inlineParams.variant': 'Variant',
    'inlineParams.more': 'More',
    'inlineParams.provider': 'Provider',
    'modeBar.generationMode': 'Generation mode',
    'nodeComposer.promptPicker.aria': 'Asset-box prompts',
    'nodeComposer.promptPicker.empty': 'No available prompts in the asset box',
    'nodeComposer.promptPicker.open': 'Open asset-box prompts',
    'nodeComposer.promptPicker.title': 'Asset-box prompts',
    'nodeComposer.promptPicker.button': 'Prompts',
    'nodeComposer.textMode.aria': 'Generation mode',
    'nodeComposer.textMode.append': 'Continue',
    'nodeComposer.textMode.rewrite': 'Rewrite',
    'nodeComposer.textMode.replace': 'Replace',
    'nodeComposer.textMode.appendPlaceholder': 'Continue instructions... (leave empty to continue directly)',
    'nodeComposer.textMode.rewritePlaceholder': 'Rewrite instructions... (select text in the body first)',
    'nodeComposer.textMode.replacePlaceholder': 'Replace instructions... (replaces the whole document)',
    'nodeComposer.disabled.videoNeedsReference': 'Add reference media first: drop, connect, or press +',
    'nodeComposer.disabled.videoNeedsFirstFrame': 'Connect an image node as the first frame first',
    'nodeComposer.disabled.imageNeedsReference': 'Image-to-image needs a reference: drop, connect, or press +, or switch back to text-to-image',
    'nodeComposer.disabled.imageNeedsReferenceDetailed': 'Image-to-image needs a reference image. Connect an image node, add a reference, or switch back to text-to-image.',
    'nodeComposer.disabled.unsupported': '"{{kind}}" nodes do not support direct generation yet',
    'nodeComposer.generating': 'Generating...',
    'nodeComposer.generateReferencesFirst': 'Generate references first, then this shot',
    'nodeComposer.regenerate': 'Regenerate',
    'nodeComposer.generate': 'Generate',
    'nodeComposer.generateAsset': 'Generate asset',
    'nodeComposer.uploadingLabel': 'Uploading',
    'nodeComposer.uploading': 'Uploading...',
    'nodeComposer.dropReference': 'Release to add as reference',
    'nodeRecoverable.aria': 'Task may have finished upstream and can be recovered',
    'nodeRecoverable.title': 'Task may have finished upstream',
    'nodeRecoverable.description': 'The wait timed out, but the provider may still have produced a result. Pull it back directly here; no provider dashboard needed.',
    'nodeRecoverable.recover': 'Recover result',
    'nodeRecoverable.recovering': 'Recovering...',
    'nodeRecoverable.markFailed': 'Mark as failed',
    'aiHeader.conversationHistory': 'Conversation history',
    'assistantModel.aria': 'Assistant model',
    'assistantModel.title': 'Model used by the assistant. GPT, Claude, or DeepSeek-style models are recommended for reliable canvas actions.',
    'assetTile.addReference': 'Add reference',
    'resultDownload.defaultVideoName': 'Video',
    'resultDownload.defaultImageName': 'Image',
    'resultDownload.success': 'Saved locally',
    'resultDownload.failed': 'Download failed',
    'imageTransform.rotateLeft': 'Rotate left 90°',
    'imageTransform.rotateRight': 'Rotate right 90°',
    'imageTransform.flipHorizontal': 'Flip horizontal',
    'imageTransform.flipVertical': 'Flip vertical',
    'imageEdit.aria': 'Image actions',
    'imageEdit.makeup': 'Look lock',
    'imageEdit.makeupTitle': 'Look lock: create a new node with a prefilled character or scene identity prompt from this image. It will not auto-generate.',
    'imageEdit.aiEdit': 'AI edit',
    'imageEdit.decomposing': 'Decomposing',
    'imageEdit.decomposeLayers': 'Decompose elements into editable layers',
    'imageEdit.textEdit': 'Edit text while preserving typography',
    'imageEdit.crop': 'Crop',
    'imageEdit.cropTitle': 'Crop with a draggable frame, add to the stack, and set as the main image',
    'imageEdit.removingBackground': 'Removing',
    'imageEdit.removeBackground': 'Remove BG',
    'imageEdit.removeBackgroundTitle': 'Remove the background, add to the stack, and set as the main image',
    'imageEdit.gridSplit': 'Split',
    'imageEdit.grid2': 'Four views (2x2)',
    'imageEdit.grid3': 'Nine grid (3x3)',
    'imageEdit.transform': 'Transform',
    'imageEdit.whiteboard': 'Board',
    'imageEdit.whiteboardTitle': 'Edit in the board and import the current image automatically',
    'imageEdit.download': 'Download',
    'imageEdit.downloadTitle': 'Download / save locally',
    'imageEdit.defaultImage': 'Image',
    'imageEdit.decomposedElements': 'Decomposed elements',
    'imageEdit.progress.decode': 'Reading image',
    'imageEdit.progress.inference': 'Finding subject',
    'imageEdit.progress.mask': 'Building transparent mask',
    'imageEdit.progress.encode': 'Exporting transparent PNG',
    'imageEdit.progress.model': 'Loading cutout model',
    'imageEdit.progress.removing': 'Removing background',
    'imageEdit.removeBackgroundFailed': 'Background removal failed. Check the network connection and try again.',
    'assistantMessage.processing': 'Processing',
    'assistantMessage.stopped': 'Stopped',
    'conversation.new': 'New conversation',
    'conversation.savedToHistory': 'Current chat will be saved',
    'conversation.delete': 'Delete this conversation',
    'conversation.justNow': 'Just now',
    'conversation.minutesAgo': '{{count}} min ago',
    'conversation.hoursAgo': '{{count}} hr ago',
    'conversation.yesterday': 'Yesterday',
    'resultToolbar.aria': 'Result actions',
    'videoToolbar.aria': 'Video actions',
    'videoToolbar.extracting': 'Extracting...',
    'videoToolbar.extractFirst': 'First frame',
    'videoToolbar.extractFirstTitle': 'Extract the first frame into a standalone image node for first-frame or reference use',
    'videoToolbar.extractLast': 'Last frame',
    'videoToolbar.extractLastTitle': 'Extract the last frame into a standalone image node for last-frame, relay, or reference use',
    'node.toast.generateBeforeTimeline': 'Generate this node first, then add it to the timeline.',
    'node.connection.to': 'Connect to this node',
    'node.connection.from': 'Start a connection from this node',
    'node.panoramaActions': 'Panorama actions',
    'node.panoramaPreview': 'Panorama preview',
    'node.panoramaReupload': 'Re-upload',
    'node.independentCopy': 'Independent copy',
    'node.sourceMissing': 'Source node no longer exists',
    'node.locateSource': 'Locate source node: {{label}}',
    'node.independentCopyFromCategory': 'Independent copy from {{category}} · {{label}}',
    'node.independentCopyFrom': 'Independent copy from {{label}}',
    'node.independentCopySourceMissing': 'Independent copy; source node no longer exists',
    'node.provenance': 'Generation record / Provenance',
    'canvasToolbar.aria': 'Generation canvas toolbar',
    'canvasToolbar.addMenu': 'Add node menu',
    'canvasToolbar.addNode': 'Add {{label}} node',
    'canvasNodeKind.text': 'Text',
    'canvasNodeKind.image': 'Image',
    'canvasNodeKind.video': 'Video',
    'canvasNodeKind.audio': 'Audio',
    'canvasNodeKind.model3d': '3D model',
    'canvasNodeKind.whiteboard': 'Board',
    'canvasNodeKind.panorama': 'Panorama',
    'canvasNodeKind.scene3d': '3D scene',
    'canvasAssistant.launcher': 'Generation AI launcher',
    'canvasAssistant.suffix': 'Generate',
    'canvasAssistant.panel': 'Generation AI assistant',
    'canvasAssistant.dropTitle': 'Drop here to add attachments',
    'canvasAssistant.dropHint': 'Images / PDF / Word / Excel / txt · 30MB each',
    'canvasAssistant.title': 'Generation assistant',
    'canvasAssistant.collapse': 'Collapse AI',
    'canvasAssistant.sendMessage': 'Message the generation assistant',
    'canvasAssistant.placeholder': 'Tell me how to arrange the canvas...',
    'canvasAssistant.addAttachment': 'Add attachment',
    'canvasAssistant.addAttachmentLong': 'Add attachment (drag / paste also works)',
    'canvasAssistant.modeAria': 'AI mode',
    'canvasAssistant.modeLeading': 'Mode',
    'canvasAssistant.mode.chat': 'Q&A',
    'canvasAssistant.mode.refine': 'Polish',
    'canvasAssistant.stop': 'Stop',
    'canvasAssistant.send': 'Send',
    'canvasAssistant.emptyTitle': 'I can build the canvas with you',
    'canvasAssistant.emptyBody': 'I can lay out shots, improve prompts, and connect nodes. Generate images from the node buttons.',
    'canvasAssistant.suggestion.shots': 'Place 3 shots on the canvas',
    'canvasAssistant.suggestion.prompt': 'Write a prompt for the selected shot',
    'canvasAssistant.suggestion.connect': 'Connect the shots in sequence',
    'canvasAssistant.reject': 'Reject',
    'canvasAssistant.confirm': 'Confirm',
    'assistantError.provider': 'Provider: {{message}}',
    'assistantError.retry': 'Retry',
    'assistantError.modelSetup': 'Open model setup',
    'assistantError.technicalDetails': 'Technical details',
    'noTextModel.readyTitle': 'Text brain is ready',
    'noTextModel.readyBody': 'Model setup now has a Text entry. You can split shots and chat now. Send the message again.',
    'noTextModel.title': 'The creation assistant needs a text brain',
    'noTextModel.bodyBefore': 'You connected image / video generation models for visuals. Shot splitting, chat, and writing need a ',
    'noTextModel.bodyModel': 'text chat model',
    'noTextModel.bodyAfter': ' as the brain.',
    'noTextModel.enable': 'Enable {{name}}',
    'noTextModel.settings': 'Open model setup',
    'spend.agentDriven': 'Driven by the AI assistant (MCP) · confirm spend',
    'spend.autoIgnore': 'Auto-ignore in {{seconds}}s',
    'spend.suppressSession': 'Do not ask again in this session',
    'spend.ignore': 'Ignore',
    'spend.cancel': 'Cancel',
    'spend.confirmGenerate': 'Confirm generation',
    'nodeError.aria': 'Generation failed: {{reason}}',
    'nodeError.provider': 'Provider said: ',
    'nodeError.retry': 'Retry generation',
    'nodeError.copy': 'Copy details',
    'nodeError.copied': 'Copied',
    'nodeError.technicalDetails': 'Technical details',
    'creationAssistant.aria': 'AI creation area',
    'creationAssistant.title': 'Creation assistant',
    'creationAssistant.expand': 'Expand chat',
    'creationAssistant.shrink': 'Shrink',
    'creationAssistant.expandAria': 'Expand creation assistant',
    'creationAssistant.shrinkAria': 'Shrink creation assistant',
    'creationAssistant.collapse': 'Collapse creation assistant',
    'creationAssistant.emptyTitle': 'Need a spark?',
    'creationAssistant.emptyBody': 'Tell AI what you want to write, and it will give you a starting point.',
    'creationAssistant.suggestion.opening': 'Give me an opening',
    'creationAssistant.suggestion.visual': 'Make this more visual',
    'creationAssistant.suggestion.storyboard': 'Turn this into a storyboard script',
    'creationAssistant.emptyContent': '(Empty content)',
    'creationAssistant.reject': 'Reject',
    'creationAssistant.apply': 'Apply',
    'creationAssistant.placeholder': 'Split into shots, make a video, create a character card, or ask anything...',
    'creationAssistant.inputAria': 'Creation AI input',
    'creationAssistant.modeAria': 'Creation mode',
    'creationAssistant.write.insert': 'Insert at cursor',
    'creationAssistant.write.replace': 'Replace selection',
    'creationAssistant.write.append': 'Append to document',
    'creationAssistant.callFailed': 'Creation AI call failed',
    'creationAssistant.defaultStoryboardPrompt': '🎬 Split into shots',
    'creationAssistant.defaultFixationPrompt': '🎭 Create character card',
    'creationAssistant.attachmentPrompt': 'Please review these attachments',
    'creationAssistant.processCurrentDocument': '{{mode}}: process current document',
    'creationAssistant.cancelled': '(Stopped)',
    'creationAssistant.emptyResponse': '(Empty response: AI did not return text)',
    'creationAssistant.truncated': '⚠️ This reply may be unfinished because it reached the model output limit. Say "continue" if needed.',
    'creationAssistant.errorPrefix': '(Error) {{message}}',
    'creationAssistant.needStoryForStoryboard': 'Write a story on the left first, then ask AI to split it into shots.',
    'creationAssistant.needScriptForFixation': 'Write a script on the left first, then ask AI to create character and scene cards.',
    'creationAssistant.attachmentsUploading': 'Attachments are still uploading. Please wait before sending.',
    'creationAssistant.revisingPlan': 'Revising the plan with your request...',
    'creationAssistant.planningStoryboard': 'Splitting the story into shots and preparing a storyboard plan...',
    'creationAssistant.planningStoryboardStream': 'Splitting into shots...',
    'creationAssistant.planUpdated': 'The plan has been updated. See the editor below.',
    'creationAssistant.planReady': 'Storyboard plan is ready below. Open it, edit it, then confirm it onto the canvas.',
    'creationAssistant.storyboardFailed': 'Shot planning failed: {{message}}',
    'creationAssistant.unknownError': 'Unknown error',
    'creationAssistant.fixationPlanning': 'Switched to the generation area. AI is creating character and scene cards from the script.',
    'cardCommon.cutout': 'Removing background',
    'cardCommon.cutoutNode': 'Cutout node',
    'cardCommon.cutoutProgress': '{{title}} is generating a transparent PNG',
    'cardCommon.generating': 'Generating',
    'cardCommon.upload': '+ Upload {{label}}',
    'cardCommon.node': 'Node',
    'editableTitle.edit': 'Click to edit name',
    'card.characterImage': 'Character image',
    'card.sceneImage': 'Scene image',
    'card.propImage': 'Prop image',
    'card.unnamedCharacter': 'Unnamed character',
    'card.unnamedScene': 'Unnamed scene',
    'card.unnamedProp': 'Unnamed prop',
    'card.ownerPrefix': 'Belongs to {{name}}',
    'imageCrop.cancel': 'Cancel',
    'imageCrop.confirmCrop': 'Confirm crop',
    'imageCrop.confirmSplit': 'Confirm split',
    'audio.noSubtitles': 'No content available for subtitles',
    'audio.subtitlesCopied': 'Subtitles copied (SRT, paste as .srt)',
    'audio.copyTranscript': 'Copy transcript',
    'audio.copy': 'Copy',
    'audio.generateSubtitles': 'Generate subtitles',
    'audio.play': 'Play',
    'audio.pause': 'Pause',
    'audio.upload': 'Upload audio',
    'audio.sound': 'Sound',
    'audio.uploadOrConnect': 'Upload or connect audio',
    'storyboard.action.storyboardLead': 'Looks like you want to break the story into shots.',
    'storyboard.action.storyboardCta': 'Break into shots · place on canvas',
    'storyboard.action.fixationLead': 'Looks like you want to create a character card.',
    'storyboard.action.fixationCta': 'Create character card',
    'storyboard.action.modeAria': 'Storyboard type',
    'storyboard.action.imageMode': 'Image storyboard',
    'storyboard.action.videoMode': 'Video storyboard',
    'storyboard.action.imageHint': 'One still image per shot; convert to video when it feels right',
    'storyboard.action.videoHint': 'One timed video clip per shot',
    'storyboard.action.started': 'Started',
    'storyboard.plan.defaultTitle': 'Storyboard plan',
    'storyboard.plan.meta': '{{shots}} shots · {{anchors}} reference anchors · {{tail}}',
    'storyboard.plan.imageMode': 'Image storyboard',
    'storyboard.plan.discardTitle': 'Discard this plan?',
    'storyboard.plan.discardMessage': 'The plan and your edits will be cleared. You can ask AI to break the story into shots again.',
    'storyboard.plan.discardConfirm': 'Discard',
    'storyboard.plan.status.editing': 'Editing',
    'storyboard.plan.status.committed': 'On canvas',
    'storyboard.plan.status.draft': 'Draft',
    'storyboard.plan.editingSummary': 'Editing in the left editor · {{count}} shots',
    'storyboard.plan.collapseCard': 'Collapse card',
    'storyboard.plan.confirmInEditor': 'Confirm in the editor to place it on the canvas',
    'storyboard.plan.committedSummary': '{{count}} shots have been created as canvas nodes',
    'storyboard.plan.editAgain': 'Edit again',
    'storyboard.plan.goGeneration': 'Go to generation',
    'storyboard.plan.emptyPrompt': '(No prompt yet)',
    'storyboard.plan.moreShots': '{{count}} more shots',
    'storyboard.plan.openEdit': 'Open editor',
    'storyboard.plan.discard': 'Discard',
    'storyboard.editor.issue.noShots': 'No shots yet',
    'storyboard.editor.issue.emptyShotPrompt': 'Shot {{index}} has no prompt',
    'storyboard.editor.issue.danglingRef': 'Shot {{index}} has a broken reference',
    'storyboard.editor.issue.anchorNoName': 'An anchor still needs a name',
    'storyboard.editor.landFailedTitle': 'Failed to place on canvas',
    'storyboard.editor.unknownError': 'Unknown error. Try again.',
    'storyboard.editor.titleAria': 'Plan title',
    'storyboard.editor.titlePlaceholder': 'Name this plan',
    'storyboard.editor.shotCount': '{{count}} shots',
    'storyboard.editor.collapse': 'Collapse',
    'storyboard.editor.discardPlan': 'Discard plan',
    'storyboard.editor.noticeLead': 'AI drafted it; edit freely',
    'storyboard.editor.noticeTail': 'No generation and no spend before confirmation',
    'storyboard.editor.anchorsTitle': 'Keep consistent across shots',
    'storyboard.editor.anchorsHint': 'Generate reference image = lock appearance · prompt only = write into each prompt',
    'storyboard.editor.noAnchors': 'No anchors yet. Add one, or write shots directly.',
    'storyboard.editor.addAnchor': 'Add anchor (character / scene / prop / style)',
    'storyboard.editor.shotsTitle': 'Storyboard · {{count}} shots',
    'storyboard.editor.addShot': 'Add shot',
    'storyboard.editor.issuesSummary': '{{count}} issues: {{issue}}',
    'storyboard.editor.readySummary': 'Ready · {{anchors}} anchors · {{shots}} shots',
    'storyboard.editor.landing': 'Placing on canvas...',
    'storyboard.editor.confirmLand': 'Place on canvas',
    'storyboard.shot.durationSeconds': '{{seconds}} sec',
    'storyboard.shot.defaultModel': 'Default model',
    'storyboard.shot.index': 'Shot {{index}}',
    'storyboard.shot.kindAria': 'Shot type',
    'storyboard.shot.kindLeading': 'Type',
    'storyboard.shot.image': 'Image',
    'storyboard.shot.video': 'Video',
    'storyboard.shot.durationAria': 'Duration',
    'storyboard.shot.durationLeading': 'Duration',
    'storyboard.shot.imageModel': 'Image model',
    'storyboard.shot.videoModel': 'Video model',
    'storyboard.shot.modelLeading': 'Model',
    'storyboard.shot.provider': 'Provider',
    'storyboard.shot.delete': 'Delete shot',
    'storyboard.shot.references': 'References',
    'storyboard.shot.unnamed': 'Unnamed',
    'storyboard.shot.removeReference': 'Remove reference {{name}}',
    'storyboard.shot.danglingTitle': 'Reference is broken. Click to remove it.',
    'storyboard.shot.danglingLabel': 'Broken reference',
    'storyboard.shot.danglingWarning': 'Some referenced anchors were deleted. Remove the broken tags or add anchors again above.',
    'storyboard.anchor.kindSwitchAria': 'Type: {{kind}}. Click to switch.',
    'storyboard.anchor.kindSwitchTitle': 'Click to switch type',
    'storyboard.anchor.kind.character': 'Character',
    'storyboard.anchor.kind.scene': 'Scene',
    'storyboard.anchor.kind.prop': 'Prop',
    'storyboard.anchor.kind.style': 'Style',
    'storyboard.anchor.namePlaceholder': 'Name it',
    'storyboard.anchor.nameAria': 'Anchor name',
    'storyboard.anchor.editDescription': 'Edit description',
    'storyboard.anchor.delete': 'Delete anchor',
    'storyboard.anchor.descriptionAria': 'Anchor description',
    'storyboard.anchor.visualPlaceholder': 'Appearance, clothing, light: the reference description for the image model',
    'storyboard.anchor.textPlaceholder': 'Traits that can be described in words, such as palette, brand colors, clothing terms. Added to every shot that references it.',
    'storyboard.anchor.collapse': 'Collapse',
    'storyboard.anchor.carrier.visualTitle': 'Switch to prompt only',
    'storyboard.anchor.carrier.textTitle': 'Switch to generated reference image',
    'storyboard.anchor.carrier.visual': 'Reference image',
    'storyboard.anchor.carrier.text': 'Text',
    'browserAsset.open': 'Open asset box',
    'browserAsset.dialog': 'Asset box',
    'browserAsset.title': 'Asset box',
    'browserAsset.source.aria': 'Asset source',
    'browserAsset.source.my': 'Project assets',
    'browserAsset.source.transcript': 'Prompt library',
    'browserAsset.tab.all': 'All',
    'browserAsset.tab.image': 'Images',
    'browserAsset.tab.video': 'Videos',
    'browserAsset.tab.prompt': 'Prompts',
    'browserAsset.tab.folder': 'Folders',
    'browserAsset.capture.off': 'Turn off resource capture',
    'browserAsset.capture.on': 'Turn on resource capture',
    'browserAsset.capture.offTitle': 'Turn off resource capture',
    'browserAsset.capture.onTitle': 'Resource capture: hover a resource and press Ctrl+C to save',
    'browserAsset.promptSettings': 'Prompt extraction settings',
    'browserAsset.dock.restore': 'Restore floating asset box',
    'browserAsset.dock.right': 'Dock to the right',
    'browserAsset.dock.restoreTitle': 'Restore floating',
    'browserAsset.dock.rightTitle': 'Dock to the right',
    'browserAsset.minimize': 'Minimize asset box',
    'browserAsset.search': 'Search assets',
    'browserAsset.upload': 'Upload asset',
    'browserAsset.newFolder': 'New folder',
    'browserAsset.moreTools': 'More asset tools',
    'browserAsset.toggleLayout': 'Switch asset layout',
    'browserAsset.sort.oldest': 'Oldest first',
    'browserAsset.sort.newest': 'Newest first',
    'browserAsset.filterCategories': 'Filter categories',
    'browserAsset.fileInput': 'Choose asset files',
    'browserAsset.parentFolder': 'Go to parent folder',
    'browserAsset.breadcrumb': 'Folder path',
    'browserAsset.promptMasonry': 'Prompt library masonry',
    'browserAsset.list': 'Asset list',
    'browserAsset.grid': 'Asset grid',
    'browserAsset.dropToSave': 'Release to save to asset box',
    'browserAsset.assetActions': 'Asset actions',
    'browserAsset.importCanvas': 'Import to canvas',
    'browserAsset.delete': 'Delete',
    'browserAsset.blankActions': 'Blank area actions',
    'browserAsset.filter.dialog': 'Asset category filter',
    'browserAsset.filter.show': 'Show',
    'browserAsset.filter.showAll': 'Show all',
    'browserAsset.filter.categoryAria': 'Asset categories',
    'browserAsset.promptCategory.dialog': 'Prompt category filter',
    'browserAsset.promptCategory.title': 'Prompt categories',
    'browserAsset.promptCategory.aria': 'Prompt categories',
    'browserAsset.promptCategory.placeholder': 'Enter category name',
    'browserAsset.promptCategory.confirm': 'Confirm prompt category',
    'browserAsset.promptCategory.add': 'Add category',
    'browserAsset.promptCategory.image': 'Image prompts',
    'browserAsset.promptCategory.video': 'Video prompts',
    'browserAsset.status.downloading': 'Downloading...',
    'browserAsset.status.importUnavailable': 'Cannot import web asset',
    'browserAsset.status.downloadFailed': 'Download failed',
    'browserAsset.status.folder': 'Folder',
    'browserAsset.status.saveFailed': 'Save failed',
    'browserAsset.status.saving': 'Saving...',
    'browserAsset.status.localText': 'Local text',
    'browserAsset.status.localImport': 'Local import',
    'browserAsset.status.extracting': 'Extracting...',
    'browserAsset.status.extractFailed': 'Extraction failed',
    'browserAsset.newFolderTitle': 'New folder',
    'browserAsset.newFolderTitleIndexed': 'New folder {{index}}',
    'browserAsset.unnamedAsset': 'Untitled asset',
    'browserAsset.source.capture': 'Web capture',
    'browserAsset.source.drag': 'Web drag',
    'browserAsset.empty.noMatch.title': 'No matching assets',
    'browserAsset.empty.noMatch.description': 'Try another category or search term.',
    'browserAsset.empty.folder.title': 'This folder is still empty',
    'browserAsset.empty.folder.description': 'Drag assets in, or move selected assets here.',
    'browserAsset.empty.prompt.title': 'No prompts yet',
    'browserAsset.empty.prompt.description': 'Prompts extracted from browser images or screenshots will appear here.',
    'browserAsset.empty.assets.title': 'No assets yet',
    'browserAsset.empty.assets.description': 'Upload local files, or capture images and videos in the browser.',
    'browserAsset.type.folder': 'Folder',
    'browserAsset.type.image': 'Image',
    'browserAsset.type.video': 'Video',
    'browserAsset.type.prompt': 'Prompt',
    'browserPrompt.mode.replicate': 'Image replication',
    'browserPrompt.mode.style': 'Visual style',
    'browserPrompt.detail.aria': 'Prompt details',
    'browserPrompt.detail.title': 'Prompt details',
    'browserPrompt.detail.close': 'Close prompt details',
    'browserPrompt.detail.referenceImages': 'Reference images',
    'browserPrompt.detail.prompt': 'Prompt',
    'browserPrompt.detail.model': 'Model',
    'browserPrompt.detail.currentTextModel': 'Current text model',
    'browserPrompt.detail.copied': 'Copied',
    'browserPrompt.detail.copy': 'Copy',
    'browserPrompt.card.extracting': 'Analyzing the reference image and extracting a prompt...',
    'browserPrompt.card.extractFailed': 'Prompt extraction failed',
    'browserPrompt.card.empty': 'No prompt yet',
    'browserPrompt.error.noReference': 'No reference image to analyze',
    'browserPrompt.error.noVisionModel': 'Enable a text model with image input in Model Setup first',
    'browserPrompt.error.noPromptReturned': 'The model did not return a prompt',
    'browserPrompt.error.noUsablePrompt': 'The model did not return a usable prompt',
    'browserPrompt.settings.aria': 'Prompt extraction settings',
    'browserPrompt.settings.title': 'Prompt extraction settings',
    'browserPrompt.settings.subtitle': 'Saved to the current project .nomi/browser-prompt-extraction.json',
    'browserPrompt.settings.close': 'Close prompt extraction settings',
    'browserPrompt.settings.default': 'Default',
    'browserPrompt.settings.addCustom': 'Add custom',
    'browserPrompt.settings.name': 'Name',
    'browserPrompt.settings.prompt': 'Prompt',
    'browserPrompt.settings.projectAvailable': 'Settings move with the project folder',
    'browserPrompt.settings.projectUnavailable': 'Current project folder is unavailable, so saving will fail',
    'browserPrompt.settings.resetDefault': 'Restore default',
    'browserPrompt.settings.delete': 'Delete',
    'browserPrompt.settings.cancel': 'Cancel',
    'browserPrompt.settings.save': 'Save',
    'browserPrompt.settings.untitledTemplate': 'Untitled template',
    'browserDialog.aria': 'Browser',
    'browserDialog.loading': 'Loading...',
    'browserDialog.newTab': 'New tab',
    'browserDialog.closeNamedTab': 'Close {{title}}',
    'browserDialog.closeBrowser': 'Close browser',
    'browserDialog.back': 'Back',
    'browserDialog.forward': 'Forward',
    'browserDialog.reload': 'Reload',
    'browserDialog.addressPlaceholder': 'Enter a URL or search terms',
    'browserDialog.addressAria': 'Address bar',
    'browserDialog.saveBookmark': 'Save bookmark',
    'browserDialog.materialSites': 'Asset sites',
    'browserDialog.materialSitesList': 'Asset sites list',
    'browserDialog.screenshotPrompt': 'Extract prompt from screenshot',
    'browserDialog.menuHint': 'Right-click a tab or bookmark to open a menu',
    'browserDialog.webContent': 'Web content',
    'browserDialog.emptyTitle': 'Open a web reference',
    'browserDialog.emptyDescription': 'Enter a URL directly, or search Bing',
    'browserDialog.startSearch': 'Search Bing or enter a URL',
    'browserDialog.open': 'Open',
    'browserDialog.commonSites': 'Common reference sites',
    'browserDialog.promptModePicker': 'Choose prompt extraction mode',
    'browserDialog.video': 'Video',
    'browserDialog.tabMenu': '{{title}} tab menu',
    'browserDialog.bookmarkMenu': '{{title}} bookmark menu',
    'browserDialog.bookmarked': 'Bookmarked',
    'browserDialog.bookmark': 'Bookmark',
    'browserDialog.closeTab': 'Close tab',
    'browserDialog.closeAll': 'Close all',
    'browserDialog.rename': 'Rename',
    'browserDialog.delete': 'Delete',
    'browserDialog.defaultBookmark.nomi': 'Nomi site',
    'browserDialog.promptMode.replicateDescription': 'Recreate subject, composition, light, and details',
    'browserDialog.promptMode.styleDescription': 'Extract color, typography, composition, and effects as JSON',
    'browserDialog.siteHint.visual': 'Visual inspiration',
    'browserDialog.siteHint.designPortfolio': 'Design portfolios',
    'browserDialog.siteHint.ui': 'UI inspiration',
    'browserDialog.siteHint.conceptArt': 'Concept art',
    'browserDialog.siteHint.chineseDiscovery': 'Chinese discovery',
    'browserDialog.siteHint.videoReference': 'Video reference',
    'browserDialog.siteHint.filmFrames': 'Film frames',
    'browserDialog.siteHint.creatorUpdates': 'Creator updates',
    'browserDialog.limitTabs': 'You can open at most {{limit}} tabs',
    'browserDialog.createViewFailed': 'Failed to create browser view',
    'browserDialog.renameBookmarkPrompt': 'Rename bookmark',
    'browserDialog.noPromptImages': 'No image was found for prompt extraction.',
    'browserDialog.promptEntryFailed': 'Image prompt extraction entry failed',
    'browserDialog.textSelectionSaveFailed': 'Failed to save selected webpage text',
    'browserDialog.textPromptSaved': 'Saved to the asset box prompt library',
    'browserDialog.screenshotNeedsPage': 'Open a page before extracting a prompt from a screenshot.',
    'browserDialog.selectionUnsupported': 'This browser does not support selection screenshots.',
    'browserDialog.selectionFailed': 'Selection screenshot failed',
    'browserDialog.screenshotStyleTitle': 'Web selection style',
    'browserDialog.screenshotPromptTitle': 'Web selection prompt',
    'browserDialog.captureNeedsPage': 'Open a page before using resource capture.',
    'browserDialog.captureHoverHint': 'Hover an image or video first, then press Ctrl+C to save.',
    'browserDialog.captureFailed': 'Web asset capture failed',
    'browserDialog.webVideo': 'Web video',
    'browserDialog.webImage': 'Web image',
    'tool.camera.title': 'Camera move',
    'tool.camera.tooltip': 'Camera move: generate a graybox camera reference without building a 3D scene',
    'tool.camera.subtitle': 'No 3D scene needed',
    'tool.camera.typeAria': 'Camera move type',
    'tool.camera.speed': 'Speed',
    'tool.camera.shot': 'Shot size',
    'tool.camera.layerSoonTitle': 'Add a second camera move — coming soon',
    'tool.camera.addLayer': 'Add layer',
    'tool.camera.comingSoon': 'Coming soon',
    'tool.camera.readout': '{{move}} · {{speed}} · {{duration}}s → graybox camera reference auto-attaches to video_ref',
    'tool.camera.apply': 'Apply',
    'tool.camera.toastCreated': 'Created "{{move}} · {{speed}} · {{duration}}s" camera move. Rendering it offscreen and attaching it as this shot reference.',
    'tool.camera.move.push_in': 'Push in',
    'tool.camera.move.pull_out': 'Pull out',
    'tool.camera.move.orbit_left': 'Orbit left',
    'tool.camera.move.orbit_right': 'Orbit right',
    'tool.camera.move.crane_up': 'Crane up',
    'tool.camera.move.crane_down': 'Crane down',
    'tool.camera.move.track_left': 'Track left',
    'tool.camera.move.track_right': 'Track right',
    'tool.camera.move.arc_left': 'Arc left',
    'tool.camera.move.arc_right': 'Arc right',
    'tool.camera.move.zoom_in': 'Zoom in',
    'tool.camera.move.zoom_out': 'Zoom out',
    'tool.camera.move.dolly_zoom': 'Dolly zoom',
    'tool.camera.speed.slow': 'Slow',
    'tool.camera.speed.medium': 'Medium',
    'tool.camera.speed.fast': 'Fast',
    'tool.camera.shot.wide': 'Wide',
    'tool.camera.shot.medium': 'Medium',
    'tool.camera.shot.close': 'Close',
    'tool.promptOptimizer.apply': 'Apply to prompt',
    'tool.promptOptimizer.rerun': 'Optimize again',
    'tool.promptOptimizer.resultHeader': 'Nomi optimized version (highlight = changes)',
    'tool.promptOptimizer.ideaHeader': 'Tell Nomi what to improve',
    'tool.promptOptimizer.running': 'Optimizing...',
    'tool.promptOptimizer.placeholder': 'e.g. make it dusk, tenser, add a little fog... (blank also works)',
    'tool.promptOptimizer.ideaAria': 'Optimization idea',
    'tool.promptOptimizer.run': 'Optimize this prompt',
    'tool.promptOptimizer.aria': 'Optimize prompt with Nomi',
    'tool.promptOptimizer.title': 'Optimize prompt with Nomi',
    'tool.promptOptimizer.buttonIdle': 'Optimize',
    'tool.promptOptimizer.noTextModel': 'Enable a text model in Model setup first',
    'tool.promptOptimizer.emptyResult': 'No optimized result was returned. Try again.',
    'tool.promptOptimizer.failed': 'Optimization failed',
    'tool.convertShot.badge': 'Shot {{index}}',
    'tool.convertShot.aria': 'Convert this image into a video shot as the first frame',
    'tool.convertShot.title': 'Convert to video shot · use this image as the first frame',
    'tool.convertShot.button': 'To video',
    'tool.convertShot.already': 'This shot is already converted to video; selected it',
    'tool.convertShot.created': 'Converted to a video shot · this image is the first frame',
    'tool.panorama.enterAria': 'Enter panorama preview',
    'tool.panorama.enter': 'Enter panorama',
    'tool.panorama.dialog': 'Panorama preview',
    'tool.panorama.upload': '+ Upload panorama',
    'tool.panorama.notReady': 'Panorama is not ready yet. Try again shortly.',
    'tool.panorama.screenshotFailed': 'Screenshot failed. Please try again.',
    'tool.panorama.screenshotTitle': 'Panorama screenshot',
    'tool.panorama.screenshotPrompt': 'Panorama frame screenshot',
    'tool.panorama.screenshotCreated': 'Created panorama screenshot node',
    'tool.panorama.screenshotCapturing': 'Capturing...',
    'tool.panorama.screenshotCapturingShort': 'Capturing',
    'tool.panorama.screenshotFrame': 'Screenshot frame',
    'tool.panorama.empty': 'Upload a panorama or connect an image node',
    'tool.panorama.closePreview': 'Close preview',
    'tool.provenance.aria': 'Generation provenance',
    'tool.provenance.title': 'Generation record · {{name}}',
    'tool.provenance.close': 'Close',
    'tool.provenance.empty': 'This node has no traceable generation record.',
    'tool.provenance.possibleReasons': 'Possible reasons:',
    'tool.provenance.reasonLegacy': 'The node is from a project before v0.4.0; provenance was added in v0.5',
    'tool.provenance.reasonLocal': 'The asset was imported locally and was not AI-generated',
    'tool.provenance.reasonFailed': 'The generation call failed, so provenance was not written',
    'tool.provenance.provider': 'Provider',
    'tool.provenance.model': 'Model',
    'tool.provenance.time': 'Time',
    'tool.provenance.emptyPrompt': '(empty)',
    'tool.provenance.copyPrompt': 'Copy prompt',
    'tool.provenance.params': 'Params',
    'tool.provenance.regenerate': 'Regenerate with same parameters',
    'whiteboard.title': 'Whiteboard',
    'whiteboard.close': 'Close',
    'whiteboard.closeAria': 'Close whiteboard',
    'whiteboard.saveMain': 'Save as main image',
    'whiteboard.screenshotCreateNode': 'Screenshot and create image node',
    'whiteboard.boardNotReady': 'Canvas is not ready yet',
    'whiteboard.imageNodeMissing': 'Image node does not exist',
    'whiteboard.screenshotSaveFailed': 'Whiteboard screenshot save failed. Try again shortly.',
    'whiteboard.saveMainSuccess': 'Saved as main image',
    'whiteboard.saveFailed': 'Whiteboard save failed',
    'whiteboard.screenshotCreated': 'Created whiteboard screenshot node',
    'whiteboard.screenshotFailed': 'Whiteboard screenshot failed',
    'whiteboard.aspectTitle': 'Whiteboard ratio',
    'whiteboard.ratio': 'Ratio',
    'whiteboard.aspectSelect': 'Choose whiteboard ratio',
    'whiteboard.library.dragAdd': 'Drag to the whiteboard to add',
    'whiteboard.library.title': 'Asset library',
    'whiteboard.library.board': 'Board',
    'whiteboard.library.results': 'Results',
    'whiteboard.library.dragCopy': 'Drag to the whiteboard to copy',
    'whiteboard.library.emptyBoard': 'Image node results from the whiteboard will appear here',
    'whiteboard.library.emptyResults': 'Connected image node results will appear here',
    'whiteboard.removeBgProcessing': 'Removing background',
    'whiteboard.fullscreen': 'Fullscreen',
    'whiteboard.exitFullscreen': 'Exit fullscreen',
    'whiteboard.importImage': 'Import image',
    'whiteboard.customBrushColor': 'Custom brush color',
    'whiteboard.colorAria': 'Color {{color}}',
    'whiteboard.deleteSelected': 'Delete selected element',
    'whiteboard.imageReadFailed': 'Image read failed',
    'whiteboard.selectImageFile': 'Choose an image file',
    'whiteboard.importFailed': 'Image import failed',
    'whiteboard.removeBgSuccess': 'Replaced with cutout result',
    'whiteboard.removeBgFailed': 'Cutout failed. Check the network connection and try again.',
    'whiteboard.leaferAria': 'Leafer whiteboard',
    'whiteboard.drawingLayerAria': 'Drawing interaction layer',
    'whiteboard.tool.brush': 'Brush',
    'whiteboard.tool.select': 'Select',
    'whiteboard.tool.eraser': 'Eraser',
    'whiteboard.tool.shape': 'Shape',
    'whiteboard.open': 'Open whiteboard',
    'whiteboard.openHint': 'Click to open whiteboard',
    'whiteboard.screenshotTitle': '{{name}} screenshot',
    'whiteboard.imageResult': 'Image result',
    'whiteboard.importedImage': 'Imported image',
    'whiteboard.originalImage': 'Original image',
    'whiteboard.material': 'Asset',
    'whiteboard.resultImage': 'Result image',
    'whiteboard.copySuffix': 'copy',
    'whiteboard.backgroundLayer': 'Background',
    'whiteboard.layerOne': 'Layer 1',
    'whiteboard.hideItem': 'Hide {{name}}',
    'whiteboard.showItem': 'Show {{name}}',
    'promptLibrary.source.aria': 'Prompt source',
    'promptLibrary.source.mine': 'My library',
    'promptLibrary.source.nomi': 'Nomi picks',
    'promptLibrary.category.aria': 'Prompt type filter',
    'promptLibrary.category.all': 'All',
    'promptLibrary.title': 'Prompt library',
    'promptLibrary.close': 'Close prompt library',
    'promptLibrary.search': 'Search prompts...',
    'promptLibrary.new': 'New',
    'promptLibrary.noMatch.title': 'No matching prompts',
    'promptLibrary.noMatch.description': 'Try a different filter or search term.',
    'promptLibrary.loading': 'Fetching prompts from the public library...',
    'promptLibrary.fetchEmpty.title': 'Could not fetch prompts',
    'promptLibrary.retry': 'Retry',
    'promptLibrary.dialog.aria': 'Prompt library',
    'promptLibrary.sentToCanvas': 'Sent to canvas · {{kind}} node',
    'promptLibrary.canvasNode': 'Storyboard',
    'promptLibrary.videoNode': 'Video',
    'promptLibrary.deleted': 'Removed from my library · {{title}}',
    'promptComposer.editTitle': 'Edit prompt',
    'promptComposer.newTitle': 'New prompt',
    'promptComposer.typeAria': 'Prompt type',
    'promptComposer.titlePlaceholder': 'Title (optional, e.g. Sunset silhouette)',
    'promptComposer.promptPlaceholder': 'Paste a prompt that worked well...',
    'promptComposer.emptyError': 'Prompt cannot be empty',
    'promptComposer.saveError': 'Save failed',
    'promptComposer.cancel': 'Cancel',
    'promptComposer.save': 'Save',
    'promptComposer.saveToMine': 'Save to my library',
    'promptCard.mine': 'Mine',
    'promptCard.edit': 'Edit',
    'promptCard.delete': 'Delete',
    'promptPreview.noMedia': 'No cover media for this prompt',
    'promptPreview.close': 'Close',
    'promptPreview.copy': 'Copy prompt',
    'promptPreview.copied': 'Copied',
    'promptPreview.send': 'Send to canvas',
    'promptPreview.sent': 'Sent to canvas',
    'promptPreview.source': 'Source',
    'promptPreview.localOnly': 'My library · local only',
    'skillLibrary.source.aria': 'Skill source',
    'skillLibrary.source.mine': 'My skills',
    'skillLibrary.source.builtin': 'Nomi built-ins',
    'skillLibrary.authorName': 'AI skill writer',
    'skillLibrary.title': 'Skill library',
    'skillLibrary.close': 'Close skill library',
    'skillLibrary.search': 'Search skills...',
    'skillLibrary.importFile': 'Import file',
    'skillLibrary.newAi': 'Create with AI',
    'skillLibrary.newAiCompact': 'AI create',
    'skillLibrary.newTile': 'Create one with AI',
    'skillLibrary.dialog.aria': 'Skill library',
    'skillLibrary.exportFailed': 'Export failed: skill not found',
    'skillLibrary.deleteFailed': 'Delete failed',
    'skillLibrary.deleted': 'Deleted · {{name}}',
    'skillLibrary.importInvalid': 'Import failed: this is not a valid skill package file (JSON parse failed)',
    'skillLibrary.importSuccess': 'Imported · {{name}}',
    'skillLibrary.newSkill': 'New skill',
    'skillLibrary.importFailed': 'Import failed: {{message}}',
    'skillLibrary.importReadFailed': 'Import failed: could not read this file',
    'skillLibrary.noMatch.title': 'No matching skills',
    'skillLibrary.noMine.title': 'You do not have custom skills yet',
    'skillLibrary.noBuiltin.title': 'No built-in skills',
    'skillLibrary.noMatch.description': 'Try a different search term.',
    'skillLibrary.noMine.description': 'Use "Create with AI" to write one, or import someone else’s skill package.',
    'skillCard.playbookStageCount': 'playbook · {{count}} stages',
    'skillCard.assistant': 'Assistant',
    'skillCard.noDescription': 'No description yet',
    'skillCard.useInCreation': 'Use in Creation',
    'skillCard.exportAria': 'Export {{name}}',
    'skillCard.exportTooltip': 'Export skill package',
    'skillCard.deleteAria': 'Delete {{name}}',
    'skillCard.deleteTooltip': 'Delete skill',
    'skillCard.builtinReadonly': 'Built-in · read only',
    'creation.aria': 'Creation workspace',
    'creation.expandAssistant': 'Expand creation assistant',
    'creation.aiSuffix': 'Creation',
    'onboardingChecklist.triggerAria': '4-step guide, {{done}} / {{total}} complete',
    'onboardingChecklist.shortTitle': 'Guide',
    'onboardingChecklist.title': '4-step guide',
    'onboardingChecklist.collapse': 'Collapse',
    'onboardingChecklist.openHandbook': 'Full handbook',
    'onboardingChecklist.dismiss': 'Do not show again',
    'onboardingChecklist.step.model.label': 'Connect a model',
    'onboardingChecklist.step.model.hint': 'Connect one AI service with your own key.',
    'onboardingChecklist.step.storyboard.label': 'Break down one shot',
    'onboardingChecklist.step.storyboard.hint': 'Ask the creation area to break your story into shots and place them on the canvas.',
    'onboardingChecklist.step.generated.label': 'Generate an image',
    'onboardingChecklist.step.generated.hint': 'Choose a model on a shot card, then generate an image.',
    'onboardingChecklist.step.exported.label': 'Export the cut',
    'onboardingChecklist.step.exported.hint': 'Arrange shots on the timeline, then export MP4 from the top right.',
    'journey.finale.aria': 'Guide finished',
    'journey.finale.title': 'That is the full flow. Now it is your turn.',
    'journey.finale.body': 'From one sentence to a finished cut, every step stays visible. Want to try it with your own story?',
    'journey.finale.startReal': 'Use my own story',
    'journey.finale.browse': 'Browse first',
    'journey.stepLabel': 'Step {{current}}/{{total}}',
    'journey.done': 'Done',
    'journey.next': 'Next',
    'journey.autoplay': 'Autoplaying',
    'journey.skip': 'Skip',
    'journey.write.title': '1. Everything starts with one sentence',
    'journey.write.body': 'Write your story in the creation area and AI drafts with you word by word.',
    'journey.split.title': '2. AI breaks the story into shots',
    'journey.split.body': 'It also keeps cross-shot characters, scenes, and continuity anchors together.',
    'journey.canvas.title': '3. Place it on the canvas',
    'journey.canvas.body': 'Each shot becomes a card, all visible and editable.',
    'journey.character.title': 'Same person in every shot',
    'journey.character.body': 'This identity card locks the face so the child and the little robot do not drift between shots.',
    'journey.staging.title': 'Who stands where',
    'journey.staging.body': 'Set the staging in 3D and AI follows it, such as two characters sitting side by side on a rooftop.',
    'journey.trajectory.title': 'Need camera movement',
    'journey.trajectory.body': 'Draw a camera path and AI recreates that move, such as a slow pullback at sunset.',
    'journey.generate.title': 'This is the generated cut',
    'journey.generate.body': 'The demo is already generated. For your own work, use each card’s generate button to make your version.',
    'journey.captions.title': 'Arrange it on the timeline',
    'journey.captions.body': 'Add captions and title cards, then tune the rhythm yourself.',
    'journey.export.title': 'Take the finished video',
    'journey.export.body': 'Export MP4 in one click and the pipeline is complete.',
    'handbook.dialog.aria': 'Getting started handbook',
    'handbook.close': 'Close handbook',
    'modelSetup.dialog.aria': 'Model setup',
    'modelSetup.title': 'Model setup',
    'modelSetup.capabilityIntro': 'You can generate',
    'modelSetup.kind.image': 'Images',
    'modelSetup.kind.video': 'Video',
    'modelSetup.kind.text': 'Text',
    'modelSetup.kind.audio': 'Voice',
    'modelSetup.kind.model3d': '3D',
    'modelSetup.kind.notConnected': 'Not connected',
    'modelSetup.loading': 'Loading...',
    'modelSetup.connected': 'Connected',
    'modelSetup.available': 'Available',
    'modelSetup.modelsAvailable': '{{count}} models available',
    'modelSetup.modelsEnabled': '{{enabled}} / {{total}} models enabled',
    'modelSetup.configured': 'Configured',
    'modelSetup.recommended': 'Recommended',
    'modelSetup.connectGenerationModels': 'Connect generation models',
    'modelSetup.addModelRelay': 'Add model / relay',
    'modelSetup.addModelRelayHint': 'new-api can import image, video, and text models at once · official vendors and custom APIs also work',
    'modelSetup.localComfyui': 'Using local ComfyUI?',
    'modelSetup.dreaminaMember': 'Have a Dreamina membership?',
    'modelSetup.connectAssistantOptional': 'Connect coding assistant · optional',
    'modelSetup.deleteModel.title': 'Delete model',
    'modelSetup.deleteModel.message': 'Delete "{{name}}"? This cannot be undone. You will need to fetch it again to use it later.',
    'modelSetup.deleteModel.confirm': 'Delete',
    'modelSetup.deleteModel.error': 'Delete failed',
    'modelSetup.actionFailed': 'Action failed',
    'modelSetup.card.connected': 'Connected',
    'modelSetup.card.todo': 'To connect',
    'modelPicker.back': 'Back',
    'modelPicker.title': 'Choose models to add',
    'modelPicker.refetch': 'Fetch again',
    'modelPicker.sourceFetched': '{{source}}{{host}}{{total}}',
    'modelPicker.fetchedCount': '{{count}} fetched',
    'modelPicker.searchPlaceholder': 'Search model id...',
    'modelPicker.selectedCount': 'Selected {{count}}',
    'modelPicker.selectedTotal': ' / {{total}} total',
    'modelPicker.clear': 'Clear',
    'modelPicker.emptyNoModels': 'This endpoint did not list models. Add a model id below.',
    'modelPicker.emptyNoMatch': 'No matching models',
    'modelPicker.unselectGroup': 'Unselect group',
    'modelPicker.selectGroup': 'Select group',
    'modelPicker.manualPlaceholder': 'Enter an unlisted model id and press Enter',
    'modelPicker.add': 'Add',
    'modelPicker.cancel': 'Cancel',
    'modelPicker.addModels': 'Add {{count}} models',
    'vendorCard.defaultCredentialPlaceholder': 'Paste your API key (sk-...)',
    'vendorCard.missingMultiCredential': 'Fill in every field above.',
    'vendorCard.missingApiKey': 'Paste an API key first.',
    'vendorCard.unlockFailed': 'Unlock failed: {{message}}',
    'vendorCard.unlock': 'Unlock',
    'vendorCard.cancel': 'Cancel',
    'vendorCard.defaultCredentialHint': 'Enter it once. The key is encrypted locally and used only for requests.',
    'vendorCard.credentialSaved': 'Credential saved',
    'vendorCard.change': 'Change',
    'vendorCard.disconnect': 'Disconnect',
    'vendorCard.disconnectTitle': 'Disconnect provider',
    'vendorCard.disconnectMessage': 'Disconnect "{{name}}"? Its models will return to "not connected" and will need a key again.',
    'vendorCard.disconnectFailed': 'Disconnect failed: {{message}}',
    'vendorCard.invalidBaseUrl': 'The endpoint must start with http(s)://.',
    'vendorCard.saveFailed': 'Save failed: {{message}}',
    'vendorCard.save': 'Save',
    'vendorCard.baseUrl': 'Endpoint: {{baseUrl}}',
    'vendorCard.editBaseUrl': 'Edit {{name}} endpoint',
  },
  ru: {
    'app.loading': 'Nomi загружается',
    'app.mainUi': 'Главный интерфейс',
    'common.loading': 'Загрузка',
    'common.noImage': 'Нет изображения',
    'common.imageLoadFailed': 'Не удалось загрузить',
    'common.imageLoadFailedWithUrl': 'Не удалось загрузить изображение: {{url}}',
    'app.studioAria': 'Nomi Studio',
    'app.close.title': 'Закрыть Nomi?',
    'app.close.message': 'Окно закроется. Незавершенные генерации или экспорты могут прерваться.',
    'app.close.confirm': 'Закрыть',
    'app.close.cancel': 'Отмена',
    'app.project.saveError': 'Не удалось сохранить проект. Проверьте права доступа к диску.',
    'app.project.notFound': 'Файлы проекта не найдены. Возможно, их удалили. Обновите библиотеку проектов.',
    'app.project.upgraded': 'Проект обновлен до дерева папок: {{count}} узлов разложено по категориям',
    'app.project.restoreError': 'Не удалось восстановить проект',
    'app.project.newError': 'Не удалось создать проект. Проверьте права доступа к диску.',
    'app.project.demoOpenError': 'Не удалось открыть демо-проект. Проверьте права доступа к диску.',
    'app.project.openFolderUnsupported': 'Эта среда не умеет открывать папку проекта.',
    'app.project.openFolderError': 'Не удалось открыть папку проекта',
    'app.project.defaultName': 'Проект без названия {{date}}',
    'app.project.untitled': 'Проект Nomi без названия',
    'app.project.renameSaveError': 'Не удалось сохранить новое имя проекта',
    'app.folderInit.title': 'Сделать папку проектом Nomi',
    'app.folderInit.message': '{{rootPath}}\n\nNomi создаст .nomi/ и будет сохранять созданные изображения и видео в assets/ и exports/.',
    'app.folderInit.confirm': 'Создать',
    'app.delete.externalTitle': 'Убрать проект из библиотеки',
    'app.delete.nativeTitle': 'Удалить проект',
    'app.delete.externalMessage': 'Убрать "{{name}}" из библиотеки проектов? Это только отвяжет папку. Исходная папка и файлы не будут удалены.',
    'app.delete.nativeMessage': 'Удалить "{{name}}"? Папка проекта и локальные материалы будут навсегда удалены с диска.',
    'app.delete.externalConfirm': 'Убрать',
    'app.delete.nativeConfirm': 'Удалить',
    'app.delete.externalSuccess': 'Убрано из библиотеки',
    'app.delete.nativeSuccess': 'Проект удален',
    'app.delete.error': 'Не удалось удалить проект',
    'app.canvas.loading': 'Холст генерации загружается',
    'app.canvas.loadingLabel': 'Холст генерации загружается',
    'language.switcher.aria': 'Переключить язык интерфейса',
    'language.switcher.leading': 'Язык',
    'language.zh': '中文',
    'language.en': 'English',
    'language.ru': 'Русский',
    'library.updated.justNow': 'Только что',
    'library.updated.minutesAgo': '{{count}} мин. назад',
    'library.updated.hoursAgo': '{{count}} ч. назад',
    'library.updated.daysAgo': '{{count}} дн. назад',
    'library.actions.replaySplash': 'Что умеет Nomi',
    'library.actions.modelCatalog': 'Модели',
    'library.actions.openBrowser': 'Браузер',
    'library.actions.openAssetBox': 'Материалы',
    'library.actions.assetBoxTitle': 'Материалы',
    'library.actions.assetCount': '{{count}} материалов',
    'library.title': 'Библиотека проектов',
    'library.startAria': 'Начать проект',
    'library.newBlank.title': 'Новый пустой проект',
    'library.newBlank.description': 'Начните с текста или идеи',
    'library.openFolder.title': 'Открыть папку',
    'library.openFolder.description': 'Сделать папку с материалами проектом',
    'library.journey.title.first': 'Посмотреть, как Nomi делает видео',
    'library.journey.title.replay': 'Повторить обучение',
    'library.journey.description': '60-секундный обзор: от одной фразы до ролика',
    'library.modelStatus.aria': 'Статус модели',
    'library.modelStatus.title': 'Текстовая модель не подключена',
    'library.modelStatus.description': 'Для историй и разбивки на кадры нужна текстовая модель. Изображения и видео можно подключить перед генерацией.',
    'library.modelStatus.button': 'Подключить текстовую модель',
    'library.recent': 'Недавние проекты',
    'library.filter.aria': 'Фильтр источника проектов',
    'library.filter.all': 'Все',
    'library.filter.native': 'Локальные',
    'library.filter.folder': 'Внешние папки',
    'library.search.placeholder': 'Искать проекты',
    'library.empty.noMatch': 'Нет проектов по запросу "{{query}}"',
    'library.empty.noCategory': 'В этой категории пока нет проектов',
    'library.empty.clearSearch': 'Очистить поиск',
    'library.project.deleteAria': 'Удалить проект {{name}}',
    'library.project.deleteTitle': 'Удалить проект',
    'library.project.folderUnavailable': 'Папка недоступна',
    'library.project.continue': 'Продолжить',
    'library.project.revealAria': 'Открыть папку проекта {{name}}',
    'library.project.revealTitle': 'Показать папку проекта в Finder',
    'theme.light': 'Включить светлую тему',
    'theme.dark': 'Включить темную тему',
    'theme.appearance': 'Внешний вид',
    'theme.lightMode': 'Светлая тема',
    'theme.darkMode': 'Темная тема',
    'window.controls': 'Управление окном',
    'window.minimize': 'Свернуть',
    'window.maximize': 'Развернуть',
    'window.restore': 'Восстановить',
    'window.close': 'Закрыть',
    'about.dialog.aria': 'О Nomi',
    'about.currentVersion': 'Текущая версия {{version}}',
    'about.handbook.title': 'Руководство',
    'about.handbook.subtitle': 'Процесс · первый результат · возможности · проверка',
    'about.update.desktopOnly': 'В настольной версии можно проверять обновления и обновляться в один клик.',
    'about.update.checking': 'Проверяем...',
    'about.update.upToDate': 'Установлена последняя версия',
    'about.update.available': 'Доступна новая версия {{version}}',
    'about.update.later': 'Позже',
    'about.update.download': 'Скачать обновление',
    'about.update.openDownload': 'Перейти к загрузке',
    'about.update.manualMac': 'На macOS нужно скачать пакет вручную и заменить старое приложение. Эта неподписанная сборка пока не умеет автообновляться на месте.',
    'about.update.downloading': 'Скачиваем обновление...',
    'about.update.background': 'Скачивание в фоне · {{percent}}%',
    'about.update.downloaded': 'Загрузка завершена',
    'about.update.install': 'Перезапустить и установить',
    'about.update.error': 'Ошибка обновления',
    'about.update.retry': 'Повторить',
    'about.update.idle': 'Проверить, доступна ли новая версия',
    'about.update.check': 'Проверить обновления',
    'errorBoundary.title': 'Что-то пошло не так',
    'errorBoundary.message': 'В интерфейсе произошла ошибка. Можно перезагрузить окно или скопировать детали ошибки и отправить нам.',
    'errorBoundary.reload': 'Перезагрузить',
    'errorBoundary.copy': 'Скопировать ошибку',
    'chunk.loadFailed': 'Не удалось загрузить: {{label}}',
    'chunk.networkRecovering': 'Загрузку прервала сеть. Пытаемся восстановиться.',
    'chunk.otherFeaturesOk': 'Остальные функции не затронуты. Перезагрузите, чтобы попробовать снова.',
    'chunk.reload': 'Перезагрузить',
    'splash.aria': 'Вступление Nomi',
    'splash.skip': 'Пропустить ›',
    'splash.caption.start': 'Начните с одной фразы',
    'splash.caption.canvas': 'Через несколько секунд она станет раскадровкой',
    'splash.caption.control': 'Каждый кадр остается под вашим контролем',
    'splash.caption.timeline': 'Разложите по таймлайну и экспортируйте ролик',
    'splash.caption.brand': '',
    'splash.creation.prompt': 'Превратите одну фразу...',
    'splash.node.opening': 'Кадр 1 · Начало',
    'splash.node.closeup': 'Кадр 2 · Крупный план',
    'splash.node.ending': 'Кадр 3 · Финал',
    'splash.timeline.video': 'Видео',
    'splash.timeline.audio': 'Звук',
    'splash.brand.slogan': 'AI делает черновик. Вы режиссируете.',
    'studio.appbar.aria': 'Рабочая область Nomi',
    'studio.appbar.about': 'О Nomi · Проверить обновления',
    'studio.appbar.breadcrumb': 'Навигация',
    'studio.appbar.backToLibrary': 'Назад в библиотеку проектов',
    'studio.appbar.projectName': 'Название проекта',
    'studio.appbar.globalActions': 'Общие действия',
    'studio.appbar.openBrowser': 'Открыть браузер',
    'studio.appbar.browser': 'Браузер',
    'studio.appbar.openAssetBox': 'Открыть материалы',
    'studio.appbar.assetBox': 'Материалы',
    'studio.appbar.assetCount': '{{count}} материалов',
    'studio.appbar.openModelSetup': 'Открыть настройку моделей',
    'studio.appbar.modelSetup': 'Модели',
    'studio.appbar.export': 'Экспорт',
    'studio.appbar.exportMp4': 'Экспорт MP4',
    'studio.appbar.goPreviewExport': 'Перейти к экспорту',
    'studio.windowbar.aria': 'Заголовок окна',
    'studio.windowbar.quickActions': 'Быстрые действия проекта',
    'studio.workspace.creation': 'Сценарий',
    'studio.workspace.generation': 'Генерация',
    'studio.workspace.preview': 'Просмотр',
    'studio.workspace.loading': 'Загрузка: {{label}}',
    'studio.stepper.aria': 'Переключить рабочую область',
    'studio.stepper.creation': 'Создать',
    'studio.stepper.generation': 'Генерация',
    'studio.stepper.preview': 'Просмотр',
    'generation.timeline.chunk': 'Таймлайн генерации',
    'generation.aria': 'Область генерации',
    'generation.expandTimeline': 'Открыть таймлайн генерации',
    'generation.timeline': 'Таймлайн',
    'generation.clipCount': '{{count}} клипов',
    'generation.aiSidebar': 'AI-панель генерации',
    'generation.resizeAssistant': 'Перетащите, чтобы изменить ширину помощника',
    'preview.aria': 'Область просмотра',
    'preview.timeline.region': 'Таймлайн просмотра',
    'preview.timeline.actionPrefix': 'Таймлайн просмотра - ',
    'preview.player.aria': 'Плеер предпросмотра',
    'preview.placeholder.title': 'Предпросмотр видео',
    'preview.placeholder.description': 'Перетащите материал из генерации, чтобы увидеть его здесь',
    'preview.videoPlayFailed': 'Не удалось воспроизвести видео: {{message}}',
    'preview.videoLoadFailed': 'Не удалось загрузить видео: {{message}}',
    'preview.controls.aria': 'Управление предпросмотром',
    'preview.play': 'Воспроизвести',
    'preview.pause': 'Пауза',
    'preview.timelineEmpty': 'Таймлайн пуст',
    'preview.previousFrame': 'Предыдущий кадр',
    'preview.previousFrameTitle': 'Предыдущий кадр (←)',
    'preview.nextFrame': 'Следующий кадр',
    'preview.nextFrameTitle': 'Следующий кадр (→)',
    'preview.mute': 'Выключить звук',
    'preview.unmute': 'Включить звук',
    'preview.volume': 'Громкость',
    'preview.fullscreen': 'На весь экран',
    'preview.exitFullscreen': 'Выйти из полного экрана',
    'preview.fullscreenTitle': 'Полноэкранный предпросмотр',
    'preview.aspectRatio': 'Формат предпросмотра',
    'preview.aspectRatioLeading': 'Формат',
    'preview.fitMode': 'Подгонка кадра',
    'preview.fitLeading': 'Вид',
    'preview.fitContain': 'Вписать',
    'preview.fitCover': 'Заполнить',
    'preview.framing': 'Кадрирование предпросмотра',
    'preview.zoomOut': 'Уменьшить',
    'preview.zoomCurrent': 'Текущий масштаб',
    'preview.zoomReset': 'Сбросить кадрирование',
    'preview.zoomIn': 'Увеличить',
    'preview.addText.aria': 'Добавить текст',
    'preview.addText.title': 'Добавить субтитры или титры. Текст можно свободно двигать и масштабировать.',
    'preview.text': 'Текст',
    'preview.caption': 'Субтитры',
    'preview.captionHint': 'Снизу · мелко',
    'preview.titleCard': 'Титр',
    'preview.titleCardHint': 'По центру · крупно',
    'preview.textDragTitle': 'Перетащите для движения · углы меняют размер · двойной клик редактирует',
    'preview.textSelectTitle': 'Выбрать · двойной клик редактирует',
    'preview.export.preparing': 'Подготовка...',
    'preview.export.converting': 'Кодируем MP4...',
    'preview.export.recording': 'Экспорт {{percent}}%',
    'preview.export.cancel': 'Отменить экспорт',
    'preview.export.cancelDisabled': 'Идет подготовка, отмена пока недоступна',
    'preview.export.mp4': 'Экспорт MP4',
    'preview.export.success': 'Экспортировано в папку проекта exports: {{path}}',
    'preview.export.error': 'Экспорт не удался',
    'preview.export.title.empty': 'Таймлайн пуст. Сначала добавьте материалы.',
    'preview.export.title.converting': 'Кодируем MP4',
    'preview.export.title.recording': 'Экспорт {{percent}}%',
    'preview.export.title.ready': 'Экспорт MP4: 1080p · {{aspectRatio}} · стандартная публикация · сохранение в папку exports проекта',
    'preview.textStyle.aria': 'Стиль текста',
    'preview.textStyle.fontSize': 'Размер',
    'preview.textStyle.decrease': 'Уменьшить текст',
    'preview.textStyle.increase': 'Увеличить текст',
    'preview.textStyle.percent': 'Размер текста в процентах',
    'preview.textStyle.font': 'Шрифт',
    'timeline.selectedActions': 'Действия с выбранным клипом',
    'timeline.regenerateShot': 'Сгенерировать этот кадр заново',
    'timeline.regenerateShotTitle': 'Перегенерировать этот кадр на месте. Prompt и параметры меняются в узле холста.',
    'timeline.nudgeEarlier': 'Сдвинуть клип раньше',
    'timeline.copyClip': 'Копировать клип',
    'timeline.nudgeLater': 'Сдвинуть клип позже',
    'timeline.aiArrange': 'AI-монтаж',
    'timeline.aiArrangeTitle': 'AI-монтаж: разложить кадры из генерации на таймлайн по порядку, пропуская уже добавленные.',
    'timeline.aiArrange.success': 'Кадры добавлены на таймлайн по порядку: {{count}}',
    'timeline.aiArrange.empty': 'В генерации пока нет кадров. Сначала создайте несколько кадров.',
    'timeline.aiArrange.already': 'Все кадры уже на таймлайне',
    'timeline.splitExit': 'Выйти из режима ножниц',
    'timeline.splitEnter': 'Режим ножниц',
    'timeline.splitExitTitle': 'Режим ножниц включен: нажмите клип, чтобы разрезать его в точке курсора · Esc выходит',
    'timeline.splitEnterTitle': 'Ножницы: нажмите клип, чтобы разрезать его в этой точке',
    'timeline.redo': 'Повторить правку таймлайна',
    'timeline.redoTitle': 'Повторить (⇧⌘Z)',
    'timeline.undo': 'Отменить правку таймлайна',
    'timeline.undoTitle': 'Отменить (⌘Z)',
    'timeline.zoomOut': '{{prefix}}уменьшить таймлайн',
    'timeline.zoomReset': 'Сбросить масштаб',
    'timeline.zoomIn': '{{prefix}}увеличить таймлайн',
    'timeline.deleteSelected': '{{prefix}}удалить выбранные клипы',
    'timeline.collapse': '{{prefix}}свернуть таймлайн',
    'timeline.ruler': 'Шкала времени',
    'timeline.dragPlayhead': 'Перетащить плейхед',
    'timeline.textTrack': 'Текстовая дорожка',
    'timeline.textEmpty': 'Добавьте субтитры или титр сверху',
    'timeline.emptyText': '(пусто)',
    'timeline.caption': 'Субтитры',
    'timeline.titleCard': 'Титр',
    'timeline.resizeLeft': 'Изменить длительность слева',
    'timeline.resizeRight': 'Изменить длительность справа',
    'timeline.emptyAudio': 'Перетащите аудио из материалов, чтобы добавить музыку',
    'timeline.emptyMedia': 'Перетащите материал из генерации',
    'timeline.dropAudioReject': 'На аудиодорожку можно положить только аудиоматериалы',
    'timeline.dropPlace': 'Положить на {{timecode}}',
    'timeline.overlayLayer': 'Слой наложений',
    'timeline.addCaption': 'Добавить субтитры',
    'timeline.audioDrop': 'Перетащите аудио сюда как музыку',
    'timeline.trimStart': 'Настроить начало клипа',
    'timeline.trimEnd': 'Настроить конец клипа',
    'mediaType.image': 'Изображение',
    'mediaType.video': 'Видео',
    'asset.kind.all': 'Все',
    'asset.kind.none': 'Без категории',
    'asset.kind.image': 'Изображение',
    'asset.kind.video': 'Видео',
    'asset.kind.audio': 'Аудио',
    'assetPicker.limitReached': 'Лимит для этого типа уже достигнут',
    'assetPicker.search': 'Искать материалы по имени',
    'assetPicker.canvas': 'Холст',
    'assetPicker.projectRecent': 'Материалы проекта · недавние',
    'assetPicker.browseAll': 'Все материалы →',
    'assetPicker.loading': 'Материалы загружаются',
    'assetPicker.noMatch': 'Подходящих материалов нет',
    'assetPicker.empty': 'Материалов пока нет. Загрузите или перетащите файлы.',
    'assetPicker.uploadingLabel': 'Загрузка',
    'assetPicker.uploading': 'Загружаем...',
    'assetPicker.uploadLocal': 'Загрузить локальный файл',
    'assetPicker.footer': 'Можно бросить файлы сюда · протянуть линию из карточки · перетащить из панели материалов в узел',
    'assetLibrary.source.aria': 'Фильтр источника материалов',
    'assetLibrary.source.all': 'Все материалы',
    'assetLibrary.source.project': 'Материалы проекта',
    'assetLibrary.title': 'Библиотека материалов',
    'assetLibrary.close': 'Закрыть библиотеку материалов',
    'assetLibrary.dialog.aria': 'Библиотека материалов',
    'assetLibrary.upload': 'Загрузить',
    'assetLibrary.uploadAria': 'Загрузить материалы',
    'assetLibrary.webCapture': 'Захват из веба',
    'assetLibrary.webCaptureTitle': 'Открыть браузер для референсов: наведите на изображение и нажмите захват или перетащите его.',
    'assetLibrary.filePicker': 'Выбор файлов материалов',
    'assetLibrary.search': 'Искать материалы...',
    'assetLibrary.categoryFilter': 'Фильтр категории материалов',
    'assetLibrary.categoryDialog': 'Фильтр категорий материалов',
    'assetLibrary.categoryList': 'Категории материалов',
    'assetLibrary.categoryTitle': 'Категория: {{label}}',
    'assetLibrary.deleteSelectedAria': 'Удалить материалы проекта: {{count}}',
    'assetLibrary.deleteSelectedTitle': 'Удалить материалы проекта: {{count}}',
    'assetLibrary.deleteDisabledTitle': 'Сначала выберите материалы проекта',
    'assetLibrary.dragMultiple': 'Материалов: {{count}}',
    'assetLibrary.dragToTimelineAudio': 'Перетащите на аудиодорожку таймлайна',
    'assetLibrary.dragToCanvas': 'Перетащите на холст',
    'assetLibrary.selectableProjectAsset': 'Материал холста текущего проекта. Выберите его, чтобы удалить.',
    'assetLibrary.mediaImport.success': 'Импортировано материалов: {{count}}',
    'assetLibrary.audioImport.success': 'Импортировано аудио: {{count}}',
    'assetLibrary.importSkipped.tooLarge': 'слишком больших: {{count}}',
    'assetLibrary.importSkipped.overLimit': 'сверх лимита за импорт: {{count}}',
    'assetLibrary.importSkipped.duplicate': 'дубликатов: {{count}}',
    'assetLibrary.importSkipped.failed': 'с ошибкой: {{count}}',
    'assetLibrary.importSkipped.summary': 'Пропущено: {{items}}',
    'assetLibrary.import.mediaFailed': 'Не удалось импортировать материалы. Попробуйте снова.',
    'assetLibrary.import.audioFailed': 'Не удалось импортировать аудио. Попробуйте снова.',
    'assetLibrary.import.unsupportedSkipped': 'Пропущено неподдерживаемых файлов: {{count}}',
    'assetLibrary.delete.noProject': 'Удаление не удалось: нет открытого проекта',
    'assetLibrary.delete.selectFirst': 'Сначала выберите материалы проекта для удаления',
    'assetLibrary.delete.notDeletable': 'Выбранные материалы пока нельзя удалить',
    'assetLibrary.delete.confirmTitle': 'Удалить материалы проекта: {{count}}?',
    'assetLibrary.delete.confirmMessage': 'Связанные узлы холста и сохраненные файлы из всех материалов будут удалены вместе. Файлы проекта будут перемещены в системную корзину.',
    'assetLibrary.delete.confirm': 'Удалить',
    'assetLibrary.delete.unsupported': 'Эта среда не умеет удалять материалы проекта',
    'assetLibrary.delete.projectSuccess': 'Удалено материалов проекта: {{count}}',
    'assetLibrary.delete.fileSuccess': 'Удалено сохраненных материалов: {{count}}',
    'assetLibrary.delete.fileFailed': 'Не удалось удалить сохраненные материалы: {{count}}',
    'assetLibrary.delete.failed': 'Не удалось удалить материалы проекта. Проверьте права доступа к файлам.',
    'assetLibrary.empty.project': 'Материалов проекта пока нет',
    'assetLibrary.empty.all': 'Материалов пока нет',
    'assetLibrary.empty.noMatch': 'Подходящих материалов нет',
    'assetLibrary.empty.description': 'Загрузите изображения, видео или аудио, либо создайте материалы в генерации, и они появятся здесь автоматически.',
    'assetLibrary.empty.noMatchDescription': 'Попробуйте другой фильтр или поисковый запрос.',
    'assetMention.empty': 'Сначала добавьте референс',
    'assetMention.choose': 'Куда вставить',
    'assetMention.insertReference': 'Вставить референс {{index}}',
    'projectExplorer.aria': 'Проводник проекта',
    'projectExplorer.nav': 'Навигация боковой панели проекта',
    'projectExplorer.findAssets': 'Найти материалы',
    'projectExplorer.categories': 'Категории',
    'projectExplorer.promptLibrary': 'Библиотека prompt',
    'projectExplorer.promptRail': 'Prompt',
    'projectExplorer.skillLibrary': 'Библиотека навыков',
    'projectExplorer.skillRail': 'Навыки',
    'projectExplorer.assetLibrary': 'Материалы',
    'projectExplorer.expandSidebar': 'Развернуть панель',
    'projectExplorer.collapseSidebar': 'Свернуть панель',
    'projectExplorer.webCapture': 'Захват из веба',
    'projectExplorer.webCaptureTitle': 'Открыть браузер для референсов: наведите на изображение и нажмите захват или перетащите его.',
    'projectExplorer.newCategory': 'Новая категория',
    'categoryTree.builtin.shots': 'Кадры',
    'categoryTree.builtin.cast': 'Персонажи',
    'categoryTree.builtin.scene': 'Сцены',
    'categoryTree.builtin.prop': 'Реквизит',
    'categoryTree.builtin.audio': 'Аудио',
    'categoryTree.customDefault': 'Новая категория',
    'categoryTree.copiedTo': 'Скопировано в {{target}}',
    'categoryTree.deleteCategory.title': 'Удалить категорию',
    'categoryTree.deleteCategory.message': 'Удалить "{{label}}"? Узлы переедут обратно в "{{fallback}}" и не потеряются.',
    'categoryTree.deleteNode.title': 'Удалить узел',
    'categoryTree.deleteNode.message': 'Удалить "{{label}}"? Копии в других категориях не пострадают.',
    'categoryTree.deleteGroup.title': 'Удалить группу',
    'categoryTree.deleteGroup.message': 'Удалить "{{name}}" и узлы внутри: {{count}}?',
    'categoryTree.confirmDelete': 'Удалить',
    'categoryTree.nodeName': 'Название узла',
    'categoryTree.groupColor': 'Цвет группы',
    'categoryTree.groupColorMessage': 'Введите CSS-значение цвета',
    'categoryTree.menu.newGroup': 'Новая группа',
    'categoryTree.menu.rename': 'Переименовать',
    'categoryTree.menu.deleteCategory': 'Удалить категорию',
    'categoryTree.menu.copy': 'Копировать',
    'categoryTree.menu.regenerateDerived': 'Перегенерировать копию',
    'categoryTree.menu.delete': 'Удалить',
    'categoryTree.menu.changeColor': 'Сменить цвет',
    'categoryTree.menu.ungroup': 'Разгруппировать',
    'categoryTree.menu.deleteWithNodes': 'Удалить с узлами',
    'categoryTree.emptyNodes': 'Узлов пока нет',
    'categoryItem.nameAria': 'Название категории',
    'groupItem.nameAria': 'Название группы',
    'groupItem.empty': 'Пустая группа',
    'nodeItem.derived': 'Создано от другого узла',
    'nodeItem.kind.text': 'Т',
    'nodeItem.kind.character': 'П',
    'nodeItem.kind.scene': 'С',
    'nodeItem.kind.image': 'И',
    'nodeItem.kind.keyframe': 'К',
    'nodeItem.kind.video': 'В',
    'nodeItem.kind.shot': 'Кд',
    'nodeItem.kind.output': 'О',
    'nodeItem.kind.panorama': 'Пн',
    'nodeItem.kind.default': 'У',
    'assetFinder.unstar': 'Снять отметку',
    'assetFinder.markMain': 'Отметить как главный кадр',
    'assetFinder.mainMark': 'Главный кадр',
    'assetFinder.zone.film': 'Ролик',
    'assetFinder.zone.reference': 'Референсы',
    'assetFinder.search': 'Искать материалы...',
    'assetFinder.starOnly': 'Только отмеченные',
    'assetFinder.aiGroupTitle': 'Прочитать prompt у несгруппированных кадров и разложить их по именованным группам через AI.',
    'assetFinder.aiGrouping': 'AI группирует...',
    'assetFinder.aiGroup': 'Разложить через AI несгруппированные кадры: {{count}}',
    'assetFinder.aiGroupSuccess': 'Разложено кадров: {{count}}, групп: {{groups}}',
    'assetFinder.aiGroupNone': 'Надежных групп не найдено. Всё оставлено без группировки.',
    'assetFinder.aiGroupFailed': 'AI-группировка не удалась',
    'assetFinder.textModelRequired': 'Сначала включите текстовую модель в настройке моделей',
    'assetFinder.empty.noFilm': 'Кадров ролика пока нет',
    'assetFinder.empty.noReference': 'Референсов пока нет',
    'assetFinder.empty.noMatch': 'Подходящих материалов нет',
    'assetFinder.empty.filterHint': 'Попробуйте другой поиск или отключите фильтр отмеченных.',
    'assetFinder.empty.filmHint': 'Созданные в генерации кадры появятся здесь автоматически.',
    'assetFinder.empty.referenceHint': 'Импортированные изображения и перетащенные референсы появятся здесь.',
    'assetFinder.ungrouped': 'Без группы',
    'workspaceFiles.title': 'Материалы',
    'workspaceFiles.listView': 'Список',
    'workspaceFiles.sort': 'Сортировать материалы',
    'workspaceFiles.sortAscending': 'По возрастанию',
    'workspaceFiles.sortDescending': 'По убыванию',
    'workspaceFiles.refresh': 'Обновить файлы проекта',
    'workspaceFiles.import': 'Импорт материалов',
    'workspaceFiles.importTitle': 'Скопировать локальные файлы в папку материалов проекта',
    'workspaceFiles.importing': 'Импортируем',
    'workspaceFiles.mediaTypes': 'Изображения, видео, аудио',
    'workspaceFiles.noProject': 'Откройте проект, чтобы увидеть файлы',
    'workspaceFiles.loading': 'Читаем файлы проекта...',
    'workspaceFiles.empty.title': 'Файлов пока нет',
    'workspaceFiles.empty.description': 'Нажмите "Импорт материалов" выше или перетащите файлы сюда.',
    'workspaceFiles.truncated': 'Файлов много. Показаны первые 500.',
    'workspaceFiles.readError': 'Не удалось прочитать папку проекта. Проверьте права доступа или откройте папку заново.',
    'filePreview.aria': 'Предпросмотр {{name}}',
    'filePreview.reveal': 'Открыть в Finder',
    'filePreview.close': 'Закрыть',
    'filePreview.unsupported': 'Предпросмотр этого формата пока не поддерживается',
    'filePreview.unsupportedHint': 'Откройте файл через "Открыть в Finder" выше.',
    'filePreview.loading': 'Загрузка...',
    'filePreview.readFailed': 'Не удалось прочитать: {{message}}',
    'activeSkill.title': 'Текущий навык · нажмите, чтобы сменить',
    'activeSkill.choose': 'Выберите навык сценария',
    'activeSkill.auto': 'Авто',
    'activeSkill.followMode': 'Следует режиму сценария ({{label}})',
    'activeSkill.playbookStages': 'playbook · этапов: {{count}}',
    'activeSkill.missingProviders': 'Не хватает моделей: {{providers}}. Генерация может застрять.',
    'activeSkill.connect': 'Подключить',
    'activeSkill.authorName': 'AI пишет навык',
    'activeSkill.authorTitle': 'Попросить AI написать навык',
    'activeSkill.authorDescription': 'Вставьте навык из другого инструмента, опишите задачу или приложите документы. AI перепишет это для Nomi.',
    'provider.text': 'Текст',
    'provider.image': 'Изображение',
    'provider.video': 'Видео',
    'richText.bold': 'Жирный',
    'richText.italic': 'Курсив',
    'richText.h1': 'Заголовок 1',
    'richText.h2': 'Заголовок 2',
    'richText.bulletList': 'Маркированный список',
    'richText.orderedList': 'Нумерованный список',
    'richText.blockquote': 'Цитата',
    'richText.undo': 'Отменить',
    'richText.redo': 'Повторить',
    'workbenchEditor.placeholder': 'Начните писать историю, сценарий или текст здесь... Выделите фрагмент и используйте действие сбоку, чтобы создать узел изображения или видео.',
    'workbenchEditor.toolbar': 'Панель текста',
    'workbenchEditor.aria': 'Редактор документа сценария',
    'textDocument.placeholder': 'Пишите текст здесь...',
    'textDocument.toolbar': 'Форматирование текста',
    'textDocument.drag': 'Перетащить текстовый узел',
    'textDocument.label': 'Текст',
    'attachment.remove': 'Удалить вложение',
    'attachment.uploadFailed': 'Загрузка не удалась',
    'attachment.rail': 'Добавленные вложения',
    'attachment.file': 'Файл',
    'staleConversation.divider': 'AI больше не помнит диалог выше',
    'canvas.navigation': 'Навигация холста',
    'canvas.zoom': 'Масштаб холста',
    'canvas.fitView': 'Вписать',
    'canvas.empty': 'Холст пуст',
    'canvas.resetView': 'Сбросить вид',
    'canvas.zoomPercent': 'Процент масштаба',
    'canvas.tidy': 'Упорядочить холст',
    'canvas.tidyTitle': 'Упорядочить холст: собрать разбросанные узлы одним нажатием · отмена через ⌘Z',
    'canvas.hideMinimap': 'Скрыть мини-карту',
    'canvas.showMinimap': 'Показать мини-карту',
    'canvas.minimapMinimum': 'Мини-карта появится после {{count}} узлов',
    'canvas.empty.title': 'Здесь пока нет: {{name}}',
    'canvas.empty.description': 'Добавьте первый узел, чтобы начать. Потом его можно двигать, группировать и копировать между категориями.',
    'canvas.empty.createAria': 'Создать узел: {{name}}',
    'canvas.empty.create': '+ Создать {{name}}',
    'canvas.category.shots': 'кадры',
    'canvas.category.cast': 'персонажи',
    'canvas.category.scene': 'сцены',
    'canvas.category.prop': 'реквизит',
    'canvas.category.audio': 'аудио',
    'canvas.category.node': 'узел',
    'canvas.gesture.aria': 'Подсказка жестов холста',
    'canvas.gesture.panKeys': 'Два пальца',
    'canvas.gesture.pan': 'Перемещение',
    'canvas.gesture.zoomKeys': '⌘ + колесо',
    'canvas.gesture.zoom': 'Масштаб',
    'canvas.gesture.selectKeys': 'Пустое место',
    'canvas.gesture.select': 'Выделение',
    'canvas.gesture.dismiss': 'Понятно, закрыть подсказку жестов',
    'canvas.selection.aria': 'Действия с выделением',
    'canvas.selection.count': 'Выбрано: {{count}}',
    'canvas.selection.generateTitle': 'Сгенерировать выбранные узлы. Референсы идут первыми, кадры после них; недостающие референсы будут показаны.',
    'canvas.selection.generate': 'Сгенерировать {{count}}',
    'canvas.selection.ungroup': 'Разгруппировать (⇧⌘G)',
    'canvas.selection.group': 'Создать группу (⌘G)',
    'canvas.selection.clear': 'Снять выделение',
    'canvas.focusNodeMissing': 'Исходный узел больше не существует',
    'canvas.import.none': 'Нет материалов для импорта на холст',
    'canvas.import.one': 'Импортировано на холст',
    'canvas.import.many': 'Импортировано материалов на холст: {{count}}',
    'inlineParams.configureModel': 'Настроить модели',
    'inlineParams.openModelSetup': 'Открыть настройку моделей',
    'inlineParams.configure': 'Настроить →',
    'inlineParams.booleanOn': 'Вкл',
    'inlineParams.booleanOff': 'Выкл',
    'inlineParams.model': 'Модель',
    'inlineParams.selectModel': 'Выбрать модель',
    'inlineParams.variant': 'Вариант',
    'inlineParams.more': 'Еще',
    'inlineParams.provider': 'Провайдер',
    'modeBar.generationMode': 'Способ генерации',
    'nodeComposer.promptPicker.aria': 'Prompt из материалов',
    'nodeComposer.promptPicker.empty': 'В материалах пока нет доступных prompt',
    'nodeComposer.promptPicker.open': 'Открыть prompt из материалов',
    'nodeComposer.promptPicker.title': 'Prompt из материалов',
    'nodeComposer.promptPicker.button': 'Prompt',
    'nodeComposer.textMode.aria': 'Режим генерации',
    'nodeComposer.textMode.append': 'Продолжить',
    'nodeComposer.textMode.rewrite': 'Переписать',
    'nodeComposer.textMode.replace': 'Заменить',
    'nodeComposer.textMode.appendPlaceholder': 'Инструкция для продолжения... (оставьте пустым, чтобы продолжить напрямую)',
    'nodeComposer.textMode.rewritePlaceholder': 'Инструкция для переписывания... (сначала выделите текст в документе)',
    'nodeComposer.textMode.replacePlaceholder': 'Инструкция для замены... (заменит весь документ)',
    'nodeComposer.disabled.videoNeedsReference': 'Сначала добавьте референс: перетащите, подключите или нажмите +',
    'nodeComposer.disabled.videoNeedsFirstFrame': 'Сначала подключите изображение как первый кадр',
    'nodeComposer.disabled.imageNeedsReference': 'Для image-to-image нужен референс: перетащите, подключите или нажмите +, либо вернитесь к text-to-image',
    'nodeComposer.disabled.imageNeedsReferenceDetailed': 'Для image-to-image нужен референс. Подключите изображение, добавьте референс или вернитесь к text-to-image.',
    'nodeComposer.disabled.unsupported': 'Тип "{{kind}}" пока не поддерживает прямую генерацию',
    'nodeComposer.generating': 'Генерация...',
    'nodeComposer.generateReferencesFirst': 'Сначала сгенерировать референсы, затем этот кадр',
    'nodeComposer.regenerate': 'Перегенерировать',
    'nodeComposer.generate': 'Генерировать',
    'nodeComposer.generateAsset': 'Генерировать материал',
    'nodeComposer.uploadingLabel': 'Загрузка',
    'nodeComposer.uploading': 'Загружаем...',
    'nodeComposer.dropReference': 'Отпустите, чтобы добавить как референс',
    'nodeRecoverable.aria': 'Задача могла завершиться у провайдера, результат можно подтянуть заново',
    'nodeRecoverable.title': 'Задача могла завершиться у провайдера',
    'nodeRecoverable.description': 'Ожидание превысило лимит, но провайдер мог всё же сделать результат. Подтяните его отсюда, без ручной загрузки из кабинета.',
    'nodeRecoverable.recover': 'Подтянуть результат',
    'nodeRecoverable.recovering': 'Подтягиваем...',
    'nodeRecoverable.markFailed': 'Отметить как ошибку',
    'aiHeader.conversationHistory': 'История диалогов',
    'assistantModel.aria': 'Модель ассистента',
    'assistantModel.title': 'Модель для ассистента. Лучше выбрать GPT / Claude / DeepSeek-класс: они стабильнее выполняют действия на холсте.',
    'assetTile.addReference': 'Добавить референс',
    'resultDownload.defaultVideoName': 'Видео',
    'resultDownload.defaultImageName': 'Изображение',
    'resultDownload.success': 'Сохранено локально',
    'resultDownload.failed': 'Скачать не удалось',
    'imageTransform.rotateLeft': 'Повернуть влево на 90°',
    'imageTransform.rotateRight': 'Повернуть вправо на 90°',
    'imageTransform.flipHorizontal': 'Отразить по горизонтали',
    'imageTransform.flipVertical': 'Отразить по вертикали',
    'imageEdit.aria': 'Действия с изображением',
    'imageEdit.makeup': 'Зафиксировать образ',
    'imageEdit.makeupTitle': 'Создать новый узел с заполненным prompt идентичности персонажа или сцены на основе этой картинки. Автогенерации не будет.',
    'imageEdit.aiEdit': 'AI-правка',
    'imageEdit.decomposing': 'Разбираем',
    'imageEdit.decomposeLayers': 'Разобрать элементы на редактируемые слои',
    'imageEdit.textEdit': 'Изменить текст, сохранив шрифт',
    'imageEdit.crop': 'Обрезать',
    'imageEdit.cropTitle': 'Обрезать через рамку, добавить в стопку и сделать главным изображением',
    'imageEdit.removingBackground': 'Удаляем фон',
    'imageEdit.removeBackground': 'Убрать фон',
    'imageEdit.removeBackgroundTitle': 'Удалить фон, добавить в стопку и сделать главным изображением',
    'imageEdit.gridSplit': 'Разрезать',
    'imageEdit.grid2': 'Четыре вида (2x2)',
    'imageEdit.grid3': 'Сетка 3x3',
    'imageEdit.transform': 'Преобразовать',
    'imageEdit.whiteboard': 'Доска',
    'imageEdit.whiteboardTitle': 'Редактировать на доске с автоматическим импортом текущей картинки',
    'imageEdit.download': 'Скачать',
    'imageEdit.downloadTitle': 'Скачать / сохранить локально',
    'imageEdit.defaultImage': 'Изображение',
    'imageEdit.decomposedElements': 'Разобранные элементы',
    'imageEdit.progress.decode': 'Читаем изображение',
    'imageEdit.progress.inference': 'Ищем объект',
    'imageEdit.progress.mask': 'Строим прозрачную маску',
    'imageEdit.progress.encode': 'Экспортируем прозрачный PNG',
    'imageEdit.progress.model': 'Загружаем модель вырезки',
    'imageEdit.progress.removing': 'Удаляем фон',
    'imageEdit.removeBackgroundFailed': 'Не удалось убрать фон. Проверьте сеть и попробуйте снова.',
    'assistantMessage.processing': 'Обработка',
    'assistantMessage.stopped': 'Остановлено',
    'conversation.new': 'Новый диалог',
    'conversation.savedToHistory': 'Текущий сохранится в историю',
    'conversation.delete': 'Удалить этот диалог',
    'conversation.justNow': 'Только что',
    'conversation.minutesAgo': '{{count}} мин назад',
    'conversation.hoursAgo': '{{count}} ч назад',
    'conversation.yesterday': 'Вчера',
    'resultToolbar.aria': 'Действия с результатом',
    'videoToolbar.aria': 'Действия с видео',
    'videoToolbar.extracting': 'Извлекаем...',
    'videoToolbar.extractFirst': 'Первый кадр',
    'videoToolbar.extractFirstTitle': 'Извлечь первый кадр в отдельный узел изображения для первого кадра или референса',
    'videoToolbar.extractLast': 'Последний кадр',
    'videoToolbar.extractLastTitle': 'Извлечь последний кадр в отдельный узел изображения для последнего кадра, эстафеты или референса',
    'node.toast.generateBeforeTimeline': 'Сначала сгенерируйте этот узел, затем добавьте его на таймлайн.',
    'node.connection.to': 'Подключить к этому узлу',
    'node.connection.from': 'Начать соединение от этого узла',
    'node.panoramaActions': 'Действия с панорамой',
    'node.panoramaPreview': 'Предпросмотр панорамы',
    'node.panoramaReupload': 'Загрузить заново',
    'node.independentCopy': 'Независимая копия',
    'node.sourceMissing': 'Исходный узел больше не существует',
    'node.locateSource': 'Показать исходный узел: {{label}}',
    'node.independentCopyFromCategory': 'Независимая копия из {{category}} · {{label}}',
    'node.independentCopyFrom': 'Независимая копия из {{label}}',
    'node.independentCopySourceMissing': 'Независимая копия; исходный узел больше не существует',
    'node.provenance': 'Запись генерации / Provenance',
    'canvasToolbar.aria': 'Панель холста генерации',
    'canvasToolbar.addMenu': 'Меню добавления узла',
    'canvasToolbar.addNode': 'Добавить узел: {{label}}',
    'canvasNodeKind.text': 'Текст',
    'canvasNodeKind.image': 'Изображение',
    'canvasNodeKind.video': 'Видео',
    'canvasNodeKind.audio': 'Аудио',
    'canvasNodeKind.model3d': '3D-модель',
    'canvasNodeKind.whiteboard': 'Доска',
    'canvasNodeKind.panorama': 'Панорама',
    'canvasNodeKind.scene3d': '3D-сцена',
    'canvasAssistant.launcher': 'Запуск AI генерации',
    'canvasAssistant.suffix': 'Генерация',
    'canvasAssistant.panel': 'AI-ассистент генерации',
    'canvasAssistant.dropTitle': 'Перетащите сюда вложения',
    'canvasAssistant.dropHint': 'Изображения / PDF / Word / Excel / txt · до 30MB на файл',
    'canvasAssistant.title': 'Ассистент генерации',
    'canvasAssistant.collapse': 'Свернуть AI',
    'canvasAssistant.sendMessage': 'Сообщение ассистенту генерации',
    'canvasAssistant.placeholder': 'Скажите, как собрать холст...',
    'canvasAssistant.addAttachment': 'Добавить вложение',
    'canvasAssistant.addAttachmentLong': 'Добавить вложение (можно перетащить или вставить)',
    'canvasAssistant.modeAria': 'Режим AI',
    'canvasAssistant.modeLeading': 'Режим',
    'canvasAssistant.mode.chat': 'Вопросы',
    'canvasAssistant.mode.refine': 'Улучшить',
    'canvasAssistant.stop': 'Остановить',
    'canvasAssistant.send': 'Отправить',
    'canvasAssistant.emptyTitle': 'Я помогу собрать холст',
    'canvasAssistant.emptyBody': 'Разложу кадры, улучшу prompt и соединю узлы. Генерация запускается кнопкой на самом узле.',
    'canvasAssistant.suggestion.shots': 'Разложи 3 кадра на холсте',
    'canvasAssistant.suggestion.prompt': 'Напиши prompt для выбранного кадра',
    'canvasAssistant.suggestion.connect': 'Соедини кадры по порядку',
    'canvasAssistant.reject': 'Отклонить',
    'canvasAssistant.confirm': 'Подтвердить',
    'assistantError.provider': 'Провайдер: {{message}}',
    'assistantError.retry': 'Повторить',
    'assistantError.modelSetup': 'Открыть модели',
    'assistantError.technicalDetails': 'Технические детали',
    'noTextModel.readyTitle': 'Текстовая модель готова',
    'noTextModel.readyBody': 'В настройках моделей появился пункт "Текст". Теперь можно делить на кадры и общаться. Отправьте сообщение ещё раз.',
    'noTextModel.title': 'Ассистенту нужен текстовый мозг',
    'noTextModel.bodyBefore': 'Вы подключили модели изображения / видео для картинки. Для диалога, сценария и разбивки на кадры нужна ',
    'noTextModel.bodyModel': 'текстовая модель',
    'noTextModel.bodyAfter': '.',
    'noTextModel.enable': 'Включить {{name}}',
    'noTextModel.settings': 'Открыть модели',
    'spend.agentDriven': 'Запущено AI-ассистентом (MCP) · подтвердите расход',
    'spend.autoIgnore': 'Авто-игнор через {{seconds}}s',
    'spend.suppressSession': 'Больше не спрашивать в этой сессии',
    'spend.ignore': 'Игнорировать',
    'spend.cancel': 'Отмена',
    'spend.confirmGenerate': 'Подтвердить генерацию',
    'nodeError.aria': 'Генерация не удалась: {{reason}}',
    'nodeError.provider': 'Ответ провайдера: ',
    'nodeError.retry': 'Повторить генерацию',
    'nodeError.copy': 'Копировать детали',
    'nodeError.copied': 'Скопировано',
    'nodeError.technicalDetails': 'Технические детали',
    'creationAssistant.aria': 'AI-зона сценария',
    'creationAssistant.title': 'Ассистент сценария',
    'creationAssistant.expand': 'Развернуть чат',
    'creationAssistant.shrink': 'Уменьшить',
    'creationAssistant.expandAria': 'Развернуть ассистента сценария',
    'creationAssistant.shrinkAria': 'Уменьшить ассистента сценария',
    'creationAssistant.collapse': 'Свернуть ассистента сценария',
    'creationAssistant.emptyTitle': 'Нужна искра?',
    'creationAssistant.emptyBody': 'Скажите AI, что хотите написать, и он предложит начало.',
    'creationAssistant.suggestion.opening': 'Дай мне начало',
    'creationAssistant.suggestion.visual': 'Сделай этот текст визуальнее',
    'creationAssistant.suggestion.storyboard': 'Преврати это в сценарий раскадровки',
    'creationAssistant.emptyContent': '(Пусто)',
    'creationAssistant.reject': 'Отклонить',
    'creationAssistant.apply': 'Применить',
    'creationAssistant.placeholder': 'Разбей на кадры, сделай видео, создай карточку персонажа или спроси что угодно...',
    'creationAssistant.inputAria': 'Ввод для AI сценария',
    'creationAssistant.modeAria': 'Режим сценария',
    'creationAssistant.write.insert': 'Вставить в курсор',
    'creationAssistant.write.replace': 'Заменить выделение',
    'creationAssistant.write.append': 'Добавить в конец',
    'creationAssistant.callFailed': 'Вызов AI сценария не удался',
    'creationAssistant.defaultStoryboardPrompt': '🎬 Разбить на кадры',
    'creationAssistant.defaultFixationPrompt': '🎭 Создать карточку персонажа',
    'creationAssistant.attachmentPrompt': 'Посмотри эти вложения',
    'creationAssistant.processCurrentDocument': '{{mode}}: обработать текущий документ',
    'creationAssistant.cancelled': '(Остановлено)',
    'creationAssistant.emptyResponse': '(Пустой ответ: AI не вернул текст)',
    'creationAssistant.truncated': '⚠️ Ответ может быть неполным: достигнут лимит вывода модели. При необходимости скажите "продолжи".',
    'creationAssistant.errorPrefix': '(Ошибка) {{message}}',
    'creationAssistant.needStoryForStoryboard': 'Сначала напишите историю слева, затем попросите AI разбить ее на кадры.',
    'creationAssistant.needScriptForFixation': 'Сначала напишите сценарий слева, затем попросите AI подготовить персонажей и сцены.',
    'creationAssistant.attachmentsUploading': 'Вложения еще загружаются. Подождите перед отправкой.',
    'creationAssistant.revisingPlan': 'Обновляем план по вашему запросу...',
    'creationAssistant.planningStoryboard': 'Разбиваем историю на кадры и собираем план...',
    'creationAssistant.planningStoryboardStream': 'Разбиваем на кадры...',
    'creationAssistant.planUpdated': 'План обновлен. Смотрите редактор ниже.',
    'creationAssistant.planReady': 'План раскадровки готов ниже. Откройте, отредактируйте и подтвердите перенос на холст.',
    'creationAssistant.storyboardFailed': 'Не удалось разбить на кадры: {{message}}',
    'creationAssistant.unknownError': 'Неизвестная ошибка',
    'creationAssistant.fixationPlanning': 'Перешли в зону генерации. AI готовит персонажей и сцены по сценарию.',
    'cardCommon.cutout': 'Удаляем фон',
    'cardCommon.cutoutNode': 'Узел вырезки',
    'cardCommon.cutoutProgress': '{{title}} создаёт прозрачный PNG',
    'cardCommon.generating': 'Генерация',
    'cardCommon.upload': '+ Загрузить {{label}}',
    'cardCommon.node': 'Узел',
    'editableTitle.edit': 'Нажмите, чтобы изменить имя',
    'card.characterImage': 'Изображение персонажа',
    'card.sceneImage': 'Изображение сцены',
    'card.propImage': 'Изображение реквизита',
    'card.unnamedCharacter': 'Безымянный персонаж',
    'card.unnamedScene': 'Безымянная сцена',
    'card.unnamedProp': 'Безымянный реквизит',
    'card.ownerPrefix': 'Принадлежит {{name}}',
    'imageCrop.cancel': 'Отмена',
    'imageCrop.confirmCrop': 'Подтвердить обрезку',
    'imageCrop.confirmSplit': 'Подтвердить нарезку',
    'audio.noSubtitles': 'Нет текста для субтитров',
    'audio.subtitlesCopied': 'Субтитры скопированы (SRT, можно вставить как .srt)',
    'audio.copyTranscript': 'Копировать расшифровку',
    'audio.copy': 'Копировать',
    'audio.generateSubtitles': 'Создать субтитры',
    'audio.play': 'Воспроизвести',
    'audio.pause': 'Пауза',
    'audio.upload': 'Загрузить аудио',
    'audio.sound': 'Звук',
    'audio.uploadOrConnect': 'Загрузите или подключите аудио',
    'storyboard.action.storyboardLead': 'Похоже, вы хотите разбить историю на кадры.',
    'storyboard.action.storyboardCta': 'Разбить на кадры · положить на холст',
    'storyboard.action.fixationLead': 'Похоже, вы хотите создать карточку персонажа.',
    'storyboard.action.fixationCta': 'Создать карточку персонажа',
    'storyboard.action.modeAria': 'Тип раскадровки',
    'storyboard.action.imageMode': 'Картинки',
    'storyboard.action.videoMode': 'Видео',
    'storyboard.action.imageHint': 'Одна статичная картинка на кадр; потом можно перевести в видео',
    'storyboard.action.videoHint': 'Один видеофрагмент с длительностью на кадр',
    'storyboard.action.started': 'Запущено',
    'storyboard.plan.defaultTitle': 'План раскадровки',
    'storyboard.plan.meta': '{{shots}} кадров · {{anchors}} референсов · {{tail}}',
    'storyboard.plan.imageMode': 'картинки',
    'storyboard.plan.discardTitle': 'Удалить этот план?',
    'storyboard.plan.discardMessage': 'План и ваши правки будут очищены. Можно снова попросить AI разбить историю на кадры.',
    'storyboard.plan.discardConfirm': 'Удалить',
    'storyboard.plan.status.editing': 'Редактируется',
    'storyboard.plan.status.committed': 'На холсте',
    'storyboard.plan.status.draft': 'Черновик',
    'storyboard.plan.editingSummary': 'Редактируется в левом редакторе · кадров: {{count}}',
    'storyboard.plan.collapseCard': 'Свернуть карточку',
    'storyboard.plan.confirmInEditor': 'Подтвердите в редакторе, чтобы положить на холст',
    'storyboard.plan.committedSummary': 'Кадры созданы как узлы на холсте: {{count}}',
    'storyboard.plan.editAgain': 'Редактировать снова',
    'storyboard.plan.goGeneration': 'В генерацию',
    'storyboard.plan.emptyPrompt': '(Prompt пока не написан)',
    'storyboard.plan.moreShots': 'Ещё кадров: {{count}}',
    'storyboard.plan.openEdit': 'Открыть редактор',
    'storyboard.plan.discard': 'Удалить',
    'storyboard.editor.issue.noShots': 'Кадров пока нет',
    'storyboard.editor.issue.emptyShotPrompt': 'В кадре {{index}} нет prompt',
    'storyboard.editor.issue.danglingRef': 'В кадре {{index}} есть сломанный референс',
    'storyboard.editor.issue.anchorNoName': 'У одного референса нет имени',
    'storyboard.editor.landFailedTitle': 'Не удалось положить на холст',
    'storyboard.editor.unknownError': 'Неизвестная ошибка. Попробуйте ещё раз.',
    'storyboard.editor.titleAria': 'Название плана',
    'storyboard.editor.titlePlaceholder': 'Назовите план',
    'storyboard.editor.shotCount': '{{count}} кадров',
    'storyboard.editor.collapse': 'Свернуть',
    'storyboard.editor.discardPlan': 'Удалить план',
    'storyboard.editor.noticeLead': 'AI набросал, можно править свободно',
    'storyboard.editor.noticeTail': 'До подтверждения нет генерации и расходов',
    'storyboard.editor.anchorsTitle': 'Что должно совпадать между кадрами',
    'storyboard.editor.anchorsHint': 'Сгенерировать референс = зафиксировать вид · только prompt = добавить в каждый prompt',
    'storyboard.editor.noAnchors': 'Референсов пока нет. Добавьте один или сразу пишите кадры.',
    'storyboard.editor.addAnchor': 'Добавить референс (персонаж / сцена / реквизит / стиль)',
    'storyboard.editor.shotsTitle': 'Раскадровка · {{count}} кадров',
    'storyboard.editor.addShot': 'Добавить кадр',
    'storyboard.editor.issuesSummary': 'Нужно исправить: {{count}} · {{issue}}',
    'storyboard.editor.readySummary': 'Готово · референсов: {{anchors}} · кадров: {{shots}}',
    'storyboard.editor.landing': 'Кладём на холст...',
    'storyboard.editor.confirmLand': 'Положить на холст',
    'storyboard.shot.durationSeconds': '{{seconds}} сек',
    'storyboard.shot.defaultModel': 'Модель по умолчанию',
    'storyboard.shot.index': 'Кадр {{index}}',
    'storyboard.shot.kindAria': 'Тип кадра',
    'storyboard.shot.kindLeading': 'Тип',
    'storyboard.shot.image': 'Картинка',
    'storyboard.shot.video': 'Видео',
    'storyboard.shot.durationAria': 'Длительность',
    'storyboard.shot.durationLeading': 'Длина',
    'storyboard.shot.imageModel': 'Модель картинки',
    'storyboard.shot.videoModel': 'Модель видео',
    'storyboard.shot.modelLeading': 'Модель',
    'storyboard.shot.provider': 'Провайдер',
    'storyboard.shot.delete': 'Удалить кадр',
    'storyboard.shot.references': 'Референсы',
    'storyboard.shot.unnamed': 'Без имени',
    'storyboard.shot.removeReference': 'Убрать референс {{name}}',
    'storyboard.shot.danglingTitle': 'Референс сломан. Нажмите, чтобы убрать.',
    'storyboard.shot.danglingLabel': 'Сломанный референс',
    'storyboard.shot.danglingWarning': 'Некоторые привязанные референсы удалены. Уберите сломанные метки или добавьте референсы заново выше.',
    'storyboard.anchor.kindSwitchAria': 'Тип: {{kind}}. Нажмите, чтобы сменить.',
    'storyboard.anchor.kindSwitchTitle': 'Сменить тип',
    'storyboard.anchor.kind.character': 'Персонаж',
    'storyboard.anchor.kind.scene': 'Сцена',
    'storyboard.anchor.kind.prop': 'Реквизит',
    'storyboard.anchor.kind.style': 'Стиль',
    'storyboard.anchor.namePlaceholder': 'Назовите',
    'storyboard.anchor.nameAria': 'Имя референса',
    'storyboard.anchor.editDescription': 'Редактировать описание',
    'storyboard.anchor.delete': 'Удалить референс',
    'storyboard.anchor.descriptionAria': 'Описание референса',
    'storyboard.anchor.visualPlaceholder': 'Внешность, одежда, свет: описание референса для модели изображения',
    'storyboard.anchor.textPlaceholder': 'Черты, которые можно описать словами: палитра, брендовые цвета, одежда. Добавится в каждый связанный кадр.',
    'storyboard.anchor.collapse': 'Свернуть',
    'storyboard.anchor.carrier.visualTitle': 'Переключить на только prompt',
    'storyboard.anchor.carrier.textTitle': 'Переключить на генерацию референса',
    'storyboard.anchor.carrier.visual': 'Референс',
    'storyboard.anchor.carrier.text': 'Текст',
    'browserAsset.open': 'Открыть папку ассетов',
    'browserAsset.dialog': 'Папка ассетов',
    'browserAsset.title': 'Ассеты',
    'browserAsset.source.aria': 'Источник ассетов',
    'browserAsset.source.my': 'Ассеты проекта',
    'browserAsset.source.transcript': 'Библиотека prompt',
    'browserAsset.tab.all': 'Все',
    'browserAsset.tab.image': 'Изображения',
    'browserAsset.tab.video': 'Видео',
    'browserAsset.tab.prompt': 'Prompt',
    'browserAsset.tab.folder': 'Папки',
    'browserAsset.capture.off': 'Выключить сбор ресурсов',
    'browserAsset.capture.on': 'Включить сбор ресурсов',
    'browserAsset.capture.offTitle': 'Выключить сбор ресурсов',
    'browserAsset.capture.onTitle': 'Сбор ресурсов: наведите на ресурс и нажмите Ctrl+C, чтобы сохранить',
    'browserAsset.promptSettings': 'Настройки извлечения prompt',
    'browserAsset.dock.restore': 'Вернуть плавающую папку ассетов',
    'browserAsset.dock.right': 'Прикрепить справа',
    'browserAsset.dock.restoreTitle': 'Вернуть плавающее окно',
    'browserAsset.dock.rightTitle': 'Прикрепить справа',
    'browserAsset.minimize': 'Свернуть папку ассетов',
    'browserAsset.search': 'Искать ассеты',
    'browserAsset.upload': 'Загрузить ассет',
    'browserAsset.newFolder': 'Новая папка',
    'browserAsset.moreTools': 'Еще инструменты ассетов',
    'browserAsset.toggleLayout': 'Переключить вид ассетов',
    'browserAsset.sort.oldest': 'Сначала старые',
    'browserAsset.sort.newest': 'Сначала новые',
    'browserAsset.filterCategories': 'Фильтр категорий',
    'browserAsset.fileInput': 'Выбрать файлы ассетов',
    'browserAsset.parentFolder': 'Вернуться в папку выше',
    'browserAsset.breadcrumb': 'Путь папки',
    'browserAsset.promptMasonry': 'Мозаика библиотеки prompt',
    'browserAsset.list': 'Список ассетов',
    'browserAsset.grid': 'Сетка ассетов',
    'browserAsset.dropToSave': 'Отпустите, чтобы сохранить в ассеты',
    'browserAsset.assetActions': 'Действия с ассетами',
    'browserAsset.importCanvas': 'Импортировать на холст',
    'browserAsset.delete': 'Удалить',
    'browserAsset.blankActions': 'Действия в пустой области',
    'browserAsset.filter.dialog': 'Фильтр категорий ассетов',
    'browserAsset.filter.show': 'Показать',
    'browserAsset.filter.showAll': 'Показать все',
    'browserAsset.filter.categoryAria': 'Категории ассетов',
    'browserAsset.promptCategory.dialog': 'Фильтр категорий prompt',
    'browserAsset.promptCategory.title': 'Категории prompt',
    'browserAsset.promptCategory.aria': 'Категории prompt',
    'browserAsset.promptCategory.placeholder': 'Введите название категории',
    'browserAsset.promptCategory.confirm': 'Подтвердить категорию prompt',
    'browserAsset.promptCategory.add': 'Добавить категорию',
    'browserAsset.promptCategory.image': 'Prompt для изображений',
    'browserAsset.promptCategory.video': 'Prompt для видео',
    'browserAsset.status.downloading': 'Загрузка...',
    'browserAsset.status.importUnavailable': 'Не удалось импортировать веб-ассет',
    'browserAsset.status.downloadFailed': 'Загрузка не удалась',
    'browserAsset.status.folder': 'Папка',
    'browserAsset.status.saveFailed': 'Не удалось сохранить',
    'browserAsset.status.saving': 'Сохранение...',
    'browserAsset.status.localText': 'Локальный текст',
    'browserAsset.status.localImport': 'Локальный импорт',
    'browserAsset.status.extracting': 'Извлечение...',
    'browserAsset.status.extractFailed': 'Извлечение не удалось',
    'browserAsset.newFolderTitle': 'Новая папка',
    'browserAsset.newFolderTitleIndexed': 'Новая папка {{index}}',
    'browserAsset.unnamedAsset': 'Безымянный ассет',
    'browserAsset.source.capture': 'Сбор с веб-страницы',
    'browserAsset.source.drag': 'Перетаскивание из браузера',
    'browserAsset.empty.noMatch.title': 'Подходящих ассетов нет',
    'browserAsset.empty.noMatch.description': 'Попробуйте другую категорию или запрос.',
    'browserAsset.empty.folder.title': 'Папка пока пустая',
    'browserAsset.empty.folder.description': 'Перетащите ассеты сюда или переместите выбранные.',
    'browserAsset.empty.prompt.title': 'Prompt пока нет',
    'browserAsset.empty.prompt.description': 'Prompt, извлечённые из браузерных картинок или скриншотов, появятся здесь.',
    'browserAsset.empty.assets.title': 'Ассетов пока нет',
    'browserAsset.empty.assets.description': 'Загрузите локальные файлы или соберите картинки и видео в браузере.',
    'browserAsset.type.folder': 'Папка',
    'browserAsset.type.image': 'Изображение',
    'browserAsset.type.video': 'Видео',
    'browserAsset.type.prompt': 'Prompt',
    'browserPrompt.mode.replicate': 'Повторить кадр',
    'browserPrompt.mode.style': 'Визуальный стиль',
    'browserPrompt.detail.aria': 'Детали prompt',
    'browserPrompt.detail.title': 'Детали prompt',
    'browserPrompt.detail.close': 'Закрыть детали prompt',
    'browserPrompt.detail.referenceImages': 'Референсные изображения',
    'browserPrompt.detail.prompt': 'Prompt',
    'browserPrompt.detail.model': 'Модель',
    'browserPrompt.detail.currentTextModel': 'Текущая текстовая модель',
    'browserPrompt.detail.copied': 'Скопировано',
    'browserPrompt.detail.copy': 'Копировать',
    'browserPrompt.card.extracting': 'Анализируем референс и извлекаем prompt...',
    'browserPrompt.card.extractFailed': 'Не удалось извлечь prompt',
    'browserPrompt.card.empty': 'Prompt пока нет',
    'browserPrompt.error.noReference': 'Нет референса для анализа',
    'browserPrompt.error.noVisionModel': 'Сначала включите текстовую модель с поддержкой изображений в настройках моделей',
    'browserPrompt.error.noPromptReturned': 'Модель не вернула prompt',
    'browserPrompt.error.noUsablePrompt': 'Модель не вернула пригодный prompt',
    'browserPrompt.settings.aria': 'Настройки извлечения prompt',
    'browserPrompt.settings.title': 'Настройки извлечения prompt',
    'browserPrompt.settings.subtitle': 'Сохраняется в текущем проекте: .nomi/browser-prompt-extraction.json',
    'browserPrompt.settings.close': 'Закрыть настройки извлечения prompt',
    'browserPrompt.settings.default': 'По умолчанию',
    'browserPrompt.settings.addCustom': 'Добавить свой',
    'browserPrompt.settings.name': 'Название',
    'browserPrompt.settings.prompt': 'Prompt',
    'browserPrompt.settings.projectAvailable': 'Настройки переедут вместе с папкой проекта',
    'browserPrompt.settings.projectUnavailable': 'Папка текущего проекта недоступна, сохранить не получится',
    'browserPrompt.settings.resetDefault': 'Вернуть стандартный',
    'browserPrompt.settings.delete': 'Удалить',
    'browserPrompt.settings.cancel': 'Отмена',
    'browserPrompt.settings.save': 'Сохранить',
    'browserPrompt.settings.untitledTemplate': 'Безымянный шаблон',
    'browserDialog.aria': 'Браузер',
    'browserDialog.loading': 'Загрузка...',
    'browserDialog.newTab': 'Новая вкладка',
    'browserDialog.closeNamedTab': 'Закрыть {{title}}',
    'browserDialog.closeBrowser': 'Закрыть браузер',
    'browserDialog.back': 'Назад',
    'browserDialog.forward': 'Вперед',
    'browserDialog.reload': 'Обновить',
    'browserDialog.addressPlaceholder': 'Введите URL или поисковый запрос',
    'browserDialog.addressAria': 'Адресная строка',
    'browserDialog.saveBookmark': 'Сохранить закладку',
    'browserDialog.materialSites': 'Сайты с материалами',
    'browserDialog.materialSitesList': 'Список сайтов с материалами',
    'browserDialog.screenshotPrompt': 'Извлечь prompt из скриншота',
    'browserDialog.menuHint': 'Откройте меню правым кликом по вкладке или закладке',
    'browserDialog.webContent': 'Веб-содержимое',
    'browserDialog.emptyTitle': 'Открыть веб-референс',
    'browserDialog.emptyDescription': 'Введите URL напрямую или поищите в Bing',
    'browserDialog.startSearch': 'Искать в Bing или ввести URL',
    'browserDialog.open': 'Открыть',
    'browserDialog.commonSites': 'Частые сайты для референсов',
    'browserDialog.promptModePicker': 'Выберите способ извлечения prompt',
    'browserDialog.video': 'Видео',
    'browserDialog.tabMenu': 'Меню вкладки {{title}}',
    'browserDialog.bookmarkMenu': 'Меню закладки {{title}}',
    'browserDialog.bookmarked': 'В закладках',
    'browserDialog.bookmark': 'В закладки',
    'browserDialog.closeTab': 'Закрыть вкладку',
    'browserDialog.closeAll': 'Закрыть все',
    'browserDialog.rename': 'Переименовать',
    'browserDialog.delete': 'Удалить',
    'browserDialog.defaultBookmark.nomi': 'Сайт Nomi',
    'browserDialog.promptMode.replicateDescription': 'Повторить объект, композицию, свет и детали',
    'browserDialog.promptMode.styleDescription': 'Извлечь цвет, шрифты, композицию и эффекты в JSON',
    'browserDialog.siteHint.visual': 'Визуальное вдохновение',
    'browserDialog.siteHint.designPortfolio': 'Дизайн-портфолио',
    'browserDialog.siteHint.ui': 'UI-вдохновение',
    'browserDialog.siteHint.conceptArt': 'Концепт-арт',
    'browserDialog.siteHint.chineseDiscovery': 'Китайские находки',
    'browserDialog.siteHint.videoReference': 'Видео-референсы',
    'browserDialog.siteHint.filmFrames': 'Кадры из фильмов',
    'browserDialog.siteHint.creatorUpdates': 'Новости авторов',
    'browserDialog.limitTabs': 'Можно открыть не больше {{limit}} вкладок',
    'browserDialog.createViewFailed': 'Не удалось создать окно браузера',
    'browserDialog.renameBookmarkPrompt': 'Переименовать закладку',
    'browserDialog.noPromptImages': 'Не нашли изображение для извлечения prompt.',
    'browserDialog.promptEntryFailed': 'Не удалось открыть извлечение prompt из изображения',
    'browserDialog.textSelectionSaveFailed': 'Не удалось сохранить выделенный текст страницы',
    'browserDialog.textPromptSaved': 'Сохранено в библиотеку prompt в ассетах',
    'browserDialog.screenshotNeedsPage': 'Сначала откройте страницу, потом извлекайте prompt из скриншота.',
    'browserDialog.selectionUnsupported': 'Этот браузер не поддерживает скриншот выделенной области.',
    'browserDialog.selectionFailed': 'Не удалось сделать скриншот выделенной области',
    'browserDialog.screenshotStyleTitle': 'Стиль выделения на странице',
    'browserDialog.screenshotPromptTitle': 'Prompt выделения на странице',
    'browserDialog.captureNeedsPage': 'Сначала откройте страницу, потом используйте сбор ресурсов.',
    'browserDialog.captureHoverHint': 'Сначала наведите мышь на картинку или видео, затем нажмите Ctrl+C, чтобы сохранить.',
    'browserDialog.captureFailed': 'Не удалось собрать веб-ассет',
    'browserDialog.webVideo': 'Веб-видео',
    'browserDialog.webImage': 'Веб-изображение',
    'tool.camera.title': 'Камера',
    'tool.camera.tooltip': 'Движение камеры: создать серый reference без сборки 3D-сцены',
    'tool.camera.subtitle': '3D-сцена не нужна',
    'tool.camera.typeAria': 'Тип движения камеры',
    'tool.camera.speed': 'Скорость',
    'tool.camera.shot': 'Крупность',
    'tool.camera.layerSoonTitle': 'Вторая камера будет позже',
    'tool.camera.addLayer': 'Добавить слой',
    'tool.camera.comingSoon': 'Скоро',
    'tool.camera.readout': '{{move}} · {{speed}} · {{duration}}s → серый reference автоматически подключится к video_ref',
    'tool.camera.apply': 'Применить',
    'tool.camera.toastCreated': 'Создано движение камеры "{{move}} · {{speed}} · {{duration}}s". Рендерим вне экрана и подключаем как reference этого кадра.',
    'tool.camera.move.push_in': 'Наезд',
    'tool.camera.move.pull_out': 'Отъезд',
    'tool.camera.move.orbit_left': 'Облёт влево',
    'tool.camera.move.orbit_right': 'Облёт вправо',
    'tool.camera.move.crane_up': 'Подъём',
    'tool.camera.move.crane_down': 'Спуск',
    'tool.camera.move.track_left': 'Трек влево',
    'tool.camera.move.track_right': 'Трек вправо',
    'tool.camera.move.arc_left': 'Дуга влево',
    'tool.camera.move.arc_right': 'Дуга вправо',
    'tool.camera.move.zoom_in': 'Зум ближе',
    'tool.camera.move.zoom_out': 'Зум дальше',
    'tool.camera.move.dolly_zoom': 'Dolly zoom',
    'tool.camera.speed.slow': 'Медленно',
    'tool.camera.speed.medium': 'Средне',
    'tool.camera.speed.fast': 'Быстро',
    'tool.camera.shot.wide': 'Дальний',
    'tool.camera.shot.medium': 'Средний',
    'tool.camera.shot.close': 'Крупный',
    'tool.promptOptimizer.apply': 'Применить к prompt',
    'tool.promptOptimizer.rerun': 'Оптимизировать снова',
    'tool.promptOptimizer.resultHeader': 'Версия Nomi (подсветка = изменения)',
    'tool.promptOptimizer.ideaHeader': 'Скажите, что улучшить',
    'tool.promptOptimizer.running': 'Оптимизация...',
    'tool.promptOptimizer.placeholder': 'Например: сделать закат, усилить напряжение, добавить немного тумана... (можно оставить пустым)',
    'tool.promptOptimizer.ideaAria': 'Идея оптимизации',
    'tool.promptOptimizer.run': 'Оптимизировать этот prompt',
    'tool.promptOptimizer.aria': 'Оптимизировать prompt с Nomi',
    'tool.promptOptimizer.title': 'Оптимизировать prompt с Nomi',
    'tool.promptOptimizer.buttonIdle': 'Оптимизировать',
    'tool.promptOptimizer.noTextModel': 'Сначала включите текстовую модель в настройке моделей',
    'tool.promptOptimizer.emptyResult': 'Оптимизированный результат не пришел. Попробуйте снова.',
    'tool.promptOptimizer.failed': 'Оптимизация не удалась',
    'tool.convertShot.badge': 'Кадр {{index}}',
    'tool.convertShot.aria': 'Сделать из этой картинки видео-кадр с ней как первым кадром',
    'tool.convertShot.title': 'В видео-кадр · эта картинка будет первым кадром',
    'tool.convertShot.button': 'В видео',
    'tool.convertShot.already': 'Этот кадр уже переведен в видео, он выбран',
    'tool.convertShot.created': 'Создан видео-кадр · эта картинка стала первым кадром',
    'tool.panorama.enterAria': 'Открыть панорамный просмотр',
    'tool.panorama.enter': 'Открыть панораму',
    'tool.panorama.dialog': 'Панорамный просмотр',
    'tool.panorama.upload': '+ Загрузить панораму',
    'tool.panorama.notReady': 'Панорама еще не готова. Попробуйте чуть позже.',
    'tool.panorama.screenshotFailed': 'Не удалось сделать скриншот. Попробуйте снова.',
    'tool.panorama.screenshotTitle': 'Скриншот панорамы',
    'tool.panorama.screenshotPrompt': 'Скриншот рамки панорамы',
    'tool.panorama.screenshotCreated': 'Создан узел скриншота панорамы',
    'tool.panorama.screenshotCapturing': 'Делаем скриншот...',
    'tool.panorama.screenshotCapturingShort': 'Скриншот',
    'tool.panorama.screenshotFrame': 'Рамка скриншота',
    'tool.panorama.empty': 'Загрузите панораму или подключите узел изображения',
    'tool.panorama.closePreview': 'Закрыть просмотр',
    'tool.provenance.aria': 'Provenance генерации',
    'tool.provenance.title': 'Запись генерации · {{name}}',
    'tool.provenance.close': 'Закрыть',
    'tool.provenance.empty': 'У этого узла нет отслеживаемой записи генерации.',
    'tool.provenance.possibleReasons': 'Возможные причины:',
    'tool.provenance.reasonLegacy': 'Узел из проекта до v0.4.0; provenance появился в v0.5',
    'tool.provenance.reasonLocal': 'Ассет импортирован локально и не был создан AI',
    'tool.provenance.reasonFailed': 'Вызов генерации не удался, provenance не записан',
    'tool.provenance.provider': 'Провайдер',
    'tool.provenance.model': 'Модель',
    'tool.provenance.time': 'Время',
    'tool.provenance.emptyPrompt': '(пусто)',
    'tool.provenance.copyPrompt': 'Копировать prompt',
    'tool.provenance.params': 'Параметры',
    'tool.provenance.regenerate': 'Сгенерировать снова с теми же параметрами',
    'whiteboard.title': 'Доска',
    'whiteboard.close': 'Закрыть',
    'whiteboard.closeAria': 'Закрыть доску',
    'whiteboard.saveMain': 'Сохранить как главное изображение',
    'whiteboard.screenshotCreateNode': 'Скриншот и новый узел изображения',
    'whiteboard.boardNotReady': 'Холст еще не готов',
    'whiteboard.imageNodeMissing': 'Узел изображения не найден',
    'whiteboard.screenshotSaveFailed': 'Не удалось сохранить скриншот доски. Попробуйте позже.',
    'whiteboard.saveMainSuccess': 'Сохранено как главное изображение',
    'whiteboard.saveFailed': 'Не удалось сохранить доску',
    'whiteboard.screenshotCreated': 'Создан узел скриншота доски',
    'whiteboard.screenshotFailed': 'Не удалось сделать скриншот доски',
    'whiteboard.aspectTitle': 'Пропорции доски',
    'whiteboard.ratio': 'Пропорции',
    'whiteboard.aspectSelect': 'Выбрать пропорции доски',
    'whiteboard.library.dragAdd': 'Перетащите на доску, чтобы добавить',
    'whiteboard.library.title': 'Библиотека ассетов',
    'whiteboard.library.board': 'Доска',
    'whiteboard.library.results': 'Результаты',
    'whiteboard.library.dragCopy': 'Перетащите на доску, чтобы скопировать',
    'whiteboard.library.emptyBoard': 'Здесь появятся результаты узлов изображений с доски',
    'whiteboard.library.emptyResults': 'Здесь появятся результаты подключённых узлов изображений',
    'whiteboard.removeBgProcessing': 'Удаляем фон',
    'whiteboard.fullscreen': 'На весь экран',
    'whiteboard.exitFullscreen': 'Выйти из полного экрана',
    'whiteboard.importImage': 'Импортировать изображение',
    'whiteboard.customBrushColor': 'Свой цвет кисти',
    'whiteboard.colorAria': 'Цвет {{color}}',
    'whiteboard.deleteSelected': 'Удалить выбранный элемент',
    'whiteboard.imageReadFailed': 'Не удалось прочитать изображение',
    'whiteboard.selectImageFile': 'Выберите файл изображения',
    'whiteboard.importFailed': 'Не удалось импортировать изображение',
    'whiteboard.removeBgSuccess': 'Заменено результатом вырезки',
    'whiteboard.removeBgFailed': 'Вырезка не удалась. Проверьте сеть и попробуйте снова.',
    'whiteboard.leaferAria': 'Доска Leafer',
    'whiteboard.drawingLayerAria': 'Слой рисования',
    'whiteboard.tool.brush': 'Кисть',
    'whiteboard.tool.select': 'Выбор',
    'whiteboard.tool.eraser': 'Ластик',
    'whiteboard.tool.shape': 'Фигура',
    'whiteboard.open': 'Открыть доску',
    'whiteboard.openHint': 'Нажмите, чтобы открыть доску',
    'whiteboard.screenshotTitle': 'Скриншот {{name}}',
    'whiteboard.imageResult': 'Результат изображения',
    'whiteboard.importedImage': 'Импортированное изображение',
    'whiteboard.originalImage': 'Исходное изображение',
    'whiteboard.material': 'Ассет',
    'whiteboard.resultImage': 'Картинка результата',
    'whiteboard.copySuffix': 'копия',
    'whiteboard.backgroundLayer': 'Фон',
    'whiteboard.layerOne': 'Слой 1',
    'whiteboard.hideItem': 'Скрыть {{name}}',
    'whiteboard.showItem': 'Показать {{name}}',
    'promptLibrary.source.aria': 'Источник prompt',
    'promptLibrary.source.mine': 'Моя библиотека',
    'promptLibrary.source.nomi': 'Подборка Nomi',
    'promptLibrary.category.aria': 'Фильтр типа prompt',
    'promptLibrary.category.all': 'Все',
    'promptLibrary.title': 'Библиотека prompt',
    'promptLibrary.close': 'Закрыть библиотеку prompt',
    'promptLibrary.search': 'Искать prompt...',
    'promptLibrary.new': 'Новый',
    'promptLibrary.noMatch.title': 'Подходящих prompt нет',
    'promptLibrary.noMatch.description': 'Попробуйте другой фильтр или запрос.',
    'promptLibrary.loading': 'Загружаем prompt из публичной библиотеки...',
    'promptLibrary.fetchEmpty.title': 'Не удалось загрузить prompt',
    'promptLibrary.retry': 'Повторить',
    'promptLibrary.dialog.aria': 'Библиотека prompt',
    'promptLibrary.sentToCanvas': 'Отправлено на холст · узел {{kind}}',
    'promptLibrary.canvasNode': 'Раскадровка',
    'promptLibrary.videoNode': 'Видео',
    'promptLibrary.deleted': 'Удалено из моей библиотеки · {{title}}',
    'promptComposer.editTitle': 'Редактировать prompt',
    'promptComposer.newTitle': 'Новый prompt',
    'promptComposer.typeAria': 'Тип prompt',
    'promptComposer.titlePlaceholder': 'Название (необязательно, например Силуэт на закате)',
    'promptComposer.promptPlaceholder': 'Вставьте prompt, который хорошо сработал...',
    'promptComposer.emptyError': 'Prompt не может быть пустым',
    'promptComposer.saveError': 'Не удалось сохранить',
    'promptComposer.cancel': 'Отмена',
    'promptComposer.save': 'Сохранить',
    'promptComposer.saveToMine': 'Сохранить в мою библиотеку',
    'promptCard.mine': 'Мое',
    'promptCard.edit': 'Редактировать',
    'promptCard.delete': 'Удалить',
    'promptPreview.noMedia': 'У этого prompt нет обложки',
    'promptPreview.close': 'Закрыть',
    'promptPreview.copy': 'Скопировать prompt',
    'promptPreview.copied': 'Скопировано',
    'promptPreview.send': 'На холст',
    'promptPreview.sent': 'Отправлено',
    'promptPreview.source': 'Источник',
    'promptPreview.localOnly': 'Моя библиотека · только локально',
    'skillLibrary.source.aria': 'Источник навыков',
    'skillLibrary.source.mine': 'Мои навыки',
    'skillLibrary.source.builtin': 'Встроенные Nomi',
    'skillLibrary.authorName': 'AI пишет навык',
    'skillLibrary.title': 'Библиотека навыков',
    'skillLibrary.close': 'Закрыть библиотеку навыков',
    'skillLibrary.search': 'Искать навыки...',
    'skillLibrary.importFile': 'Импорт файла',
    'skillLibrary.newAi': 'Создать с AI',
    'skillLibrary.newAiCompact': 'AI создать',
    'skillLibrary.newTile': 'Создать с AI',
    'skillLibrary.dialog.aria': 'Библиотека навыков',
    'skillLibrary.exportFailed': 'Не удалось экспортировать: навык не найден',
    'skillLibrary.deleteFailed': 'Не удалось удалить',
    'skillLibrary.deleted': 'Удалено · {{name}}',
    'skillLibrary.importInvalid': 'Не удалось импортировать: это невалидный пакет навыка (ошибка JSON)',
    'skillLibrary.importSuccess': 'Импортировано · {{name}}',
    'skillLibrary.newSkill': 'Новый навык',
    'skillLibrary.importFailed': 'Не удалось импортировать: {{message}}',
    'skillLibrary.importReadFailed': 'Не удалось импортировать: файл не читается',
    'skillLibrary.noMatch.title': 'Подходящих навыков нет',
    'skillLibrary.noMine.title': 'У вас пока нет своих навыков',
    'skillLibrary.noBuiltin.title': 'Встроенных навыков нет',
    'skillLibrary.noMatch.description': 'Попробуйте другой поисковый запрос.',
    'skillLibrary.noMine.description': 'Нажмите "Создать с AI", чтобы AI помог написать навык, или импортируйте чужой пакет.',
    'skillCard.playbookStageCount': 'playbook · {{count}} этапов',
    'skillCard.assistant': 'Ассистент',
    'skillCard.noDescription': 'Описания пока нет',
    'skillCard.useInCreation': 'Использовать в сценарии',
    'skillCard.exportAria': 'Экспортировать {{name}}',
    'skillCard.exportTooltip': 'Экспортировать пакет навыка',
    'skillCard.deleteAria': 'Удалить {{name}}',
    'skillCard.deleteTooltip': 'Удалить навык',
    'skillCard.builtinReadonly': 'Встроенный · только чтение',
    'creation.aria': 'Рабочая область сценария',
    'creation.expandAssistant': 'Открыть помощника сценария',
    'creation.aiSuffix': 'Сценарий',
    'onboardingChecklist.triggerAria': 'Гайд: 4 шага, выполнено {{done}} / {{total}}',
    'onboardingChecklist.shortTitle': 'Гайд',
    'onboardingChecklist.title': 'Гайд: 4 шага',
    'onboardingChecklist.collapse': 'Свернуть',
    'onboardingChecklist.openHandbook': 'Открыть руководство',
    'onboardingChecklist.dismiss': 'Больше не показывать',
    'onboardingChecklist.step.model.label': 'Подключите модель',
    'onboardingChecklist.step.model.hint': 'Подключите один AI-сервис своим ключом.',
    'onboardingChecklist.step.storyboard.label': 'Разбейте сцену на кадры',
    'onboardingChecklist.step.storyboard.hint': 'Попросите область сценария разбить историю на кадры и положить их на холст.',
    'onboardingChecklist.step.generated.label': 'Создайте изображение',
    'onboardingChecklist.step.generated.hint': 'Выберите модель в карточке кадра и запустите генерацию.',
    'onboardingChecklist.step.exported.label': 'Экспортируйте ролик',
    'onboardingChecklist.step.exported.hint': 'Разложите кадры на таймлайне и экспортируйте MP4 сверху справа.',
    'journey.finale.aria': 'Обучение завершено',
    'journey.finale.title': 'Это весь процесс. Теперь ваша очередь.',
    'journey.finale.body': 'От одной фразы до готового ролика, каждый шаг виден. Хотите пройти это со своей историей?',
    'journey.finale.startReal': 'Попробовать свою историю',
    'journey.finale.browse': 'Сначала осмотреться',
    'journey.stepLabel': 'Шаг {{current}}/{{total}}',
    'journey.done': 'Готово',
    'journey.next': 'Дальше',
    'journey.autoplay': 'Автовоспроизведение',
    'journey.skip': 'Пропустить',
    'journey.write.title': '1. Все начинается с одной фразы',
    'journey.write.body': 'Напишите историю в области сценария, и AI будет помогать с черновиком слово за словом.',
    'journey.split.title': '2. AI разбивает историю на кадры',
    'journey.split.body': 'Он также держит вместе персонажей, сцены и повторяющиеся детали между кадрами.',
    'journey.canvas.title': '3. Разложите все на холсте',
    'journey.canvas.body': 'Каждый кадр становится карточкой, все видно и можно редактировать.',
    'journey.character.title': 'Один и тот же человек в каждом кадре',
    'journey.character.body': 'Карточка идентичности фиксирует лицо, чтобы ребенок и маленький робот не менялись от кадра к кадру.',
    'journey.staging.title': 'Кто где стоит',
    'journey.staging.body': 'Задайте расстановку в 3D, и AI будет следовать ей, например для двух героев на крыше.',
    'journey.trajectory.title': 'Нужно движение камеры',
    'journey.trajectory.body': 'Нарисуйте траекторию камеры, и AI повторит движение, например медленный отъезд на закате.',
    'journey.generate.title': 'Вот готовая генерация',
    'journey.generate.body': 'Демо уже сгенерировано. В своей работе нажимайте генерацию на карточках кадров.',
    'journey.captions.title': 'Разложите по таймлайну',
    'journey.captions.body': 'Добавьте субтитры и титры, затем настройте ритм.',
    'journey.export.title': 'Заберите готовый ролик',
    'journey.export.body': 'Экспортируйте MP4 одним нажатием, и процесс завершен.',
    'handbook.dialog.aria': 'Руководство по началу работы',
    'handbook.close': 'Закрыть руководство',
    'modelSetup.dialog.aria': 'Настройка моделей',
    'modelSetup.title': 'Настройка моделей',
    'modelSetup.capabilityIntro': 'Сейчас можно генерировать',
    'modelSetup.kind.image': 'Изображения',
    'modelSetup.kind.video': 'Видео',
    'modelSetup.kind.text': 'Текст',
    'modelSetup.kind.audio': 'Озвучку',
    'modelSetup.kind.model3d': '3D',
    'modelSetup.kind.notConnected': 'Не подключено',
    'modelSetup.loading': 'Загрузка...',
    'modelSetup.connected': 'Подключено',
    'modelSetup.available': 'Доступно',
    'modelSetup.modelsAvailable': '{{count}} моделей доступно',
    'modelSetup.modelsEnabled': '{{enabled}} / {{total}} моделей включено',
    'modelSetup.configured': 'Настроено',
    'modelSetup.recommended': 'Рекомендуется',
    'modelSetup.connectGenerationModels': 'Подключить модели генерации',
    'modelSetup.addModelRelay': 'Добавить модель / relay',
    'modelSetup.addModelRelayHint': 'new-api может подтянуть изображения, видео и текст сразу · также подходят официальные провайдеры и свои API',
    'modelSetup.localComfyui': 'Есть локальный ComfyUI?',
    'modelSetup.dreaminaMember': 'Есть подписка Dreamina?',
    'modelSetup.connectAssistantOptional': 'Подключить coding assistant · опционально',
    'modelSetup.deleteModel.title': 'Удалить модель',
    'modelSetup.deleteModel.message': 'Удалить "{{name}}"? Это нельзя отменить. Чтобы снова использовать модель, ее придется подтянуть заново.',
    'modelSetup.deleteModel.confirm': 'Удалить',
    'modelSetup.deleteModel.error': 'Не удалось удалить',
    'modelSetup.actionFailed': 'Действие не удалось',
    'modelSetup.card.connected': 'Подключено',
    'modelSetup.card.todo': 'Не подключено',
    'modelPicker.back': 'Назад',
    'modelPicker.title': 'Выберите модели для добавления',
    'modelPicker.refetch': 'Загрузить снова',
    'modelPicker.sourceFetched': '{{source}}{{host}}{{total}}',
    'modelPicker.fetchedCount': 'загружено: {{count}}',
    'modelPicker.searchPlaceholder': 'Поиск model id...',
    'modelPicker.selectedCount': 'Выбрано {{count}}',
    'modelPicker.selectedTotal': ' / всего {{total}}',
    'modelPicker.clear': 'Очистить',
    'modelPicker.emptyNoModels': 'Этот адрес не вернул список моделей. Добавьте model id ниже.',
    'modelPicker.emptyNoMatch': 'Подходящих моделей нет',
    'modelPicker.unselectGroup': 'Снять группу',
    'modelPicker.selectGroup': 'Выбрать группу',
    'modelPicker.manualPlaceholder': 'Введите model id, которого нет в списке, и нажмите Enter',
    'modelPicker.add': 'Добавить',
    'modelPicker.cancel': 'Отмена',
    'modelPicker.addModels': 'Добавить моделей: {{count}}',
    'vendorCard.defaultCredentialPlaceholder': 'Вставьте API key (sk-...)',
    'vendorCard.missingMultiCredential': 'Заполните все поля выше.',
    'vendorCard.missingApiKey': 'Сначала вставьте API key.',
    'vendorCard.unlockFailed': 'Не удалось открыть доступ: {{message}}',
    'vendorCard.unlock': 'Подключить',
    'vendorCard.cancel': 'Отмена',
    'vendorCard.defaultCredentialHint': 'Достаточно ввести один раз. Ключ шифруется локально и используется только при запросах.',
    'vendorCard.credentialSaved': 'Данные сохранены',
    'vendorCard.change': 'Сменить',
    'vendorCard.disconnect': 'Отключить',
    'vendorCard.disconnectTitle': 'Отключить провайдера',
    'vendorCard.disconnectMessage': 'Отключить "{{name}}"? Эти модели вернутся в статус "не подключено", и ключ придется ввести заново.',
    'vendorCard.disconnectFailed': 'Не удалось отключить: {{message}}',
    'vendorCard.invalidBaseUrl': 'Адрес должен начинаться с http(s)://.',
    'vendorCard.saveFailed': 'Не удалось сохранить: {{message}}',
    'vendorCard.save': 'Сохранить',
    'vendorCard.baseUrl': 'Адрес: {{baseUrl}}',
    'vendorCard.editBaseUrl': 'Изменить адрес {{name}}',
  },
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined || value === null ? match : String(value)
  })
}

export function translate(locale: SupportedLocale, key: TranslationKey, params?: TranslationParams): string {
  const template = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key
  return interpolate(template, params)
}
