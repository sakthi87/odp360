import React, { useState, useEffect, useMemo } from 'react'
import ResizablePanels from './ResizablePanels'
import TreeView from './TreeView'
import KafkaTopicDetails from './KafkaTopicDetails'
import KafkaMessageViewer from './KafkaMessageViewer'
import KafkaConnectionDialog from './KafkaConnectionDialog'
import {
  getKafkaClusters,
  getKafkaTopics,
  getKafkaTopicDetails,
  addKafkaConnection,
  testKafkaConnection,
  removeKafkaCluster
} from '../services/kafkaApi'
import './KafkaBrowser.css'

const KafkaBrowser = () => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [topicDetails, setTopicDetails] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
    setLoading(true)
    try {
      const clusters = await getKafkaClusters()
      const clusterNodes = clusters.map((cluster) => ({
        id: cluster.clusterId,
        type: 'cluster',
        label: cluster.name,
        bootstrapServers: cluster.bootstrapServers,
        clusterId: cluster.clusterId,
        status: cluster.status,
        children: [],
      }))
      setTreeData(clusterNodes)
    } catch (error) {
      console.error('Error loading Kafka clusters:', error)
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setExpandedNodes(new Set())
    await loadClusters()
    if (selectedNode && selectedNode.type === 'topic') {
      handleNodeSelect(selectedNode)
    }
  }

  const loadNodeChildren = async (node) => {
    if (node.type === 'cluster') {
      try {
        const topics = await getKafkaTopics(node.clusterId)
        return topics.map((topic) => ({
          id: `${node.clusterId}-${topic}`,
          type: 'topic',
          label: topic,
          clusterId: node.clusterId,
          topicName: topic,
          children: [],
        }))
      } catch (error) {
        console.error('Error loading topics:', error)
        return []
      }
    }
    return []
  }

  const handleNodeExpand = async (nodeId) => {
    if (expandedNodes.has(nodeId)) {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev)
        newSet.delete(nodeId)
        return newSet
      })
      return
    }

    const node = findNodeInTree(treeData, nodeId)
    if (!node || (node.children && node.children.length > 0)) {
      setExpandedNodes((prev) => new Set(prev).add(nodeId))
      return
    }

    const children = await loadNodeChildren(node)
    updateNodeChildren(nodeId, children)
    setExpandedNodes((prev) => new Set(prev).add(nodeId))
  }

  const findNodeInTree = (nodes, nodeId) => {
    for (const node of nodes) {
      if (node.id === nodeId) return node
      if (node.children) {
        const found = findNodeInTree(node.children, nodeId)
        if (found) return found
      }
    }
    return null
  }

  const updateNodeChildren = (nodeId, children) => {
    const updateNode = (nodes) => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, children }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    setTreeData(updateNode(treeData))
  }

  const handleNodeSelect = async (node) => {
    setSelectedNode(node)
    setMessages([])

    if (node.type === 'topic') {
      setLoadingDetails(true)
      setLoadingMessages(true)

      try {
        const details = await getKafkaTopicDetails(node.clusterId, node.topicName)
        setTopicDetails(details)
      } catch (error) {
        console.error('Error loading topic details:', error)
        setTopicDetails(null)
      } finally {
        setLoadingDetails(false)
        setLoadingMessages(false)
      }
    } else {
      setTopicDetails(null)
    }
  }

  const handleTestConnection = async (connectionRequest) => {
    setTestingConnection(true)
    try {
      const result = await testKafkaConnection(connectionRequest)
      return result
    } finally {
      setTestingConnection(false)
    }
  }

  const handleConnect = async (connectionRequest) => {
    setConnecting(true)
    try {
      const cluster = await addKafkaConnection(connectionRequest)
      await loadClusters()
      return cluster
    } catch (error) {
      console.error('Error adding connection:', error)
      throw error
    } finally {
      setConnecting(false)
    }
  }

  const handleRemoveCluster = async (clusterId) => {
    if (window.confirm('Are you sure you want to remove this cluster?')) {
      try {
        await removeKafkaCluster(clusterId)
        await loadClusters()
        if (selectedNode && selectedNode.clusterId === clusterId) {
          setSelectedNode(null)
          setTopicDetails(null)
          setMessages([])
        }
      } catch (error) {
        console.error('Error removing cluster:', error)
        alert('Failed to remove cluster')
      }
    }
  }

  const renderNode = (node) => {
    const getIcon = () => {
      switch (node.type) {
        case 'cluster':
          return '🖥️'
        case 'topic':
          return '📨'
        default:
          return '📄'
      }
    }

    return (
      <span className="tree-node-label">
        <span className="tree-node-icon">{getIcon()}</span>
        <span>{node.label}</span>
        {node.type === 'cluster' && node.bootstrapServers && (
          <span className="tree-node-meta"> ({node.bootstrapServers})</span>
        )}
        {node.type === 'cluster' && (
          <button
            className="remove-cluster-button"
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveCluster(node.clusterId)
            }}
            title="Remove cluster"
          >
            ×
          </button>
        )}
      </span>
    )
  }

  const treeDataWithSelection = useMemo(() => {
    const markSelection = (nodes) => {
      return nodes.map((node) => {
        const isSelected = selectedNode && node.id === selectedNode.id
        const isExpanded = expandedNodes.has(node.id)
        return {
          ...node,
          selected: isSelected,
          expanded: isExpanded,
          children: node.children ? markSelection(node.children) : undefined,
        }
      })
    }
    return markSelection(treeData)
  }, [treeData, selectedNode, expandedNodes])

  return (
    <div className="kafka-browser">
      <div className="browser-top-section">
        <ResizablePanels>
          {/* Left Panel - Kafka Clusters and Topics */}
          <div className="browser-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-buttons">
                <button
                  className="add-connection-button"
                  onClick={() => setConnectionDialogOpen(true)}
                  title="Add Connection"
                >
                  + Add Connection
                </button>
                <button
                  className="refresh-button"
                  onClick={handleRefresh}
                  title="Refresh"
                  disabled={loading}
                >
                  🔄
                </button>
              </div>
            </div>
            {loading ? (
              <div className="loading-container">
                <p>Loading clusters...</p>
              </div>
            ) : (
              <TreeView
                data={treeDataWithSelection}
                onNodeSelect={handleNodeSelect}
                onNodeExpand={handleNodeExpand}
                renderNode={renderNode}
                expandedNodes={expandedNodes}
              />
            )}
          </div>

          {/* Center Panel - Topic Details */}
          <div className="browser-center">
            {selectedNode?.type === 'topic' ? (
              <KafkaTopicDetails
                clusterId={selectedNode.clusterId}
                topicName={selectedNode.topicName}
                topicDetails={topicDetails}
                loading={loadingDetails}
                onConsumeMessages={(messages) => setMessages(messages)}
              />
            ) : (
              <div className="center-placeholder">
                <p>Select a topic to view details</p>
              </div>
            )}
          </div>

          {/* Right Panel - Messages */}
          <div className="browser-right">
            {selectedNode?.type === 'topic' ? (
              <KafkaMessageViewer
                clusterId={selectedNode.clusterId}
                topicName={selectedNode.topicName}
                messages={messages}
                loading={loadingMessages}
              />
            ) : (
              <div className="right-placeholder">
                <p>Select a topic to view messages</p>
              </div>
            )}
          </div>
        </ResizablePanels>
      </div>

      {/* Connection Dialog */}
      <KafkaConnectionDialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
        onTest={handleTestConnection}
        onConnect={handleConnect}
        testing={testingConnection}
        connecting={connecting}
      />
    </div>
  )
}

export default KafkaBrowser

