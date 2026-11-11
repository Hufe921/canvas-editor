import Editor, { PageMode, RowFlex } from '@canvas-editor'
import { CanvasEditorCollaboration } from './CanvasEditorCollaboration'
import { PresenceOverlay } from './PresenceOverlay'
import {
  WebSocketProvider,
  type ConnectionStatus
} from './WebSocketProvider'
import './style.css'

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!

const COLORS = ['#5b5bd6', '#d4380d', '#087f5b', '#0969da', '#a05a00', '#c2255c']
const NAMES = ['山茶', '青柠', '星河', '云朵', '松果', '海盐', '微风', '萤火']

function getOrCreateUser() {
  const storageKey = 'canvas-editor-collaboration-user'
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (saved?.name && saved?.color) return saved
  } catch {
    // 隐私模式下 localStorage 不可用时使用临时身份
  }
  const user = {
    name: `${NAMES[Math.floor(Math.random() * NAMES.length)]}${Math.floor(
      10 + Math.random() * 90
    )}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(user))
  } catch {
    // 临时身份不影响协同功能
  }
  return user
}

function getRoomName() {
  const room = new URLSearchParams(location.search).get('room') || 'demo'
  return /^[\w-]{1,64}$/.test(room) ? room : 'demo'
}

let toastTimer: ReturnType<typeof setTimeout>
function showToast(message: string) {
  const toast = $('#toast')
  toast.textContent = message
  toast.classList.add('toast--visible')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('toast--visible'), 2400)
}

const roomName = getRoomName()
const user = getOrCreateUser()
$('#room-input').setAttribute('value', roomName)
;($('#room-input') as HTMLInputElement).value = roomName
$('#current-user-avatar').style.backgroundColor = user.color
$('#current-user-avatar').textContent = user.name.slice(0, 1)
$('#current-user-name').textContent = user.name

const editor = new Editor(
  $('#editor'),
  [{ value: '\n' }],
  {
    width: 794,
    height: 920,
    pageMode: PageMode.CONTINUITY,
    margins: [88, 76, 88, 76],
    defaultSize: 16,
    defaultRowMargin: 1.5,
    scrollContainerSelector: '#editor-scroll',
    placeholder: {
      data: '开始输入，邀请其他人一起编辑……'
    }
  }
)
Reflect.set(window, '__CANVAS_EDITOR_INSTANCE__', editor)

const socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const provider = new WebSocketProvider(
  `${socketProtocol}://${location.host}/collaboration`,
  roomName
)
provider.awareness.setLocalState({ user, cursor: null })
const collaboration = new CanvasEditorCollaboration(editor, provider)
const presenceOverlay = new PresenceOverlay(
  editor,
  provider.doc,
  provider.awareness
)
Reflect.set(window, '__CANVAS_EDITOR_COLLABORATION__', collaboration)

const statusLabels: Record<ConnectionStatus, string> = {
  connecting: '正在连接',
  connected: '实时同步中',
  disconnected: '离线编辑'
}

function updateConnectionStatus(status: ConnectionStatus) {
  $('#connection-status').dataset.status = status
  $('#connection-text').textContent = statusLabels[status]
  $('#save-status').textContent =
    status === 'disconnected'
      ? '修改已保留，重连后自动合并'
      : status === 'connecting'
        ? '正在恢复文档'
        : `已同步到房间 ${roomName}`
}

provider.on('status', status => updateConnectionStatus(status as ConnectionStatus))
provider.on('error', error => {
  console.error('[collaboration]', error)
})

function renderMembers() {
  const states = [...provider.awareness.getStates().entries()]
    .map(([clientId, state]) => ({
      clientId,
      user: state.user as typeof user | undefined
    }))
    .filter(member => member.user)
    .sort(a => (a.clientId === provider.doc.clientID ? -1 : 1))
  $('#member-count').textContent = `${states.length}`
  $('#header-member-count').textContent = `${states.length} 人在线`
  const avatarFragment = document.createDocumentFragment()
  for (const member of states.slice(0, 3)) {
    const avatar = document.createElement('span')
    avatar.className = 'presence-avatar'
    avatar.style.backgroundColor = member.user!.color
    avatar.textContent = member.user!.name.slice(0, 1)
    avatar.title = member.user!.name
    avatarFragment.append(avatar)
  }
  if (states.length > 3) {
    const more = document.createElement('span')
    more.className = 'presence-avatar presence-avatar--more'
    more.textContent = `+${states.length - 3}`
    more.title = `还有 ${states.length - 3} 位协作者`
    avatarFragment.append(more)
  }
  $('#member-avatars').replaceChildren(avatarFragment)
  const fragment = document.createDocumentFragment()
  for (const member of states) {
    const row = document.createElement('div')
    row.className = 'member'
    const avatar = document.createElement('span')
    avatar.className = 'member__avatar'
    avatar.style.backgroundColor = member.user!.color
    avatar.textContent = member.user!.name.slice(0, 1)
    const name = document.createElement('span')
    name.className = 'member__name'
    name.textContent = member.user!.name
    if (member.clientId === provider.doc.clientID) {
      const self = document.createElement('span')
      self.className = 'member__self'
      self.textContent = '我'
      row.append(avatar, name, self)
    } else {
      row.append(avatar, name)
    }
    fragment.append(row)
  }
  $('#member-list').replaceChildren(fragment)
}

