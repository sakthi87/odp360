import React, { useState } from 'react'
import { consumeKafkaMessages } from '../services/kafkaApi'
import './KafkaTopicDetails.css'

const KafkaTopicDetails = ({ clusterId, topicName, topicDetails, loading, onConsumeMessages }) => {
  const [consuming, setConsuming] = useState(false)
  const [consumeOptions, setConsumeOptions] = useState({
    partition: null,
    offset: null,
    maxMessages: 100,
    fromBeginning: false,
    offsetMode: 'latest', // 'latest', 'beginning', 'specific'
  })

  const handleConsume = async () => {
    setConsuming(true)
    try {
      console.log('Consuming messages with options:', {
        clusterId,
        topicName,
        consumeOptions
      })
      const requestPayload = {
        maxMessages: consumeOptions.maxMessages,
        partition: consumeOptions.partition !== null ? consumeOptions.partition : undefined,
        fromBeginning: consumeOptions.offsetMode === 'beginning',
        offset: consumeOptions.offsetMode === 'specific' && consumeOptions.offset !== null ? consumeOptions.offset : undefined,
      }
      
      const messages = await consumeKafkaMessages(clusterId, topicName, requestPayload)
      console.log('Received messages:', messages)
      if (Array.isArray(messages)) {
        onConsumeMessages(messages)
      } else {
        console.error('Invalid messages format:', messages)
        alert('Received invalid message format from server')
      }
    } catch (error) {
      console.error('Error consuming messages:', error)
      alert('Failed to consume messages: ' + (error.message || 'Unknown error'))
    } finally {
      setConsuming(false)
    }
  }

  if (loading) {
    return (
      <div className="kafka-topic-details">
        <div className="loading-container">
          <p>Loading topic details...</p>
        </div>
      </div>
    )
  }

  if (!topicDetails) {
    return (
      <div className="kafka-topic-details">
        <div className="empty-state">
          <p>No topic details available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="kafka-topic-details">
      <div className="topic-header">
        <h2>{topicName}</h2>
      </div>

      <div className="topic-info">
        <div className="info-item">
          <span className="info-label">Partitions:</span>
          <span className="info-value">{topicDetails.partitionCount}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Messages:</span>
          <span className="info-value">{topicDetails.totalMessages.toLocaleString()}</span>
        </div>
      </div>

      <div className="partitions-section">
        <h3>Partitions</h3>
        <div className="partitions-list">
          {topicDetails.partitions?.map((partition) => (
            <div key={partition.partition} className="partition-item">
              <div className="partition-header">
                <strong>Partition {partition.partition}</strong>
                <span className="partition-leader">Leader: {partition.leader}</span>
              </div>
              <div className="partition-offsets">
                <span>Beginning: {partition.beginningOffset.toLocaleString()}</span>
                <span>End: {partition.endOffset.toLocaleString()}</span>
                <span>Messages: {(partition.endOffset - partition.beginningOffset).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="consume-section">
        <h3>Consume Messages</h3>
        <div className="consume-options">
          <div className="option-group">
            <label>
              Partition:
              <input
                type="number"
                value={consumeOptions.partition !== null && consumeOptions.partition !== undefined ? consumeOptions.partition : ''}
                onChange={(e) => {
                  const value = e.target.value
                  setConsumeOptions({
                    ...consumeOptions,
                    partition: value === '' ? null : parseInt(value),
                  })
                }}
                placeholder="All partitions"
                min="0"
              />
              <small className="help-text">Leave empty for all partitions, or enter partition number (0, 1, 2, etc.)</small>
            </label>
          </div>

          <div className="option-group">
            <label>
              Max Messages:
              <input
                type="number"
                value={consumeOptions.maxMessages}
                onChange={(e) => setConsumeOptions({
                  ...consumeOptions,
                  maxMessages: parseInt(e.target.value) || 100,
                })}
                min="1"
                max="1000"
              />
              <small className="help-text">Maximum number of messages to retrieve (1-1000)</small>
            </label>
          </div>

          <div className="option-group">
            <label className="option-label">Start From:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="offsetMode"
                  value="latest"
                  checked={consumeOptions.offsetMode === 'latest'}
                  onChange={(e) => setConsumeOptions({
                    ...consumeOptions,
                    offsetMode: e.target.value,
                    fromBeginning: false,
                    offset: null,
                  })}
                />
                <span>Latest</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="offsetMode"
                  value="beginning"
                  checked={consumeOptions.offsetMode === 'beginning'}
                  onChange={(e) => setConsumeOptions({
                    ...consumeOptions,
                    offsetMode: e.target.value,
                    fromBeginning: true,
                    offset: null,
                  })}
                />
                <span>Beginning</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="offsetMode"
                  value="specific"
                  checked={consumeOptions.offsetMode === 'specific'}
                  onChange={(e) => setConsumeOptions({
                    ...consumeOptions,
                    offsetMode: e.target.value,
                    fromBeginning: false,
                  })}
                />
                <span>Specific Offset:</span>
              </label>
            </div>
            {consumeOptions.offsetMode === 'specific' && (
              <div className="offset-input-group">
                <input
                  type="number"
                  value={consumeOptions.offset !== null && consumeOptions.offset !== undefined ? consumeOptions.offset : ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setConsumeOptions({
                      ...consumeOptions,
                      offset: value === '' ? null : parseInt(value),
                    })
                  }}
                  placeholder="Enter offset number"
                  min="0"
                />
                <small className="help-text">Start reading from this specific offset number</small>
              </div>
            )}
          </div>

          <button
            className="consume-button"
            onClick={handleConsume}
            disabled={consuming}
          >
            {consuming ? 'Consuming...' : 'Consume Messages'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default KafkaTopicDetails

