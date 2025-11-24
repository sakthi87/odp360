import React, { useState, useEffect, useMemo } from 'react'
import TreeView from './TreeView'
import TableDetails from './TableDetails'
import TableRecords from './TableRecords'
import QueryBuilder from './QueryBuilder'
import ConnectionDialog from './ConnectionDialog'
import ResizablePanels from './ResizablePanels'
import { 
  getClusters, 
  getDatabases, 
  getTables, 
  getTableDetails, 
  getTableRecords,
  addConnection,
  testConnection,
  executeQuery
} from '../services/ysqlApi'
import './CassandraBrowser.css'

const YSQLBrowser = () => {
  const [selectedNode, setSelectedNode] = useState(null)
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const [tableDetails, setTableDetails] = useState(null)
  const [tableRecords, setTableRecords] = useState([])
  const [queryResults, setQueryResults] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300)
  const [isResizingBottom, setIsResizingBottom] = useState(false)
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // Load clusters on mount
  useEffect(() => {
    loadClusters()
  }, [])

  const loadClusters = async () => {
    setLoading(true)
    try {
      const clusters = await getClusters()
      const clusterNodes = clusters.map((cluster) => ({
        id: cluster.clusterId,
        type: 'cluster',
        label: cluster.name,
        host: cluster.datacenter || 'N/A',
        clusterId: cluster.clusterId,
        status: cluster.status,
        children: [],
      }))
      setTreeData(clusterNodes)
    } catch (error) {
      console.error('Error loading YSQL clusters:', error)
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh function to reload clusters and refresh tree
  const handleRefresh = async () => {
    setExpandedNodes(new Set())
    await loadClusters()
    if (selectedNode && selectedNode.type === 'table') {
      handleNodeSelect(selectedNode)
    }
  }

  // Load children when a node is expanded
  const loadNodeChildren = async (node) => {
    if (node.type === 'cluster') {
      try {
        const databases = await getDatabases(node.clusterId)
        return databases.map((database) => ({
          id: `${node.clusterId}-${database.name}`,
          type: 'database',
          label: database.name,
          clusterId: node.clusterId,
          databaseName: database.name,
          owner: database.owner,
          children: [],
        }))
      } catch (error) {
        console.error('Error loading databases:', error)
        return []
      }
    } else if (node.type === 'database') {
      try {
        const tables = await getTables(node.clusterId, node.databaseName)
        return tables.map((table) => ({
          id: `${node.clusterId}-${node.databaseName}-${table.name}`,
          type: 'table',
          label: table.name,
          clusterId: node.clusterId,
          databaseName: node.databaseName,
          tableName: table.name,
          children: [],
        }))
      } catch (error) {
        console.error('Error loading tables:', error)
        return []
      }
    }
    return []
  }

  // Handle node expansion
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

  // Handle node selection
  const handleNodeSelect = async (node) => {
    setSelectedNode(node)
    setQueryResults(null)

    if (node.type === 'table') {
      setLoadingDetails(true)
      setLoadingRecords(true)

      try {
        const [details, records] = await Promise.all([
          getTableDetails(node.clusterId, node.databaseName, node.tableName),
          getTableRecords(node.clusterId, node.databaseName, node.tableName, 10),
        ])
        setTableDetails(details)
        setTableRecords(records)
      } catch (error) {
        console.error('Error loading table data:', error)
        setTableDetails(null)
        setTableRecords([])
      } finally {
        setLoadingDetails(false)
        setLoadingRecords(false)
      }
    } else {
      setTableDetails(null)
      setTableRecords([])
    }
  }

  // Handle connection dialog
  const handleTestConnection = async (connectionRequest) => {
    setTestingConnection(true)
    try {
      const result = await testConnection(connectionRequest)
      return result
    } finally {
      setTestingConnection(false)
    }
  }

  const handleConnect = async (connectionRequest) => {
    setConnecting(true)
    try {
      const cluster = await addConnection(connectionRequest)
      await loadClusters()
      return cluster
    } catch (error) {
      console.error('Error adding YSQL connection:', error)
      throw error
    } finally {
      setConnecting(false)
    }
  }

  // Handle query execution
  const handleQueryExecute = async (query) => {
    if (!selectedNode || selectedNode.type !== 'table') {
      alert('Please select a table first')
      return
    }

    setLoadingRecords(true)
    try {
      const result = await executeQuery(
        selectedNode.clusterId,
        selectedNode.databaseName,
        query
      )
      
      if (result.error) {
        alert(`Query Error: ${result.error}`)
        setQueryResults(null)
      } else {
        setQueryResults(result)
        setTableRecords(result.rows || [])
      }
    } catch (error) {
      console.error('Error executing YSQL query:', error)
      alert(`Error: ${error.message}`)
      setQueryResults(null)
    } finally {
      setLoadingRecords(false)
    }
  }

  const renderNode = (node) => {
    const getIcon = () => {
      switch (node.type) {
        case 'cluster':
          return '🖥️'
        case 'database':
          return '📁'
        case 'table':
          return '📊'
        default:
          return '📄'
      }
    }

    return (
      <span className="tree-node-label">
        <span className="tree-node-icon">{getIcon()}</span>
        <span>{node.label}</span>
        {node.type === 'cluster' && node.host && (
          <span className="tree-node-meta"> ({node.host})</span>
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

  // Handle bottom panel resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingBottom) return

      const container = document.querySelector('.cassandra-browser')
      if (!container) return

      const rect = container.getBoundingClientRect()
      const newHeight = rect.bottom - e.clientY
      
      const minHeight = 200
      const maxHeight = window.innerHeight * 0.7
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setBottomPanelHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizingBottom(false)
    }

    if (isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingBottom])

  return (
    <div className="cassandra-browser">
      <div className="browser-top-section">
        <ResizablePanels>
          {/* Left Panel - Tree View */}
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

          {/* Center Panel - Query Builder */}
          <div className="browser-center">
            <QueryBuilder
              selectedTable={selectedNode?.type === 'table' ? selectedNode : null}
              tableDetails={tableDetails}
              onExecute={handleQueryExecute}
            />
          </div>

          {/* Right Panel - Table Details */}
          <div className="browser-right">
            {selectedNode?.type === 'table' ? (
              <TableDetails
                table={selectedNode}
                details={tableDetails}
                loading={loadingDetails}
              />
            ) : (
              <div className="right-placeholder">
                <p>Select a table to view details</p>
              </div>
            )}
          </div>
        </ResizablePanels>
      </div>

      {/* Horizontal Resizer for Bottom Panel */}
      <div
        className="bottom-resizer"
        onMouseDown={() => setIsResizingBottom(true)}
        style={{ cursor: 'row-resize' }}
      />

      {/* Bottom Panel - Table Records / Query Results */}
      <div className="browser-bottom" style={{ height: `${bottomPanelHeight}px` }}>
        {selectedNode?.type === 'table' ? (
          <TableRecords
            table={selectedNode}
            records={queryResults ? queryResults.rows : tableRecords}
            loading={loadingRecords}
            queryResults={queryResults}
          />
        ) : (
          <div className="bottom-placeholder">
            <p>Select a table to view records</p>
          </div>
        )}
      </div>

      {/* Connection Dialog */}
      <ConnectionDialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
        onTest={handleTestConnection}
        onConnect={handleConnect}
        testing={testingConnection}
        connecting={connecting}
        keyspaceLabel="Database"
        keyspacePlaceholder="Database name (optional)"
        defaultHosts="localhost:5433"
        defaultDatacenter="us-east-1"
        title="Connect to YugabyteDB YSQL"
      />
    </div>
  )
}

export default YSQLBrowser

