import React, { useState } from 'react'
import './GraphQLCollectionList.css'

const GraphQLCollectionList = ({
  collections,
  selectedCollection,
  selectedQuery,
  onCollectionSelect,
  onQuerySelect
}) => {
  const [expandedCollections, setExpandedCollections] = useState(new Set())

  const toggleCollection = (collectionId) => {
    const newExpanded = new Set(expandedCollections)
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId)
    } else {
      newExpanded.add(collectionId)
    }
    setExpandedCollections(newExpanded)
  }

  return (
    <div className="graphql-collection-list">
      {collections.length === 0 ? (
        <div className="empty-collections">
          <p>No collections available</p>
          <small>Add GraphQL collections to get started</small>
        </div>
      ) : (
        collections.map((collection) => {
          const isExpanded = expandedCollections.has(collection.id)
          const isSelected = selectedCollection?.id === collection.id

          return (
            <div key={collection.id} className="collection-item">
              <div
                className={`collection-header ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  toggleCollection(collection.id)
                  onCollectionSelect(collection)
                }}
              >
                <span className="collection-toggle">
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="collection-icon">📁</span>
                <span className="collection-name">{collection.name}</span>
                <span className="collection-count">
                  ({collection.queries?.length || 0})
                </span>
              </div>
              {isExpanded && collection.queries && (
                <div className="collection-queries">
                  {collection.queries.map((query) => {
                    const isQuerySelected = selectedQuery?.id === query.id
                    return (
                      <div
                        key={query.id}
                        className={`query-item ${isQuerySelected ? 'selected' : ''}`}
                        onClick={() => onQuerySelect(query)}
                      >
                        <span className="query-icon">📄</span>
                        <span className="query-name">{query.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default GraphQLCollectionList

