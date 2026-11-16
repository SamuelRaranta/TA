import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, SlidersHorizontal, X, Check } from '@phosphor-icons/react';

export default function PillSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  onFilterClick,
  showFilter = true,
  filterActive = false,
  filterOptions = null, // Array of strings e.g. ['Semua', 'Biji-Bijian & Palawija', ...] or objects { label, value }
  activeFilter = '',
  onSelectFilter = null,
  filterTitle = 'Pilih Kategori',
  className = '',
  style = {},
  inputStyle = {},
  filterBtnStyle = {},
  disabled = false,
  autoFocus = false
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const handleToggleFilter = (e) => {
    e.stopPropagation();
    if (filterOptions && filterOptions.length > 0) {
      setDropdownOpen(prev => !prev);
    }
    if (onFilterClick) {
      onFilterClick(e);
    }
  };

  const handleSelectOption = (opt) => {
    const val = typeof opt === 'string' ? opt : opt.value;
    if (onSelectFilter) {
      onSelectFilter(val);
    }
    setDropdownOpen(false);
  };

  const isFilterSelected = Boolean(activeFilter && activeFilter !== 'Semua');

  return (
    <div className={`pill-search-container ${className}`} style={style}>
      {/* Pill Search Input */}
      <div className="pill-search-input-wrap">
        <input
          type="text"
          className="pill-search-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          style={inputStyle}
        />
        
        <div className="pill-search-actions-right">
          {value && (
            <button
              type="button"
              className="pill-clear-btn"
              onClick={handleClear}
              title="Hapus pencarian"
              aria-label="Clear search"
            >
              <X size={13} weight="bold" />
            </button>
          )}
          <div className="pill-search-icon-box">
            <MagnifyingGlass size={17} weight="regular" className="pill-search-icon" />
          </div>
        </div>
      </div>

      {/* Circular Purple Filter Button with Dropdown */}
      {showFilter && (
        <div className="pill-filter-btn-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={`pill-filter-circle-btn ${filterActive || isFilterSelected ? 'active' : ''}`}
            onClick={handleToggleFilter}
            title={isFilterSelected ? `Filter aktif: ${activeFilter}` : 'Filter Opsi'}
            aria-label="Filter"
            style={filterBtnStyle}
          >
            <SlidersHorizontal size={20} weight="bold" color="#ffffff" />
            {isFilterSelected && <span className="pill-filter-badge-dot" />}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && filterOptions && filterOptions.length > 0 && (
            <div className="pill-filter-dropdown-menu">
              <div className="pill-filter-dropdown-header">
                <span className="pill-filter-dropdown-title">{filterTitle}</span>
                {isFilterSelected && (
                  <button
                    type="button"
                    className="pill-filter-dropdown-reset"
                    onClick={() => handleSelectOption('Semua')}
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="pill-filter-dropdown-list">
                {filterOptions.map((opt) => {
                  const label = typeof opt === 'string' ? opt : opt.label;
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const isSelected = activeFilter === val;

                  return (
                    <button
                      key={val}
                      type="button"
                      className={`pill-filter-dropdown-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectOption(val)}
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <span className="pill-filter-item-check">
                          <Check size={16} weight="bold" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
