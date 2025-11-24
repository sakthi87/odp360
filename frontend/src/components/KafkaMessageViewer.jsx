import React from 'react'
import './KafkaMessageViewer.css'

const KafkaMessageViewer = ({ clusterId, topicName, messages, loading }) => {
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString()
  }

  const formatValue = (value) => {
    if (!value) return '(empty)'
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }

  if (loading) {
    return (
      <div className="kafka-message-viewer">
        <div className="viewer-header">
          <h3>Messages</h3>
        </div>
        <div className="loading-container">
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kafka-message-viewer">
      <div className="viewer-header">
        <h3>Messages</h3>
        <span className="message-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages. Click "Consume Messages" to fetch messages from the topic.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="message-item">
              <div className="message-header">
                <div className="message-meta">
                  <span className="message-partition">Partition: {message.partition}</span>
                  <span className="message-offset">Offset: {message.offset}</span>
                  <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                </div>
              </div>

              {message.key && (
                <div className="message-key">
                  <div className="message-label">Key:</div>
                  <pre>{message.key}</pre>
                </div>
              )}

              <div className="message-value">
                <div className="message-label">Value:</div>
                <pre>{formatValue(message.value)}</pre>
              </div>

              {message.headers && Object.keys(message.headers).length > 0 && (
                <div className="message-headers">
                  <div className="message-label">Headers:</div>
                  <div className="headers-list">
                    {Object.entries(message.headers).map(([key, value]) => (
                      <div key={key} className="header-item">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default KafkaMessageViewer

