/**
 * 科大讯飞 实时语音转写 WebSocket API
 *
 * 前端直连方案 —— 在浏览器中通过 WebSocket 连接讯飞语音服务，
 * 无需后端中转。鉴权参数（APPID / APIKey / APISecret）通过
 * Vite 环境变量注入，仅存于构建产物，不会泄露到页面源码。
 *
 * 使用前请先在 client/ 下创建 .env.local 文件：
 *   VITE_XFYUN_APPID=你的APPID
 *   VITE_XFYUN_API_KEY=你的APIKey
 *   VITE_XFYUN_API_SECRET=你的APISecret
 *
 * 免费申请地址：https://www.xfyun.cn/services/voicedictation
 */

const IAT_URL = 'wss://iat-api.xfyun.cn/v2/iat'

// 从 Vite 环境变量读取
const APPID = import.meta.env.VITE_XFYUN_APPID || ''
const API_KEY = import.meta.env.VITE_XFYUN_API_KEY || ''
const API_SECRET = import.meta.env.VITE_XFYUN_API_SECRET || ''

console.log('[xfyunIAT] APPID:', APPID ? `${APPID.slice(0, 4)}...` : '(未配置)')

/**
 * 生成 WebSocket 鉴权 URL
 */
function getAuthUrl() {
  const url = new URL(IAT_URL)
  const host = url.host
  const path = url.pathname
  const date = new Date().toUTCString()

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`

  // 使用 SubtleCrypto 进行 HMAC-SHA256 签名
  const encoder = new TextEncoder()

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key =>
    crypto.subtle.sign('HMAC', key, encoder.encode(signatureOrigin))
  ).then(buffer => {
    const signature = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const authorization = btoa(
      `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    )
    return `${IAT_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`
  })
}

/**
 * 获取麦克风音频流，转为 PCM 16bit 16kHz 单声道
 */
async function getAudioStream() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      sampleRate: 16000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    }
  })

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 })
  const source = audioCtx.createMediaStreamSource(stream)
  const processor = audioCtx.createScriptProcessor(4096, 1, 1)

  return new Promise((resolve) => {
    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0)
      // Float32 -> Int16
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      resolve({ audioCtx, source, processor, stream, int16 })
    }
    source.connect(processor)
    processor.connect(audioCtx.destination)
  })
}

/**
 * 判断是否配置了讯飞凭证
 */
export function isXfyunConfigured() {
  return !!(APPID && API_KEY && API_SECRET)
}

/**
 * 启动语音识别
 *
 * @param {object} options
 * @param {function} options.onResult  - 收到识别结果时回调 (text: string, isFinal: boolean)
 * @param {function} options.onError    - 出错回调 (error: string)
 * @param {function} options.onVolume   - 音量回调 (volume: number 0~1)，可选
 * @returns {Promise<{ stop: () => void }>}  返回控制对象
 */
export async function startRecognition({ onResult, onError, onVolume }) {
  if (!isXfyunConfigured()) {
    onError('未配置科大讯飞凭证，请在 client/.env.local 中设置 VITE_XFYUN_APPID / API_KEY / API_SECRET')
    return { stop: () => {} }
  }

  let ws = null
  let audioCtx = null
  let source = null
  let processor = null
  let micStream = null
  let stopped = false
  let analyser = null
  let volumeRAF = null

  // 发送音频帧的闭包
  let sendAudio = null

  try {
    // 1. 建立鉴权 WebSocket 连接
    const authUrl = await getAuthUrl()
    ws = new WebSocket(authUrl)

    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = () => reject(new Error('WebSocket 连接失败'))
      setTimeout(() => reject(new Error('连接超时')), 10000)
    })

    if (stopped) {
      ws.close()
      return { stop: () => {} }
    }

    // 2. 获取麦克风
    const audio = await getAudioStream()
    audioCtx = audio.audioCtx
    source = audio.source
    processor = audio.processor
    micStream = audio.stream

    // 2.5 音量分析器
    if (onVolume) {
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.6
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (stopped) return
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
        const avg = sum / dataArray.length / 255
        onVolume(Math.min(avg * 2.5, 1)) // 放大系数让波形更明显
        volumeRAF = requestAnimationFrame(tick)
      }
      tick()
    }

    // 3. 构建首帧和后续帧的发送函数
    const base64Encode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))

    let isFirstFrame = true

    sendAudio = (int16Data) => {
      if (ws && ws.readyState === WebSocket.OPEN && !stopped) {
        const base64 = base64Encode(int16Data.buffer)
        const frame = {
          data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: base64 }
        }
        if (isFirstFrame) {
          // 首帧需要带 common 和 business
          frame.common = { app_id: APPID }
          frame.business = { language: 'zh_cn', domain: 'iat', accent: 'mandarin' }
          isFirstFrame = false
        }
        ws.send(JSON.stringify(frame))
      }
    }

    // 发送第一帧
    sendAudio(audio.int16)

    // 持续发送后续帧
    processor.onaudioprocess = (e) => {
      if (stopped) return
      const float32 = e.inputBuffer.getChannelData(0)
      const int16 = new Int16Array(float32.length)
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }
      sendAudio(int16)
    }

    // 4. 接收识别结果
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.code !== 0) {
          onError(`讯飞错误: ${msg.code} - ${msg.message}`)
          return
        }

        const data = msg.data
        if (!data || !data.result) return

        const result = data.result
        let text = ''
        let isFinal = data.status === 2 // status=2 表示最后一帧

        // 解析识别词
        const words = result.ws || []
        for (const w of words) {
          for (const c of w.cw || []) {
            text += c.w || ''
          }
        }

        if (text) {
          onResult(text, isFinal)
        }
      } catch {
        // 忽略非 JSON 消息
      }
    }

    ws.onerror = () => {
      if (!stopped) onError('WebSocket 连接断开')
    }

    ws.onclose = (e) => {
      if (!stopped) {
        onError(`连接关闭 (code=${e.code})`)
      }
    }

  } catch (err) {
    onError(err.message || '语音识别启动失败')
    cleanup()
  }

  function cleanup() {
    stopped = true
    if (volumeRAF) cancelAnimationFrame(volumeRAF)
    try { analyser?.disconnect() } catch {}
    try { processor?.disconnect() } catch {}
    try { source?.disconnect() } catch {}
    try { audioCtx?.close() } catch {}
    try { micStream?.getTracks().forEach(t => t.stop()) } catch {}
    if (ws && ws.readyState === WebSocket.OPEN) {
      // 发送结束帧
      try {
        ws.send(JSON.stringify({ data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } }))
      } catch {}
      setTimeout(() => { try { ws.close() } catch {} }, 500)
    }
  }

  return {
    stop() {
      cleanup()
    }
  }
}
