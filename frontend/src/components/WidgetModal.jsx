import React from 'react'

const WidgetModal = ({ isOpen, availableWidgets, onToggleWidget, onCancel, onSave }) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="widget-modal-overlay" onClick={onCancel}>
      <div className="widget-modal" onClick={(event) => event.stopPropagation()}>
        <header className="widget-modal-header">
          <div>
            <p className="widget-modal-label">Available Widgets</p>
            <h2 className="widget-modal-title">Choose widgets for your dashboard</h2>
          </div>
          <button
            className="widget-modal-close-btn"
            type="button"
            onClick={onCancel}
            aria-label="Close widget manager"
          >
            ×
          </button>
        </header>

        <p className="widget-modal-description">
          Select widgets below and see your dashboard update instantly. Changes are saved when you press Save.
        </p>

        <div className="widget-modal-list">
          {availableWidgets.map((widget) => (
            <button
              type="button"
              key={widget.id}
              className={`widget-modal-item ${widget.selected ? 'selected' : ''}`}
              onClick={() => onToggleWidget(widget.id)}
            >
              <div className="widget-checkbox">
                <span className={`widget-checkbox-icon ${widget.selected ? 'checked' : ''}`}>
                  {widget.selected ? '✔' : ''}
                </span>
                <span className="widget-modal-item-title">{widget.label}</span>
              </div>
              <span className="widget-modal-item-status">
                {widget.selected ? 'Visible' : 'Hidden'}
              </span>
            </button>
          ))}
        </div>

        <footer className="widget-modal-actions">
          <button className="widget-modal-button cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="widget-modal-button save" type="button" onClick={onSave}>
            Save
          </button>
        </footer>
      </div>
    </div>
  )
}

export default WidgetModal
