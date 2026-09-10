import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last-resort guard so an unexpected render error shows a styled message
 * instead of unmounting the whole app into a blank page.
 */
export class CrashBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled render error:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="crash-boundary" role="alert">
        <div className="crash-boundary-card">
          <p className="crash-boundary-title">Something went wrong</p>
          <p className="crash-boundary-body">
            An unexpected error interrupted the experience. Try refreshing the
            page.
          </p>
          <pre className="crash-boundary-detail">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              this.setState({ error: null })
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}