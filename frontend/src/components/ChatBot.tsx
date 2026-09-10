import { useState, useRef, useEffect, useCallback } from 'react'
import YantraLogo from './YantraLogo'
import { streamChat } from '../api/client'

type Message = { from: 'bot' | 'user'; text: string }

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'bot',
      text: 'Namaste! I am the YantraGen Bot. Ask me about any yantra, the history of Jantar Mantar, the geometry, or how to use this app.',
    },
  ])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const botAccum = useRef<Message | null>(null)
  const msgRef = useRef<Message[]>([])
  msgRef.current = messages

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, thinking])

  const pushMessage = useCallback((m: Message) => {
    botAccum.current = null
    setMessages((prev) => [...prev, m])
  }, [])

  const send = async () => {
    const q = message.trim()
    if (!q || thinking) return

    // Build the history from the latest messages, omitting previous technical errors.
    const prior = msgRef.current.filter(
      (m) => m.from === 'user' || !m.text.startsWith('⚠'),
    )
    const history = prior
      .slice(0, -1)
      .map((m) => ({ role: m.from === 'user' ? ('user' as const) : ('assistant' as const), content: m.text }))

    setMessage('')
    setError(null)
    setMessages((prev) => [...prev, { from: 'user', text: q }])
    setThinking(true)

    const controller = new AbortController()
    abortRef.current = controller

    let acc = ''
    try {
      await streamChat(
        [...history, { role: 'user', content: q }],
        (delta) => {
          acc += delta
          if (!botAccum.current) {
            botAccum.current = { from: 'bot', text: '' }
            setMessages((prev) => [...prev, botAccum.current as Message])
          }
          botAccum.current.text = acc
          setMessages((prev) => {
            const copy = prev.slice()
            copy[copy.length - 1] = { from: 'bot', text: acc }
            return copy
          })
        },
        controller.signal,
      )
    } catch (e) {
      setError((e as Error).message)
      pushMessage({ from: 'bot', text: `⚠ ${(e as Error).message}` })
    } finally {
      setThinking(false)
      abortRef.current = null
      botAccum.current = null
    }
  }

  return (
    <div className={`chatbot ${open ? 'chatbot-open' : ''}`}>
      {open && (
        <div className="chatbot-window" role="dialog" aria-label="YantraGen chat">
          <div className="chatbot-head">
            <YantraLogo size={22} />
            <span>YantraGen Bot</span>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </div>
          <div className="chatbot-body" ref={bodyRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-${m.from}`}>
                {m.text}
              </div>
            ))}
            {thinking && <div className="chat-msg chat-bot chat-thinking">Thinking…</div>}
            {error && !thinking && <div className="chat-msg chat-bot chat-error">⚠ {error}</div>}
          </div>
          <div className="chatbot-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about a yantra…"
            />
            <button className="chatbot-send" onClick={send} disabled={thinking || !message.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        className="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        title="Chat with YantraGen"
        aria-label="Open YantraGen chat"
      >
        <YantraLogo size={30} />
      </button>
    </div>
  )
}
