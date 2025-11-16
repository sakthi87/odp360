import React, { useState, useRef, useEffect } from 'react'
import './ResizablePanels.css'

const ResizablePanels = ({ children, direction = 'horizontal' }) => {
  const [sizes, setSizes] = useState([300, null, 400]) // [left, center, right]
  const [isResizing, setIsResizing] = useState(null)
  const containerRef = useRef(null)

  const handleMouseDown = (index) => {
    setIsResizing(index)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing === null) return

      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      let newSizes = [...sizes]

      if (isResizing === 0) {
        // Resizing left panel
        const newLeftSize = e.clientX - rect.left
        if (newLeftSize >= 200 && newLeftSize <= 600) {
          newSizes[0] = newLeftSize
        }
      } else if (isResizing === 1) {
        // Resizing right panel
        const newRightSize = rect.right - e.clientX
        if (newRightSize >= 200 && newRightSize <= 600) {
          newSizes[2] = newRightSize
        }
      }

      setSizes(newSizes)
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    if (isResizing !== null) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, sizes])

  return (
    <div ref={containerRef} className="resizable-panels" style={{ display: 'flex', height: '100%' }}>
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          // Left panel
          return (
            <>
              <div style={{ width: `${sizes[0]}px`, minWidth: '200px', maxWidth: '600px', flexShrink: 0 }}>
                {child}
              </div>
              <div
                className="resizer resizer-left"
                onMouseDown={() => handleMouseDown(0)}
                style={{ cursor: 'col-resize' }}
              />
            </>
          )
        } else if (index === 1) {
          // Center panel
          return <div style={{ flex: 1, minWidth: '200px' }}>{child}</div>
        } else if (index === 2) {
          // Right panel
          return (
            <>
              <div
                className="resizer resizer-right"
                onMouseDown={() => handleMouseDown(1)}
                style={{ cursor: 'col-resize' }}
              />
              <div style={{ width: `${sizes[2]}px`, minWidth: '200px', maxWidth: '600px', flexShrink: 0 }}>
                {child}
              </div>
            </>
          )
        }
        return child
      })}
    </div>
  )
}

export default ResizablePanels