provider.awareness.on('change', renderMembers)
renderMembers()

let wordCountFrame = 0
function updateDocumentStatus() {
  if (wordCountFrame) return
  wordCountFrame = requestAnimationFrame(() => {
    wordCountFrame = 0
    void editor.command.getWordCount().then(count => {
      $('#word-count').textContent = `${count || 0} 字`
    })
    if (provider.synced) {
      $('#save-status').textContent = `已同步到房间 ${roomName}`
    }
  })
}

collaboration.onReady = updateDocumentStatus
collaboration.onLocalUpdate = updateDocumentStatus
collaboration.onRemoteUpdate = updateDocumentStatus

const undoButton = $<HTMLButtonElement>('#undo-button')
const redoButton = $<HTMLButtonElement>('#redo-button')
function updateUndoButtons() {
  undoButton.disabled = !collaboration.canUndo()
  redoButton.disabled = !collaboration.canRedo()
}
collaboration.onUndoStackChange = updateUndoButtons
undoButton.addEventListener('click', () => collaboration.undo())
redoButton.addEventListener('click', () => collaboration.redo())
updateUndoButtons()

$('#bold-button').addEventListener('click', () => editor.command.executeBold())
$('#italic-button').addEventListener('click', () => editor.command.executeItalic())
$('#underline-button').addEventListener('click', () =>
  editor.command.executeUnderline()
)
$<HTMLInputElement>('#color-input').addEventListener('input', event => {
  editor.command.executeColor((event.target as HTMLInputElement).value)
})
$<HTMLSelectElement>('#size-select').addEventListener('change', event => {
  editor.command.executeSize(Number((event.target as HTMLSelectElement).value))
})
document.querySelectorAll<HTMLButtonElement>('.align-button').forEach(button => {
  button.addEventListener('click', () => {
    editor.command.executeRowFlex(button.dataset.align as RowFlex)
  })
})

const imageInput = $<HTMLInputElement>('#image-input')
$('#image-button').addEventListener('click', () => imageInput.click())
imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    showToast('请选择不超过 5 MB 的图片')
    imageInput.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const value = reader.result as string
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 480 / image.naturalWidth)
      editor.command.executeImage({
        value,
        width: Math.round(image.naturalWidth * scale),
        height: Math.round(image.naturalHeight * scale)
      })
      imageInput.value = ''
    }
    image.onerror = () => {
      showToast('图片读取失败，请换一张图片')
      imageInput.value = ''
    }
    image.src = value
  }
  reader.onerror = () => {
    showToast('图片读取失败，请重试')
    imageInput.value = ''
  }
  reader.readAsDataURL(file)
})
$('#table-button').addEventListener('click', () => {
  editor.command.executeInsertTable(2, 2)
})

editor.listener.rangeStyleChange = style => {
  $('#bold-button').classList.toggle('tool-button--active', style.bold)
  $('#italic-button').classList.toggle('tool-button--active', style.italic)
  $('#underline-button').classList.toggle('tool-button--active', style.underline)
  if (style.color) $<HTMLInputElement>('#color-input').value = style.color
  $<HTMLSelectElement>('#size-select').value = `${style.size}`
  document.querySelectorAll<HTMLButtonElement>('.align-button').forEach(button => {
    button.classList.toggle(
      'tool-button--active',
      button.dataset.align === (style.rowFlex || RowFlex.LEFT)
    )
  })
}

$('#editor').addEventListener(
  'keydown',
  event => {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (key === 'z') {
      event.preventDefault()
      event.stopPropagation()
      if (event.shiftKey) collaboration.redo()
      else collaboration.undo()
    } else if (key === 'y') {
      event.preventDefault()
      event.stopPropagation()
      collaboration.redo()
    }
  },
  { capture: true }
)

$('#join-button').addEventListener('click', () => {
  const nextRoom = $<HTMLInputElement>('#room-input').value.trim()
  if (!/^[\w-]{1,64}$/.test(nextRoom)) {
    showToast('房间名仅支持 1–64 位字母、数字、下划线和连字符')
    return
  }
  const url = new URL(location.href)
  url.searchParams.set('room', nextRoom)
  location.href = url.toString()
})
$('#room-input').addEventListener('keydown', event => {
  if (event.key === 'Enter') $('#join-button').click()
})
$('#share-button').addEventListener('click', async () => {
  const url = new URL(location.href)
  url.searchParams.set('room', roomName)
  try {
    await navigator.clipboard.writeText(url.toString())
    showToast('邀请链接已复制')
  } catch {
    showToast('请复制浏览器地址栏中的链接')
  }
})

window.addEventListener('beforeunload', () => {
  presenceOverlay.destroy()
  collaboration.destroy()
  provider.destroy()
  editor.destroy()
})
