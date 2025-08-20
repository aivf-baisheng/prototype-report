import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const defaultColumnConfig = {
  main: {
    bundle: { minWidth: 120, flex: 1.5 },
    recipe: { minWidth: 80, flex: 0.8 },
    prompt: { minWidth: 200, flex: 2.2 },
    target: { minWidth: 180, flex: 1.8 },
    response: { minWidth: 140, flex: 1.2 },
    score: { minWidth: 70, flex: 0.6 },
    notes: { minWidth: 80, flex: 0.8 }
  },
  popup: {
    recipe: { minWidth: 80, flex: 0.8 },
    prompt: { minWidth: 250, flex: 2.2 },
    target: { minWidth: 220, flex: 1.8 },
    response: { minWidth: 140, flex: 1.2 },
    score: { minWidth: 70, flex: 0.6, gap: 8 },
    notes: { minWidth: 80, flex: 0.8 }
  }
};

const generateGridTemplateColumns = (config, isPopup) => {
  const configToUse = isPopup ? config.popup : config.main;
  return Object.entries(configToUse)
    .map(([key, value]) => `minmax(${value.minWidth}px, ${value.flex}fr)`)
    .join(' ');
};

const DataTable = ({ 
  data, 
  loading, 
  error, 
  searchTerm, 
  setSearchTerm,
  selectedView,
  setSelectedView,
  selectedBundles,
  setSelectedBundles,
  selectedRecipes,
  setSelectedRecipes,
  selectedScores,
  setSelectedScores,
  isFilterOpen,
  setIsFilterOpen,
  editingPrompt,
  setEditingPrompt,
  editDropdownRef,
  bundleFilterRef,
  recipeFilterRef,
  scoreFilterRef,
  fetchBundleData,
  showBundleFilter = true,
  columnConfig = defaultColumnConfig,
  isPopup = false,
  calculateTotalPromptCount,
  bundleItems
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const gridStyle = {
    gridTemplateColumns: generateGridTemplateColumns(columnConfig, isPopup)
  };
  console.log('DataTable data:', data);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const flattenData = (data) => {
    const flattened = [];
    data.forEach(bundle => {
      bundle.recipes.forEach(recipe => {
        recipe.prompts.forEach(prompt => {
          flattened.push({
            bundle: bundle.name,
            recipe: recipe.name,
            prompt_message: prompt.prompt_message,
            target: prompt.target,
            response: prompt.response,
            score: prompt.score,
            notes: prompt.notes,
            id: prompt.id
          });
        });
      });
    });
    return flattened;
  };

  const sortData = (data) => {
    if (!sortConfig.key) return data;

    // First, flatten the data structure
    const flattenedData = flattenData(data);

    // Sort the flattened data
    flattenedData.sort((a, b) => {
      let aValue, bValue;

      // Extract values based on the column key
      switch (sortConfig.key) {
        case 'bundle':
          aValue = a.bundle;
          bValue = b.bundle;
          break;
        case 'recipe':
          aValue = a.recipe;
          bValue = b.recipe;
          break;
        case 'prompt':
          aValue = a.prompt_message;
          bValue = b.prompt_message;
          break;
        case 'target':
          aValue = a.target;
          bValue = b.target;
          break;
        case 'response':
          aValue = a.response;
          bValue = b.response;
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'notes':
          aValue = a.notes;
          bValue = b.notes;
          break;
        default:
          return 0;
      }

      // Handle null/undefined values
      aValue = aValue ?? '';
      bValue = bValue ?? '';

      // Compare values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
    });

    return flattenedData;
  };

  const filterAndSortData = (data) => {
    // First, flatten the data
    let flattenedData = [];
    data.forEach((bundle, bundleIndex) => {
      bundle.recipes.forEach((recipe, recipeIndex) => {
        recipe.prompts.forEach((prompt, promptIndex) => {
          // Add unique ID if not present
          if (!prompt.id) {
            prompt.id = `${bundleIndex}-${recipeIndex}-${promptIndex}`;
          }
          
          flattenedData.push({
            id: prompt.id,
            bundle: bundle.name,
            recipe: recipe.name,
            prompt_message: prompt.prompt_message,
            target: prompt.target,
            response: prompt.response,
            score: prompt.score,
            notes: prompt.notes
          });
        });
      });
    });

    // Apply filters
    flattenedData = flattenedData.filter(row => {
      const matchesBundle = selectedBundles.length === 0 || selectedBundles.includes(row.bundle);
      const matchesRecipe = selectedRecipes.length === 0 || selectedRecipes.includes(row.recipe);
      const matchesScore = selectedScores.length === 0 || selectedScores.includes(row.score);
      
      let matchesSearch = true;
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        matchesSearch = 
          row.prompt_message?.toLowerCase().includes(searchLower) ||
          row.target?.toLowerCase().includes(searchLower) ||
          row.response?.toLowerCase().includes(searchLower) ||
          row.notes?.toLowerCase().includes(searchLower) ||
          row.bundle.toLowerCase().includes(searchLower) ||
          row.recipe.toLowerCase().includes(searchLower);
      }

      return matchesBundle && matchesRecipe && matchesScore && matchesSearch;
    });

    // Apply sorting if configured
    if (sortConfig.key) {
      flattenedData.sort((a, b) => {
        let aValue = a[sortConfig.key === 'prompt' ? 'prompt_message' : sortConfig.key] ?? '';
        let bValue = b[sortConfig.key === 'prompt' ? 'prompt_message' : sortConfig.key] ?? '';

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
          const comparison = String(aValue).localeCompare(String(bValue));
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
      });
    }

    return flattenedData;
  };

  console.log('DataTable filtered and sorted data:', filterAndSortData(data));
  return (
    <div className="data-table-section">
      <div className="table-controls">
        <div className="filter-controls">
          <span className="filter-label">Filter:</span>
          {showBundleFilter && (
            <div className="filter-tag" ref={bundleFilterRef} onClick={() => setIsFilterOpen(current => current === 'bundles' ? null : 'bundles')}>
              <span className="tag-label">Bundles</span>
              <span className="tag-count">
                {selectedBundles.length ? `Selected (${selectedBundles.length})` : 'All'}
              </span>
              {isFilterOpen === 'bundles' && (
                <div className="filter-dropdown">
                  {data.map(bundle => bundle.name)
                  .filter((name, index, self) => self.indexOf(name) === index)
                  .map(bundleName => (
                    <div 
                      key={bundleName} 
                      className={`filter-item ${selectedBundles.includes(bundleName) ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBundles(prev => 
                          prev.includes(bundleName) 
                            ? prev.filter(b => b !== bundleName)
                            : [...prev, bundleName]
                        );
                      }}
                    >
                      <span>{bundleName}</span>
                      {selectedBundles.includes(bundleName) && (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.3334 4L6.00004 11.3333L2.66671 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="filter-tag" ref={recipeFilterRef} onClick={() => setIsFilterOpen(current => current === 'recipes' ? null : 'recipes')}>
            <span className="tag-label">Recipes</span>
            <span className="tag-count">
              {selectedRecipes.length ? `Selected (${selectedRecipes.length})` : 'All'}
            </span>
            {isFilterOpen === 'recipes' && (
              <div className="filter-dropdown">
                {data.flatMap(bundle => 
                  bundle.recipes.map(recipe => recipe.name)
                ).filter((name, index, self) => self.indexOf(name) === index)
                .map(recipeName => (
                  <div 
                    key={recipeName} 
                    className={`filter-item ${selectedRecipes.includes(recipeName) ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecipes(prev => 
                        prev.includes(recipeName) 
                          ? prev.filter(r => r !== recipeName)
                          : [...prev, recipeName]
                      );
                    }}
                  >
                    <span>{recipeName}</span>
                    {selectedRecipes.includes(recipeName) && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3334 4L6.00004 11.3333L2.66671 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="filter-tag" ref={scoreFilterRef} onClick={() => setIsFilterOpen(current => current === 'scores' ? null : 'scores')}>
            <span className="tag-label">Scores</span>
            <span className="tag-count">
              {selectedScores.length ? `Selected (${selectedScores.length})` : 'All'}
            </span>
            {isFilterOpen === 'scores' && (
              <div className="filter-dropdown">
                {[0, 1].map(score => (
                  <div 
                    key={score} 
                    className={`filter-item ${selectedScores.includes(score) ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScores(prev => 
                        prev.includes(score) 
                          ? prev.filter(s => s !== score)
                          : [...prev, score]
                      );
                    }}
                  >
                    <span>{score}</span>
                    {selectedScores.includes(score) && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3334 4L6.00004 11.3333L2.66671 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="view-controls">
          <div className="view-toggle">
            <button className={`toggle-button ${selectedView === 'list' ? 'active' : ''}`} onClick={() => setSelectedView('list')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6.66667 9.33337H2V14H6.66667V9.33337Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.66667 2H2V6.66667H6.66667V2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.33337 2.66663H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.33337 6H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.33337 10H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.33337 13.3334H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>List</span>
            </button>
            <button className={`toggle-button ${selectedView === 'table' ? 'active' : ''}`} onClick={() => setSelectedView('table')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V6M6 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V6M6 2V14M2 6V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H6M2 6H14M14 6V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Table</span>
            </button>
          </div>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="columns-button">
            <span>Columns</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 2V14" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="prompts-count">
        {calculateTotalPromptCount(bundleItems).toLocaleString()} prompts
      </div>

      {/* Data Table */}
      <div className="data-table">
        <div className="table-header" style={gridStyle}>
          {showBundleFilter && (
            <div 
              className={`header-cell bundle-header ${sortConfig.key === 'bundle' ? 'sorted' : ''}`}
              onClick={() => handleSort('bundle')}
            >
              <span>Bundle</span>
              {sortConfig.key === 'bundle' && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                  <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
                </svg>
              )}
            </div>
          )}
          <div 
            className={`header-cell recipe-header ${sortConfig.key === 'recipe' ? 'sorted' : ''}`}
            onClick={() => handleSort('recipe')}
          >
            <span>Recipe</span>
            {sortConfig.key === 'recipe' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div 
            className={`header-cell prompt-header ${sortConfig.key === 'prompt' ? 'sorted' : ''}`}
            onClick={() => handleSort('prompt')}
          >
            <span>Prompt</span>
            {sortConfig.key === 'prompt' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div 
            className={`header-cell target-header ${sortConfig.key === 'target' ? 'sorted' : ''}`}
            onClick={() => handleSort('target')}
          >
            <span>Target</span>
            {sortConfig.key === 'target' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div 
            className={`header-cell response-header ${sortConfig.key === 'response' ? 'sorted' : ''}`}
            onClick={() => handleSort('response')}
          >
            <span>Response</span>
            {sortConfig.key === 'response' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div 
            className={`header-cell score-header ${sortConfig.key === 'score' ? 'sorted' : ''}`}
            onClick={() => handleSort('score')}
          >
            <span>Score</span>
            {sortConfig.key === 'score' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div 
            className={`header-cell notes-header ${sortConfig.key === 'notes' ? 'sorted' : ''}`}
            onClick={() => handleSort('notes')}
          >
            <span>Notes</span>
            {sortConfig.key === 'notes' && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }}>
                <path d="M8 4L4 8L12 8L8 4Z" fill="currentColor"/>
              </svg>
            )}
          </div>
        </div>

        {loading ? (
          <div>Loading data...</div>
        ) : error ? (
          <div>Error: {error}</div>
        ) : (
          filterAndSortData(data).map((row, index) => (
            <div key={row.id} 
                 className={`table-row ${index === 0 ? 'highlighted-row' : ''}`}
                 style={gridStyle}>
              {showBundleFilter && <div className="table-cell">{row.bundle}</div>}
              <div className="table-cell">{row.recipe}</div>
              <div className="table-cell prompt-text">{row.prompt_message}</div>
              <div className="table-cell">{row.target}</div>
              <div className="table-cell">{row.response}</div>
              <EditableCell 
                prompt={row}
                type="score"
                showCheckIcon={index === 0}
                onEdit={(element) => {
                  setEditingPrompt(editingPrompt?.id === row.id ? null : {
                    id: row.id,
                    score: row.score,
                    notes: row.notes,
                    element,
                    isScoreOpen: false
                  });
                }}
              />
              <EditableCell 
                prompt={row}
                type="notes"
                onEdit={(element) => {
                  setEditingPrompt(editingPrompt?.id === row.id ? null : {
                    id: row.id,
                    score: row.score,
                    notes: row.notes,
                    element,
                    isScoreOpen: false
                  });
                }}
              />
              {editingPrompt?.id === row.id && (
                <EditDropdown 
                  editingPrompt={editingPrompt}
                  editDropdownRef={editDropdownRef}
                  onClose={(shouldRefresh) => {
                    setEditingPrompt(null);
                    if (shouldRefresh) {
                      fetchBundleData();
                    }
                  }}
                  onSave={setEditingPrompt}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const EditableCell = ({ prompt, type, onEdit, showCheckIcon }) => {
  const isScore = type === 'score';
  
  return (
    <div 
      className={`${isScore ? 'table-cell score-cell' : 'table-cell notes-text'}`}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(e.currentTarget);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="cell-content">
        {isScore ? (
          <div className={`score-badge ${prompt.score === 1 ? 'success' : 'error'}`}>
            <span>{prompt.score}</span>
          </div>
        ) : prompt.notes}
        {showCheckIcon && (
          <svg className="user-check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 9.99996 12.5H4.99996C4.1159 12.5 3.26806 12.8512 2.64294 13.4763C2.01782 14.1014 1.66663 14.9493 1.66663 15.8333V17.5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.49996 9.16667C9.34091 9.16667 10.8333 7.67428 10.8333 5.83333C10.8333 3.99238 9.34091 2.5 7.49996 2.5C5.65901 2.5 4.16663 3.99238 4.16663 5.83333C4.16663 7.67428 5.65901 9.16667 7.49996 9.16667Z" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.3334 9.16667L15 10.8333L18.3334 7.5" stroke="#15803D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
};

const EditDropdown = ({ editingPrompt, editDropdownRef, onClose, onSave }) => {
  return (
    <div 
      ref={editDropdownRef}
      className="edit-dropdown"
      style={{
        position: 'fixed',
        top: editingPrompt.element.getBoundingClientRect().bottom + 4,
        left: editingPrompt.element.getBoundingClientRect().left,
      }}
    >
      <div className="edit-dropdown-header">
        <span>Score</span>
        <svg 
          className="close-icon" 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
          onClick={onClose}
        >
          <path d="M12 4L4 12M4 4L12 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="score-selector">
        <div 
          className="score-display"
          onClick={() => onSave({ ...editingPrompt, isScoreOpen: !editingPrompt.isScoreOpen })}
        >
          <div className={`score-badge ${editingPrompt.score === 1 ? 'success' : 'error'}`}>
            <span>{editingPrompt.score}</span>
          </div>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none"
            style={{ transform: editingPrompt.isScoreOpen ? 'rotate(90deg)' : 'none' }}
          >
            <path d="M6 3L9 6L6 9" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {editingPrompt.isScoreOpen && (
          <div className="score-options">
            <div 
              className={`score-option ${editingPrompt.score === 1 ? 'selected' : ''}`}
              onClick={() => onSave({ ...editingPrompt, score: 1, isScoreOpen: false })}
            >
              <span>1</span>
              {editingPrompt.score === 1 && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3334 4L6.00004 11.3333L2.66671 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div 
              className={`score-option ${editingPrompt.score === 0 ? 'selected' : ''}`}
              onClick={() => onSave({ ...editingPrompt, score: 0, isScoreOpen: false })}
            >
              <span>0</span>
              {editingPrompt.score === 0 && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3334 4L6.00004 11.3333L2.66671 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="notes-section">
        <span className="notes-label">Add note (optional)</span>
        <div className="notes-editor">
          <textarea
            value={editingPrompt.notes || ''}
            onChange={(e) => onSave({ ...editingPrompt, notes: e.target.value })}
            placeholder="Add a note..."
            rows={3}
          />
        </div>
      </div>
      <button 
        className="save-button"
        onClick={async () => {
          try {
            const response = await fetch(`http://localhost:8000/api/bundles/update_prompt`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt_id: editingPrompt.id,
                score: editingPrompt.score,
                notes: editingPrompt.notes
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to update prompt');
            }

            // Let parent handle the refresh
            onClose(true);
          } catch (error) {
            console.error('Error updating prompt:', error);
            alert('Failed to save changes. Please try again.');
          }
        }}
      >
        Save
      </button>
    </div>
  );
};


// API endpoint configuration
const API_URL = 'http://localhost:8000/api/bundles';

const TestReport = () => {
  const [selectedView, setSelectedView] = useState('list');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundleItems, setBundleItems] = useState([]);
  
  // For debugging
  useEffect(() => {
    console.log('Bundle items updated:', bundleItems);
  }, [bundleItems]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedScores, setSelectedScores] = useState([0, 1]);  // Default scores can be set immediately

  // Function to calculate recipe percentage based on scores
  const calculateRecipePercentage = (recipe) => {
    console.log('Calculating recipe percentage for:', recipe.name, 'with prompts:', recipe.prompts);
    if (!recipe.prompts || recipe.prompts.length === 0) {
      console.log('No prompts found for recipe:', recipe.name);
      return 0;
    }
    
    const totalScore = recipe.prompts.reduce((sum, prompt) => sum + prompt.score, 0);
    const percentage = (totalScore / recipe.prompts.length) * 100;
    const roundedPercentage = Math.round(percentage * 10) / 10;
    console.log(`Recipe ${recipe.name}: totalScore=${totalScore}, promptCount=${recipe.prompts.length}, percentage=${roundedPercentage}%`);
    return roundedPercentage;
  };

  // Function to calculate bundle percentage based on recipe scores
  const calculateBundlePercentage = (bundle) => {
    console.log('Calculating bundle percentage for:', bundle.name, 'with recipes:', bundle.recipes);
    if (!bundle.recipes || bundle.recipes.length === 0) {
      console.log('No recipes found for bundle:', bundle.name);
      return 0;
    }
    
    const recipePercentages = bundle.recipes.map(recipe => calculateRecipePercentage(recipe));
    console.log(`Bundle ${bundle.name}: recipe percentages:`, recipePercentages);
    const averagePercentage = recipePercentages.reduce((sum, percentage) => sum + percentage, 0) / recipePercentages.length;
    const roundedPercentage = Math.round(averagePercentage * 10) / 10;
    console.log(`Bundle ${bundle.name}: average percentage = ${roundedPercentage}%`);
    return roundedPercentage;
  };

  // Function to calculate overall confidence based on all scores
  const calculateOverallConfidence = (data) => {
    if (!data || data.length === 0) return 0;
    
    let totalScore = 0;
    let totalPrompts = 0;
    
    data.forEach(bundle => {
      bundle.recipes.forEach(recipe => {
        recipe.prompts.forEach(prompt => {
          totalScore += prompt.score;
          totalPrompts += 1;
        });
      });
    });
    
    if (totalPrompts === 0) return 0;
    const confidence = (totalScore / totalPrompts) * 100;
    return Math.round(confidence * 10) / 10; // Round to 1 decimal place
  };

  // Function to calculate confidence for a specific bundle
  const calculateBundleConfidence = (bundleName) => {
    const bundle = bundleItems.find(b => b.name === bundleName);
    if (!bundle) return 0;
    
    let totalScore = 0;
    let totalPrompts = 0;
    
    bundle.recipes.forEach(recipe => {
      recipe.prompts.forEach(prompt => {
        totalScore += prompt.score;
        totalPrompts += 1;
      });
    });
    
    if (totalPrompts === 0) return 0;
    const confidence = (totalScore / totalPrompts) * 100;
    return Math.round(confidence * 10) / 10; // Round to 1 decimal place
  };

  // Function to calculate total prompts for a specific bundle
  const calculateBundlePromptCount = (bundleName) => {
    const bundle = bundleItems.find(b => b.name === bundleName);
    if (!bundle) return 0;
    
    return bundle.recipes.reduce((total, recipe) => total + recipe.prompts.length, 0);
  };

  // Function to calculate total prompts across all bundles
  const calculateTotalPromptCount = (data) => {
    if (!data || data.length === 0) return 0;
    
    return data.reduce((total, bundle) => 
      total + bundle.recipes.reduce((recipeTotal, recipe) => 
        recipeTotal + recipe.prompts.length, 0
      ), 0
    );
  };

  // Function to process bundle data and add calculated percentages
  const processBundleData = (data) => {
    console.log('Processing bundle data:', data);
    
    const processed = data.map(bundle => {
      // Use existing bundle percentage if available, otherwise calculate
      const bundlePercentage = bundle.percentage !== undefined ? bundle.percentage : calculateBundlePercentage(bundle);
      
      const processedRecipes = bundle.recipes.map(recipe => {
        // Use existing recipe percentage if available, otherwise calculate
        const recipePercentage = recipe.percentage !== undefined ? recipe.percentage : calculateRecipePercentage(recipe);
        console.log(`Recipe ${recipe.name}: using percentage = ${recipePercentage}%`);
        return {
          ...recipe,
          percentage: recipePercentage
        };
      });
      
      console.log(`Bundle ${bundle.name}: using percentage = ${bundlePercentage}%`);
      return {
        ...bundle,
        percentage: bundlePercentage,
        recipes: processedRecipes
      };
    });
    
    console.log('Final processed data:', processed);
    return processed;
  };

  // Initialize filters with all values when data is loaded
  useEffect(() => {
    if (bundleItems.length > 0) {
      // Set all bundle names
      setSelectedBundles(bundleItems.map(bundle => bundle.name));
      
      // Set all unique recipe names
      const allRecipes = bundleItems.flatMap(bundle => 
        bundle.recipes.map(recipe => recipe.name)
      ).filter((name, index, self) => self.indexOf(name) === index);
      setSelectedRecipes(allRecipes);
    }
  }, [bundleItems]);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editNote, setEditNote] = useState('');
  const editDropdownRef = useRef(null);
  const bundleFilterRef = useRef(null);
  const recipeFilterRef = useRef(null);
  const scoreFilterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideAll = 
        (!bundleFilterRef.current || !bundleFilterRef.current.contains(event.target)) &&
        (!recipeFilterRef.current || !recipeFilterRef.current.contains(event.target)) &&
        (!scoreFilterRef.current || !scoreFilterRef.current.contains(event.target)) &&
        (!editDropdownRef.current || !editDropdownRef.current.contains(event.target));

      if (clickedOutsideAll) {
        setIsFilterOpen(null);
        setEditingPrompt(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to fetch bundle data
  const fetchBundleData = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const urlWithTimestamp = `${API_URL}?t=${timestamp}`;
      console.log('Fetching data from:', urlWithTimestamp);
      const response = await fetch(urlWithTimestamp);
      console.log('API Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch bundle data');
      }
      const data = await response.json();
      console.log('API Response data:', data);
      console.log('Data structure check - first bundle:', data[0]);
      console.log('Data structure check - first recipe:', data[0]?.recipes?.[0]);
      console.log('First recipe percentage type:', typeof data[0]?.recipes?.[0]?.percentage);
      console.log('First recipe percentage value:', data[0]?.recipes?.[0]?.percentage);
      
      // Process the data to calculate percentages based on scores
      const processedData = processBundleData(data);
      console.log('Processed data with calculated percentages:', processedData);
      
      setBundleItems(processedData);
      setError(null);
    } catch (err) {
      console.error('Error in fetchBundleData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchBundleData();
  }, []);

  // Monitor bundleItems changes
  useEffect(() => {
    console.log('Bundle items updated:', bundleItems);
    console.log('Bundle items length:', bundleItems.length);
    if (bundleItems.length > 0) {
      console.log('First bundle:', bundleItems[0]);
      console.log('First bundle recipes:', bundleItems[0].recipes);
      // Debug chart data
      bundleItems.forEach(bundle => {
        console.log(`Chart data for bundle: ${bundle.name}`, bundle.recipes.map(r => ({ 
          name: r.name, 
          percentage: r.percentage, 
          type: typeof r.percentage 
        })));
        console.log(`Chart data structure for bundle: ${bundle.name}`, bundle.recipes);
      });
    }
  }, [bundleItems]);



  const handleBundleClick = (bundleName) => {
    setSelectedBundle(bundleName);
  };

  const closeBundlePopup = () => {
    setSelectedBundle(null);
  };

  return (
    <div className="test-report-container">

      {/* Main Content */}
      <main className="main-content">
        {/* Header Section */}
        <header className="report-header">
          <div className="breadcrumbs">
            <span className="breadcrumb-text">Report</span>
          </div>
          <div className="datetime-info">
            <span className="date-range">4 Aug 2025, 4:23PM – 5.43PM</span>
            <span className="duration">(1 hour 19 min)</span>
          </div>
        </header>

        {/* Title Section */}
        <section className="title-section">
          <div className="title-content">
            <div className="title-row">
              <h1 className="report-title">Test report</h1>
              <div className="status-badge completed">
                <span>Completed</span>
              </div>
            </div>
            <p className="report-description">Report description</p>
          </div>
          <button className="download-button">
            <span>Download</span>
          </button>
        </section>

        {/* Metrics Section */}
        <section className="metrics-section">
          <div className="metric-group">
            <span className="metric-label">Endpoint</span>
            <span className="metric-value">Support Team 2 (OpenAI GPT4)</span>
          </div>
          <div className="divider"></div>
          <div className="metric-group">
            <span className="metric-label">Bundles</span>
            <div className="bundles-content">
              {loading ? (
                <div>Loading bundles...</div>
              ) : error ? (
                <div>Error: {error}</div>
              ) : (
                bundleItems.map((bundle, index) => (
                  <div key={index} className="bundle-item">
                    <span className="bundle-name">{bundle.name}</span>
                    <div className="success-badge">
                      <span>{bundle.percentage}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="divider"></div>
          <div className="metric-group">
            <span className="metric-label">Confidence</span>
            <span className="metric-value">{calculateOverallConfidence(bundleItems)}%</span>
          </div>
          <div className="divider"></div>
          <div className="metric-group">
            <span className="metric-label">Prompts</span>
            <div className="prompts-content">
              <span className="prompt-count">{calculateTotalPromptCount(bundleItems).toLocaleString()}</span>
              <span className="score-adjusted">1 score adjusted</span>
            </div>
          </div>
        </section>

        {/* Report Content */}
        <section className="report-content">
          {/* Info Banner */}
          <div className="info-banner">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <g clipPath="url(#clip0_1_551)">
                <path d="M9.99999 18.3334C14.6024 18.3334 18.3333 14.6024 18.3333 10C18.3333 5.39765 14.6024 1.66669 9.99999 1.66669C5.39762 1.66669 1.66666 5.39765 1.66666 10C1.66666 14.6024 5.39762 18.3334 9.99999 18.3334Z" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13.3333V10" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 6.66669H10.0083" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_1_551">
                  <rect width="20" height="20" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <div className="info-content">
              <div className="info-header">
                <h3 className="info-title">Making sense of test results</h3>
                <p className="info-description">AI can make mistakes. Review the report and adjust scores where required before you make any decisions.</p>
              </div>
              <span className="learn-more-link">Learn more</span>
            </div>
            <svg className="close-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 4L12 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Bundles Section */}
          <div className="bundles-section">
            <div className="section-header">
              <h2 className="section-title">Bundles</h2>
              <svg className="chevron-up" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 10L8 6L4 10" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="charts-container">
              {loading ? (
                <div>Loading charts...</div>
              ) : error ? (
                <div>Error: {error}</div>
              ) : (
                bundleItems.map((bundle, bundleIndex) => (
                  <div key={bundleIndex} className="chart-card">
                    <div className="chart-header">
                      <div className="chart-title-row">
                        <span className="chart-title">{bundle.name}</span>
                        <div className="success-badge">
                          <span>{bundle.percentage}%</span>
                        </div>
                      </div>
                      <svg
                        className="arrow-right"
                        width="16"
                        height="17"
                        viewBox="0 0 16 17"
                        fill="none"
                        onClick={() => handleBundleClick(bundle.name)}
                        style={{cursor: 'pointer'}}
                      >
                        <path d="M3.33331 8.5H12.6666" stroke="#64748B" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 3.83337L12.6667 8.50004L8 13.1667" stroke="#64748B" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="chart-content">
                      {/* Debug: Show actual percentage values */}
                      <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontFamily: 'monospace', maxHeight: '60px', overflow: 'auto' }}>
                        Debug - Recipe percentages: {bundle.recipes.map(r => `${r.name}: ${r.percentage}`).join(', ')}
                      </div>
                      <div style={{ height: '200px', width: '100%' }}>
                        {(() => {
                          const chartData = {
                            labels: bundle.recipes.map(recipe => recipe.name),
                            datasets: [
                              {
                                label: 'Recipe Performance',
                                data: bundle.recipes.map(recipe => recipe.percentage),
                                backgroundColor: 'rgba(96, 165, 250, 1)',
                                borderColor: 'rgba(96, 165, 250, 1)',
                                borderWidth: 1,
                                borderRadius: 4,
                                borderSkipped: false,
                              },
                            ],
                          };

                          const options = {
                            indexAxis: 'y', // Horizontal bar chart
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: {
                                display: false, // Hide legend for cleaner look
                              },
                              tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                titleColor: '#333',
                                bodyColor: '#666',
                                borderColor: '#e0e0e0',
                                borderWidth: 1,
                                cornerRadius: 8,
                                callbacks: {
                                  label: function(context) {
                                    return `Recipe: ${context.dataset.label} - ${context.parsed.x}%`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                // Horizontal axis (percentage values)
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)',
                                  drawBorder: false,
                                },
                                ticks: {
                                  color: '#666',
                                  font: {
                                    size: 10
                                  },
                                  callback: function(value) {
                                    return value + '%';
                                  }
                                }
                              },
                              y: {
                                // Vertical axis (recipe names)
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)',
                                  drawBorder: false,
                                },
                                ticks: {
                                  color: '#333',
                                  font: {
                                    size: 10,
                                    weight: '500'
                                  }
                                }
                              }
                            },
                            elements: {
                              bar: {
                                barThickness: 12, // Fixed bar thickness - made thinner
                                maxBarThickness: 12, // Maximum bar thickness
                              }
                            },
                            datasets: {
                              bar: {
                                categoryPercentage: 0.3, // Controls space between categories
                                barPercentage: 0.6, // Controls bar width within category space
                              }
                            }

                          };

                          return <Bar data={chartData} options={options} />;
                        })()}
                      </div>
                    </div>
                    <div className="chart-footer">
                      <div className="scale-line"></div>
                      <div className="scale-labels">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span>
                      </div>
                    </div>
                    <div className="confidence-legend">
                      <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                        <circle cx="6.5" cy="6" r="5.5" stroke="#334155" strokeDasharray="2 2"/>
                      </svg>
                      <span>Bundle average</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

                      {/* Data Table Section */}
            <DataTable 
              data={bundleItems}
              loading={loading}
              error={error}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              selectedBundles={selectedBundles}
              setSelectedBundles={setSelectedBundles}
              selectedRecipes={selectedRecipes}
              setSelectedRecipes={setSelectedRecipes}
              selectedScores={selectedScores}
              setSelectedScores={setSelectedScores}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              editingPrompt={editingPrompt}
              setEditingPrompt={setEditingPrompt}
              editDropdownRef={editDropdownRef}
              bundleFilterRef={bundleFilterRef}
              recipeFilterRef={recipeFilterRef}
              scoreFilterRef={scoreFilterRef}
              fetchBundleData={fetchBundleData}
              showBundleFilter={true}
              calculateTotalPromptCount={calculateTotalPromptCount}
              bundleItems={bundleItems}
            />
        </section>
      </main>

      {/* Bundle Details Popup */}
      {selectedBundle && (
        <div className="popup-overlay" onClick={closeBundlePopup}>
          <div className="bundle-popup" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <div className="popup-close-button" onClick={closeBundlePopup}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 4L12 12" stroke="#334155" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Close</span>
            </div>

            {/* Header */}
            <div className="popup-header">
              <div className="popup-title-section">
                <div className="popup-title-row">
                  <h1 className="popup-title">{selectedBundle}</h1>
                  <div className="success-badge">
                    <span>{bundleItems.find(bundle => bundle.name === selectedBundle)?.percentage}%</span>
                  </div>
                </div>
                <p className="popup-description">Description</p>
              </div>
              <button className="download-button">
                <span>Download</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="popup-metrics">
              <div className="metric-group">
                <span className="metric-label">Endpoint</span>
                <span className="metric-value">Support Team 2 (OpenAI GPT4)</span>
              </div>
              <div className="divider"></div>
              <div className="metric-group">
                <span className="metric-label">Recipes</span>
                <div className="bundles-content">
                  {loading ? (
                    <div>Loading recipes...</div>
                  ) : error ? (
                    <div>Error: {error}</div>
                  ) : (
                    bundleItems
                      .find(bundle => bundle.name === selectedBundle)
                      ?.recipes.map((recipe, index) => (
                        <div key={index} className="bundle-item">
                          <span className="bundle-name">{recipe.name}</span>
                          <div className="success-badge">
                            <span>{recipe.percentage}%</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              <div className="divider"></div>
              <div className="metric-group">
                <span className="metric-label">Confidence</span>
                <span className="metric-value">{calculateBundleConfidence(selectedBundle)}%</span>
              </div>
              <div className="divider"></div>
              <div className="metric-group">
                <span className="metric-label">Prompts</span>
                <div className="prompts-content">
                  <span className="prompt-count">{calculateBundlePromptCount(selectedBundle)}</span>
                  <span className="score-adjusted">1 score adjusted</span>
                </div>
              </div>
            </div>

            {/* Filter Controls */}


            {/* Popup Table */}
            <DataTable 
              data={[bundleItems.find(bundle => bundle.name === selectedBundle)].filter(Boolean)}
              loading={loading}
              error={error}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              selectedBundles={selectedBundles}
              setSelectedBundles={setSelectedBundles}
              selectedRecipes={selectedRecipes}
              setSelectedRecipes={setSelectedRecipes}
              selectedScores={selectedScores}
              setSelectedScores={setSelectedScores}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              editingPrompt={editingPrompt}
              setEditingPrompt={setEditingPrompt}
              editDropdownRef={editDropdownRef}
              bundleFilterRef={bundleFilterRef}
              recipeFilterRef={recipeFilterRef}
              scoreFilterRef={scoreFilterRef}
              fetchBundleData={fetchBundleData}
              showBundleFilter={false}
              isPopup={true}
              calculateTotalPromptCount={calculateTotalPromptCount}
              bundleItems={bundleItems}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReport;
