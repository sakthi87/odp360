import React, { useState } from 'react'
import './TreeView.css'

const TreeView = ({ data, onNodeSelect, onNodeExpand, renderNode, expandedNodes: externalExpandedNodes }) => {
  const [internalExpandedNodes, setInternalExpandedNodes] = useState(new Set())
  
  // Use external expandedNodes if provided, otherwise use internal state
  const expandedNodes = externalExpandedNodes !== undefined ? externalExpandedNodes : internalExpandedNodes

  const toggleNode = (nodeId) => {
    if (onNodeExpand) {
      // Let parent handle expansion
      onNodeExpand(nodeId)
    } else {
      // Internal state management
      const newExpanded = new Set(internalExpandedNodes)
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId)
      } else {
        newExpanded.add(nodeId)
      }
      setInternalExpandedNodes(newExpanded)
    }
  }

  const isExpanded = (nodeId) => expandedNodes.has(nodeId)

  const renderTreeNode = (node, level = 0) => {
    // Nodes that can have children (even if not loaded yet)
    const canHaveChildren = node.type === 'cluster' || node.type === 'keyspace' || node.type === 'database'
    const hasChildren = node.children && node.children.length > 0
    const expanded = isExpanded(node.id)

    return (
      <div key={node.id} className="tree-node">
        <div
          className={`tree-node-content ${node.selected ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (canHaveChildren || hasChildren) {
              toggleNode(node.id)
            }
            if (onNodeSelect) {
              onNodeSelect(node)
            }
          }}
        >
          {(canHaveChildren || hasChildren) && (
            <span className="tree-toggle">
              {expanded ? '▼' : '▶'}
            </span>
          )}
          {!(canHaveChildren || hasChildren) && <span className="tree-toggle-spacer" />}
          {renderNode ? renderNode(node) : <span>{node.label}</span>}
        </div>
        {hasChildren && expanded && (
          <div className="tree-children">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return <div className="tree-view">{data.map((node) => renderTreeNode(node))}</div>
}

export default TreeView

