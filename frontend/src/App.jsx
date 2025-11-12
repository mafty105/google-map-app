import { useState } from 'react'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Family Weekend Planner</h1>
        <p>週末のお出かけプランをAIがお手伝い</p>
      </header>

      <main className="app-main">
        <div className="chat-container">
          <div className="welcome-message">
            <h2>こんにちは！</h2>
            <p>週末のお出かけプランをお手伝いします。</p>
            <p>どのようなプランをお探しですか？</p>
          </div>

          {/* Chat interface will be implemented in Issue #9 */}
          <div className="coming-soon">
            <p>💬 Chat interface coming soon...</p>
            <p>🗺️ Google Maps integration coming soon...</p>
            <p>🤖 AI-powered planning coming soon...</p>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Powered by Google Vertex AI & Google Maps</p>
      </footer>
    </div>
  )
}

export default App
