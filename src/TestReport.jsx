import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar } from 'react-chartjs-2';
import VotingButtonsShadcn from './components/VotingButtonsShadcn';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);




const DataTable = ({ 
  data, 
  loading, 
  error,
  selectedView = 'table',
  setSelectedView,
  calculateTotalPromptCount,
  bundleItems,
  onVote,
  onSaveNote,
  userVerdicts
}) => {
  const [sorting, setSorting] = useState([]);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editDropdownRef = useRef(null);

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: 'bundle',
      header: 'Bundle',
      size: 1.5,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue(columnId));
      },
    },
    {
      accessorKey: 'recipe',
      header: 'Test Name',
      size: 0.8,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue(columnId));
      },
    },
    {
      accessorKey: 'prompt_message',
      header: 'Prompt to LLM App',
      size: 2.2,
    },
    {
      accessorKey: 'target',
      header: 'Ground Truth',
      size: 1.8,
    },
    {
      accessorKey: 'response',
      header: 'Response from LLM App',
      size: 1.2,
    },
    {
      accessorKey: 'score',
      header: 'Evaluation Outcome',
      size: 0.6,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue(columnId) === Number(filterValue);
      },
      cell: info => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className={`score-badge ${info.getValue() === 1 ? 'success' : 'error'}`}>
            <span>{info.getValue()}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      size: 0.8,
      cell: info => (
        <div className="notes-dropdown">
          <div
            className="notes-dropdown-trigger"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              console.log('Notes cell clicked:', info.row.original.id);
              console.log('Current editingPrompt:', editingPrompt);
              
              // Get the position of the clicked element
              const rect = e.currentTarget.getBoundingClientRect();
              console.log('Clicked element position:', rect);
              
              setEditingPrompt(info.row.original.id);
              setEditNote(info.getValue() || '');
              
              // Position the popup near the clicked element
              setTimeout(() => {
                if (editDropdownRef.current) {
                  const popup = editDropdownRef.current;
                  // Position below the clicked element
                  popup.style.position = 'absolute';
                  popup.style.top = `${rect.bottom + 4}px`;
                  popup.style.left = `${rect.left}px`;
                  popup.style.transform = 'none';
                  console.log('Positioned popup at:', rect.bottom + 4, rect.left);
                }
              }, 0);
            }}
          >
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {info.getValue() || 'Click to edit'}
            </span>

          </div>
          

        </div>
      ),
    },
    {
      accessorKey: 'verdict',
      header: 'Your Verdict',
      size: 1.2,
      cell: info => (
        <VotingButtonsShadcn
          itemId={info.row.original.id}
          initialUserVote={userVerdicts.get(info.row.original.id) || null}
          onVote={onVote}
          className="justify-center"
        />
      ),
    },
  ], [onVote, onSaveNote, editingPrompt, editNote]);

  // Prepare flattened data
  const flattenedData = useMemo(() => {
    if (!data) return [];
    
    const flattened = [];
    const idCounts = new Map(); // Track how many times each ID appears
    
    let promptIndex = 0;
    data.forEach(bundle => {
      bundle.recipes?.forEach(recipe => {
        recipe.prompts?.forEach(prompt => {
          if (prompt) {
            // Create a more unique ID that includes index to prevent duplicates
            const generatedId = prompt.id || `${bundle.name}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
            promptIndex++;
            
            // Track ID usage
            idCounts.set(generatedId, (idCounts.get(generatedId) || 0) + 1);
            
            flattened.push({
              bundle: bundle.name,
              recipe: recipe.name,
              prompt_message: prompt.prompt_message,
              target: prompt.target,
              response: prompt.response,
              score: prompt.score,
              notes: prompt.notes,
              id: generatedId,
              verdict: null // Initialize verdict field
            });
          }
        });
      });
    });
    
    // Check for duplicate IDs
    const duplicateIds = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
    if (duplicateIds.length > 0) {
      console.warn('⚠️ WARNING: Found duplicate IDs in flattened data:', duplicateIds);
      duplicateIds.forEach(([duplicateId, count]) => {
        console.warn(`  ID "${duplicateId}" appears ${count} times`);
      });
    }
    
    console.log('Flattened data generated with', flattened.length, 'items');
    return flattened;
  }, [data]);

  // Filter states
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedScores, setSelectedScores] = useState(['0', '1']); // Initialize with both scores
  const [isFilterOpen, setIsFilterOpen] = useState(null); // Can be 'bundle', 'recipe', 'verdict', or null

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const filterElements = document.querySelectorAll('.filter-group');
      let clickedInside = false;
      
      filterElements.forEach(element => {
        if (element.contains(event.target)) {
          clickedInside = true;
        }
      });

      if (!clickedInside) {
        setIsFilterOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && editingPrompt) {
        setEditingPrompt(null);
        setEditNote('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [editingPrompt]);

  // Close edit popup when clicking outside (handled by overlay click)
  // The overlay click handler will close the popup, so we don't need this useEffect anymore

  // Position popup when it opens
  useEffect(() => {
    console.log('Positioning useEffect triggered, editingPrompt:', editingPrompt);
    if (editingPrompt && editDropdownRef.current) {
      console.log('Found editDropdownRef, looking for trigger element');
      // Find the trigger element that was clicked
      const triggerElement = document.querySelector(`[data-row-id="${editingPrompt}"] .notes-dropdown-trigger`);
      console.log('Trigger element found:', triggerElement);
      if (triggerElement) {
        const rect = triggerElement.getBoundingClientRect();
        console.log('Trigger element rect:', rect);
        editDropdownRef.current.style.top = `${rect.bottom + window.scrollY + 4}px`;
        editDropdownRef.current.style.left = `${rect.left + window.scrollX}px`;
        console.log('Positioned popup at:', rect.bottom + window.scrollY + 4, rect.left + window.scrollX);
      }
    }
  }, [editingPrompt]);

  // Get unique values for dropdowns
  const uniqueBundles = useMemo(() => {
    const bundles = new Set(flattenedData.map(item => item.bundle));
    return Array.from(bundles).sort();
  }, [flattenedData]);

  const uniqueRecipes = useMemo(() => {
    const recipes = new Set(flattenedData.map(item => item.recipe));
    return Array.from(recipes).sort();
  }, [flattenedData]);

  // Initialize selected values when data changes
  useEffect(() => {
    if (uniqueBundles.length > 0 && selectedBundles.length === 0) {
      setSelectedBundles(uniqueBundles);
    }
    if (uniqueRecipes.length > 0 && selectedRecipes.length === 0) {
      setSelectedRecipes(uniqueRecipes);
    }
  }, [uniqueBundles, uniqueRecipes]);

  // Configure table
  const table = useReactTable({
    data: flattenedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value == null) return false;
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    },
  });

  // Data processing is now handled by TanStack Table
  return (
    <div className="data-table-section">
      <div className="prompts-count">
        {calculateTotalPromptCount(bundleItems).toLocaleString()} prompts
      </div>

      {/* View Control */}
      <div className="view-controls" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid var(--slate-200)'
      }}>
        <div className="view-toggle" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            className={`toggle-button ${(selectedView || 'table') === 'table' ? 'active' : ''}`}
            onClick={() => setSelectedView && setSelectedView('table')}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--slate-200)',
              background: selectedView === 'table' ? 'var(--slate-100)' : 'var(--white)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '14px',
              color: selectedView === 'table' ? 'var(--slate-700)' : 'var(--slate-500)',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
              <path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 6V14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Compact View
          </button>
                      <button
              className={`toggle-button ${(selectedView || 'table') === 'list' ? 'active' : ''}`}
              onClick={() => setSelectedView && setSelectedView('list')}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--slate-200)',
              background: selectedView === 'list' ? 'var(--slate-100)' : 'var(--white)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '14px',
              color: selectedView === 'list' ? 'var(--slate-700)' : 'var(--slate-500)',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: '6px' }}>
              <path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 10H14" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Expanded View
          </button>
        </div>
      </div>

      {/* Global Search */}
      <div style={{ 
        padding: '16px 0',
        borderBottom: '1px solid var(--slate-200)'
      }}>
        <div style={{
          position: 'relative',
          maxWidth: '400px'
        }}>
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search in all columns..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          />
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--slate-400)'
            }}
          >
            <path d="M14 14L10 10M11.3333 6.66667C11.3333 9.244 9.244 11.3333 6.66667 11.3333C4.08934 11.3333 2 9.244 2 6.66667C2 4.08934 4.08934 2 6.66667 2C9.244 2 11.3333 4.08934 11.3333 6.66667Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-section" style={{ 
        display: 'flex', 
        gap: '16px', 
        padding: '16px 0',
        alignItems: 'flex-start'
      }}>
        {/* Bundle Filter */}
        <div className="filter-group" style={{ position: 'relative', minWidth: '200px' }}>
          <div 
            onClick={() => setIsFilterOpen(isFilterOpen === 'bundle' ? null : 'bundle')}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '1px solid var(--slate-300)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white'
              }}>
                {selectedBundles.length !== uniqueBundles.length && (
                  <span style={{ color: '#000000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              <span>Bundles ({selectedBundles.length})</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
              transform: isFilterOpen === 'bundle' ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {isFilterOpen === 'bundle' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {uniqueBundles.map(bundle => (
                <div
                  key={bundle}
                  onClick={() => {
                    const newSelected = selectedBundles.includes(bundle)
                      ? selectedBundles.filter(b => b !== bundle)
                      : [...selectedBundles, bundle];
                    setSelectedBundles(newSelected);
                    table.getColumn('bundle')?.setFilterValue(
                      newSelected.length === uniqueBundles.length ? '' : newSelected
                    );
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: 'var(--slate-700)',
                    ':hover': {
                      backgroundColor: 'var(--slate-50)'
                    }
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedBundles.includes(bundle) ? 'var(--blue-500)' : 'white'
                  }}>
                    {selectedBundles.includes(bundle) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {bundle}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipe Filter */}
        <div className="filter-group" style={{ position: 'relative', minWidth: '200px' }}>
          <div 
            onClick={() => setIsFilterOpen(isFilterOpen === 'recipe' ? null : 'recipe')}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '1px solid var(--slate-300)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white'
              }}>
                {selectedRecipes.length !== uniqueRecipes.length && (
                  <span style={{ color: '#000000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              <span>Recipe ({selectedRecipes.length})</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
              transform: isFilterOpen === 'recipe' ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {isFilterOpen === 'recipe' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {uniqueRecipes.map(recipe => (
                <div
                  key={recipe}
                  onClick={() => {
                    const newSelected = selectedRecipes.includes(recipe)
                      ? selectedRecipes.filter(r => r !== recipe)
                      : [...selectedRecipes, recipe];
                    setSelectedRecipes(newSelected);
                    table.getColumn('recipe')?.setFilterValue(
                      newSelected.length === uniqueRecipes.length ? '' : newSelected
                    );
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: 'var(--slate-700)',
                    ':hover': {
                      backgroundColor: 'var(--slate-50)'
                    }
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedRecipes.includes(recipe) ? 'var(--blue-500)' : 'white'
                  }}>
                    {selectedRecipes.includes(recipe) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {recipe}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verdict Filter */}
        <div className="filter-group" style={{ position: 'relative', minWidth: '150px' }}>
          <div 
            onClick={() => setIsFilterOpen(isFilterOpen === 'verdict' ? null : 'verdict')}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '1px solid var(--slate-300)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white'
              }}>
                {selectedScores.length !== 2 && (
                  <span style={{ color: '#000000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                )}
              </div>
              <span>Verdict ({selectedScores.length})</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
              transform: isFilterOpen === 'verdict' ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {isFilterOpen === 'verdict' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--slate-200)',
              borderRadius: '6px',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              {[
                { value: '1', label: 'True' },
                { value: '0', label: 'False' }
              ].map(option => (
                <div
                  key={option.value}
                  onClick={() => {
                    const newSelected = selectedScores.includes(option.value)
                      ? selectedScores.filter(s => s !== option.value)
                      : [...selectedScores, option.value];
                    setSelectedScores(newSelected);
                    table.getColumn('score')?.setFilterValue(
                      newSelected.length === 2 ? '' : newSelected
                    );
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: 'var(--slate-700)',
                    ':hover': {
                      backgroundColor: 'var(--slate-50)'
                    }
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '1px solid var(--slate-300)',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selectedScores.includes(option.value) ? 'var(--blue-500)' : 'white'
                  }}>
                    {selectedScores.includes(option.value) && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading data...</span>
          </div>
        ) : error ? (
          <div className="error-state">Error: {error}</div>
        ) : flattenedData.length === 0 ? (
          <div className="empty-state">No data available</div>
        ) : (
          // Both Table and List View use the same table structure, but List View expands rows
          <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: table.getAllColumns().map(col => `${col.columnDef.size}fr`).join(' '), gap: '24px', padding: '8px 24px', background: 'var(--slate-100)', borderBottom: '1px solid var(--slate-200)' }}>
              {table.getHeaderGroups().map(headerGroup => (
                <React.Fragment key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <div
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`header-cell ${header.column.getIsSorted() ? 'sorted' : ''}`}
                      style={{
                        color: 'var(--slate-500)',
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: header.column.columnDef.accessorKey === 'score' ? '2px' : '4px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        minWidth: 0,
                        justifyContent: header.column.columnDef.accessorKey === 'score' ? 'center' : 'flex-start'
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <svg 
                          width={header.column.columnDef.accessorKey === 'score' ? "24" : "20"} 
                          height={header.column.columnDef.accessorKey === 'score' ? "24" : "20"} 
                          viewBox="0 0 16 16" 
                          fill="none"
                          style={{
                            transform: header.column.getIsSorted() === 'desc' ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s ease',
                            marginLeft: header.column.columnDef.accessorKey === 'score' ? '0px' : '2px'
                          }}
                        >
                          <path d="M8 3L3 9H13L8 3Z" fill="currentColor"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
            <div className="table-body">
              {table.getRowModel().rows.map((row, index) => (
                <div
                  key={row.id}
                  className={`table-row ${index === 0 ? 'highlighted-row' : ''}`}
                  data-row-id={row.original.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: table.getAllColumns().map(col => `${col.columnDef.size}fr`).join(' '),
                    gap: '24px',
                    padding: (selectedView || 'table') === 'list' ? '16px 24px' : '8px 24px',
                    borderBottom: '1px solid var(--slate-200)',
                    background: 'var(--white)',
                    alignItems: (selectedView || 'table') === 'list' ? 'flex-start' : 'center'
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <div
                      key={cell.id}
                      className="table-cell"
                      style={{
                        fontSize: '14px',
                        color: 'var(--slate-700)',
                        overflow: (selectedView || 'table') === 'list' ? 'visible' : 'hidden',
                        textOverflow: (selectedView || 'table') === 'list' ? 'clip' : 'ellipsis',
                        whiteSpace: (selectedView || 'table') === 'list' ? 'pre-wrap' : 'nowrap',
                        minWidth: 0,
                        lineHeight: (selectedView || 'table') === 'list' ? '1.5' : '1',
                        wordBreak: (selectedView || 'table') === 'list' ? 'break-word' : 'normal'
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Notes Edit Popup - rendered at document level */}
      {editingPrompt && (
        <div className="notes-popup-overlay" onClick={() => setEditingPrompt(null)}>
          <div
            ref={editDropdownRef}
            className="notes-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notes-popup-header">
              <h4>Edit Notes</h4>
              <button
                className="notes-popup-close"
                onClick={() => setEditingPrompt(null)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <textarea
              className="notes-textarea"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Enter notes..."
              autoFocus
            />
            <div className="notes-actions">
              <button
                className="notes-button notes-button-cancel"
                onClick={() => {
                  setEditingPrompt(null);
                  setEditNote('');
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onSaveNote) {
                    setIsSaving(true);
                    try {
                      await onSaveNote(editingPrompt, editNote);
                    } finally {
                      setIsSaving(false);
                    }
                  }
                  setEditingPrompt(null);
                  setEditNote('');
                }}
                className="notes-button notes-button-save"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// API endpoint configuration
const API_URL = 'http://localhost:8000/api/bundles';

const TestReport = () => {
  const [selectedView, setSelectedView] = useState('table');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundleItems, setBundleItems] = useState([]);
  
  // For debugging
  useEffect(() => {
    console.log('Bundle items updated:', bundleItems);
    
    // Check for potential duplicate prompts that could cause ID conflicts
    if (bundleItems.length > 0) {
      const allPrompts = [];
      bundleItems.forEach(bundle => {
        bundle.recipes?.forEach(recipe => {
          recipe.prompts?.forEach(prompt => {
            allPrompts.push({
              bundle: bundle.name,
              recipe: recipe.name,
              prompt_message: prompt.prompt_message,
              id: prompt.id
            });
          });
        });
      });
      
      // Check for duplicate prompt messages within the same bundle/recipe combination
      const promptGroups = new Map();
      allPrompts.forEach(prompt => {
        const key = `${prompt.bundle}-${prompt.recipe}-${prompt.prompt_message}`;
        if (!promptGroups.has(key)) {
          promptGroups.set(key, []);
        }
        promptGroups.get(key).push(prompt);
      });
      
      const duplicates = Array.from(promptGroups.entries()).filter(([, prompts]) => prompts.length > 1);
      if (duplicates.length > 0) {
        console.warn('🔍 Found potential duplicate prompts that could cause ID conflicts:');
        duplicates.forEach(([duplicateKey, prompts]) => {
          console.warn(`  Key: "${duplicateKey}" appears ${prompts.length} times:`, prompts);
        });
      }
    }
  }, [bundleItems]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBundles, setSelectedBundles] = useState([]);
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [selectedScores, setSelectedScores] = useState([0, 1]);  // Default scores can be set immediately

  // State to store user verdicts for each item
  const [userVerdicts, setUserVerdicts] = useState(new Map());

  // Helper function to get adjusted score for percentage calculations
  const getAdjustedScore = (originalScore, verdict) => {
    if (verdict === 'down') {
      // If user disagrees, invert the score: 0 becomes 1, 1 becomes 0
      return originalScore === 1 ? 0 : 1;
    }
    // If user agrees or no verdict, use original score
    return originalScore;
  };

  // Helper function to count how many scores have been adjusted
  const getAdjustedScoreCount = () => {
    let count = 0;
    userVerdicts.forEach((verdict) => {
      if (verdict === 'down') {
        count++;
      }
    });
    return count;
  };

  // Helper function to calculate adjusted total score for a recipe
  const getAdjustedRecipeTotalScore = (recipe, bundleName) => {
    if (!recipe.prompts || recipe.prompts.length === 0) return 0;
    
    return recipe.prompts.reduce((sum, prompt, promptIndex) => {
      // Generate the same ID that was used in flattenedData
      const generatedId = prompt.id || `${bundleName}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
      
      // Get user verdict for this prompt
      const verdict = userVerdicts.get(generatedId);
      
      // Use adjusted score for calculation
      const adjustedScore = getAdjustedScore(prompt.score, verdict);
      
      return sum + adjustedScore;
    }, 0);
  };

  // Function to calculate recipe percentage based on scores
  const calculateRecipePercentage = (recipe) => {
    console.log('Calculating recipe percentage for:', recipe.name, 'with prompts:', recipe.prompts);
    if (!recipe.prompts || recipe.prompts.length === 0) {
      console.log('No prompts found for recipe:', recipe.name);
      return 0;
    }
    
    const totalScore = recipe.prompts.reduce((sum, prompt) => {
      // Generate the same ID that was used in flattenedData
      const promptIndex = recipe.prompts.indexOf(prompt);
      const generatedId = prompt.id || `${recipe.bundle || 'unknown'}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
      
      // Get user verdict for this prompt
      const verdict = userVerdicts.get(generatedId);
      
      // Use adjusted score for calculation
      const adjustedScore = getAdjustedScore(prompt.score, verdict);
      
      console.log(`Prompt ${generatedId}: original score=${prompt.score}, verdict=${verdict}, adjusted score=${adjustedScore}`);
      
      return sum + adjustedScore;
    }, 0);
    
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
  const bundleFilterRef = useRef(null);
  const recipeFilterRef = useRef(null);
  const scoreFilterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideAll = 
        (!bundleFilterRef.current || !bundleFilterRef.current.contains(event.target)) &&
        (!recipeFilterRef.current || !recipeFilterRef.current.contains(event.target)) &&
        (!scoreFilterRef.current || !scoreFilterRef.current.contains(event.target));

      if (clickedOutsideAll) {
        setIsFilterOpen(null);
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

  const handleVote = async (itemId, voteType) => {
    try {
      // Store the verdict in local state
      setUserVerdicts(prev => {
        const newVerdicts = new Map(prev);
        if (voteType === null) {
          newVerdicts.delete(itemId);
        } else {
          newVerdicts.set(itemId, voteType);
        }
        return newVerdicts;
      });

      // Here you would typically make an API call to save the vote
      console.log(`Voting ${voteType} on item ${itemId}`);
      
      // For now, we'll just log the vote
      // In a real application, you would:
      // 1. Send the vote to your backend
      // 2. Update the database
      // 3. Optionally refresh the data or update local state
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Vote ${voteType} saved successfully for item ${itemId}`);
    } catch (error) {
      console.error('Failed to save vote:', error);
      throw error; // Re-throw to let VotingButtons handle the error
    }
  };

  const handleSaveNote = async (itemId, note) => {
    try {
      console.log(`Saving note for prompt ${itemId}:`, note);
      
      // Debug: Log the current bundle items structure
      console.log('Current bundle items structure:', JSON.stringify(bundleItems, null, 2));
      
      // Update the local state first for immediate UI feedback
      setBundleItems(prevBundleItems => {
        let foundMatch = false;
        let matchCount = 0;
        
        let promptIndex = 0;
        const updatedBundleItems = prevBundleItems.map(bundle => ({
          ...bundle,
          recipes: bundle.recipes.map(recipe => ({
            ...recipe,
            prompts: recipe.prompts.map(prompt => {
              // Use the same ID generation logic as in flattenedData
              const promptId = prompt.id || `${bundle.name}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
              promptIndex++;
              
              // Debug: Log each prompt ID comparison
              console.log(`Comparing promptId: "${promptId}" with itemId: "${itemId}"`);
              
              if (promptId === itemId) {
                matchCount++;
                foundMatch = true;
                console.log(`Found match ${matchCount} for prompt:`, prompt);
                return { ...prompt, notes: note };
              }
              return prompt;
            })
          }))
        }));
        
        console.log(`Total matches found: ${matchCount}`);
        if (matchCount > 1) {
          console.warn(`⚠️ WARNING: Found ${matchCount} prompts with the same ID! This could cause notes to be saved to multiple items.`);
        }
        if (!foundMatch) {
          console.error(`❌ ERROR: No prompt found with ID "${itemId}"`);
        }
        
        return updatedBundleItems;
      });
      
      // Here you would typically make an API call to save the note to your backend
      // Example API call (uncomment and modify as needed):
      /*
      const response = await fetch(`/api/prompts/${itemId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: note }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note to backend');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Note saved successfully for prompt ${itemId}`);
      
      // Show success feedback to user (optional)
      // You could add a toast notification here
      
    } catch (error) {
      console.error('Failed to save note:', error);
      
      // Revert the local state change if backend save failed
      // You could add error handling UI here
      
      // For now, just log the error
      console.error('Note save failed, local state reverted');
    }
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
                      <span>{(() => {
                        if (!bundle.recipes || bundle.recipes.length === 0) return '0%';
                        let totalScore = 0;
                        let totalPrompts = 0;
                        bundle.recipes.forEach(recipe => {
                          if (recipe.prompts && recipe.prompts.length > 0) {
                            const recipeTotalScore = getAdjustedRecipeTotalScore(recipe, bundle.name);
                            totalScore += recipeTotalScore;
                            totalPrompts += recipe.prompts.length;
                          }
                        });
                        if (totalPrompts === 0) return '0%';
                        const averageScore = totalScore / totalPrompts;
                        return Math.round(averageScore * 100) + '%';
                      })()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="divider"></div>
          <div className="metric-group">
            <span className="metric-label">Confidence</span>
            <span className="metric-value">{(() => {
              if (!bundleItems || bundleItems.length === 0) return '0%';
              let totalScore = 0;
              let totalPrompts = 0;
              bundleItems.forEach(bundle => {
                bundle.recipes.forEach(recipe => {
                  recipe.prompts.forEach((prompt, promptIndex) => {
                    // Generate the same ID that was used in flattenedData
                    const generatedId = prompt.id || `${bundle.name}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
                    
                    // Get user verdict for this prompt
                    const verdict = userVerdicts.get(generatedId);
                    
                    // Use adjusted score for calculation
                    const adjustedScore = getAdjustedScore(prompt.score, verdict);
                    
                    totalScore += adjustedScore;
                    totalPrompts += 1;
                  });
                });
              });
              if (totalPrompts === 0) return '0%';
              const confidence = totalScore / totalPrompts;
              return Math.round(confidence * 100) + '%';
            })()}</span>
          </div>
          <div className="divider"></div>
          <div className="metric-group">
            <span className="metric-label">Prompts</span>
            <div className="prompts-content">
              <span className="prompt-count">{calculateTotalPromptCount(bundleItems).toLocaleString()}</span>
              <span className="score-adjusted">{getAdjustedScoreCount()} score{getAdjustedScoreCount() !== 1 ? 's' : ''} adjusted</span>
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
                          <span>{(() => {
                            if (!bundle.recipes || bundle.recipes.length === 0) return '0%';
                            let totalScore = 0;
                            let totalPrompts = 0;
                            bundle.recipes.forEach(recipe => {
                              if (recipe.prompts && recipe.prompts.length > 0) {
                                const recipeTotalScore = getAdjustedRecipeTotalScore(recipe, bundle.name);
                                totalScore += recipeTotalScore;
                                totalPrompts += recipe.prompts.length;
                              }
                            });
                            if (totalPrompts === 0) return '0%';
                            const averageScore = totalScore / totalPrompts;
                            return Math.round(averageScore * 100) + '%';
                          })()}</span>
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
                      <div style={{ height: '200px', width: '100%' }}>
                        {(() => {
                          const chartData = {
                            labels: bundle.recipes.map(recipe => recipe.name),
                            datasets: [
                              {
                                label: 'Recipe Performance',
                                data: bundle.recipes.map(recipe => {
                                  if (!recipe.prompts || recipe.prompts.length === 0) return 0;
                                  const totalScore = getAdjustedRecipeTotalScore(recipe, bundle.name);
                                  const averageScore = totalScore / recipe.prompts.length;
                                  return Math.round(averageScore * 100); // Convert to percentage
                                }),
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
                              },
                              annotation: {
                                annotations: bundle.recipes.map((recipe, index) => {
                                  // Calculate the recipe percentage for this specific recipe
                                  if (!recipe.prompts || recipe.prompts.length === 0) return null;
                                  const totalScore = getAdjustedRecipeTotalScore(recipe, bundle.name);
                                  const recipePercentage = (totalScore / recipe.prompts.length) * 100;
                                  
                                  // Calculate confidence interval bounds relative to the recipe percentage
                                  const xMin = Math.max(0, recipePercentage - (recipe.ci_minimum_band || 0));
                                  const xMax = Math.min(100, recipePercentage + (recipe.ci_maximum_band || 0));
                                  
                                  return {
                                    type: 'box',
                                    xMin: xMin,
                                    xMax: xMax,
                                    yMin: index - 0.3,
                                    yMax: index + 0.3,
                                    backgroundColor: 'transparent',
                                    borderColor: 'rgba(0, 0, 0, 1.0)',
                                    borderWidth: 2,
                                    drawTime: 'afterDatasetsDraw'
                                  };
                                }).filter(annotation => annotation !== null) // Remove null annotations
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
                                barThickness: 'flex', // Allow bars to be flexible width
                                maxBarThickness: 20, // Maximum bar thickness
                              }
                            },
                            datasets: {
                              bar: {
                                categoryPercentage: 0.8, // Increase space between categories
                                barPercentage: 0.5, // Increase bar width within category space
                              }
                            }

                          };

                          return <Bar data={chartData} options={options} />;
                        })()}
                      </div>
                    </div>
                    <div className="confidence-legend">
                      <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
                        <circle cx="6.5" cy="6" r="5.5" stroke="#334155" strokeDasharray="2 2"/>
                      </svg>
                      <span>Confidence Interval</span>
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
              selectedView={selectedView || 'table'}
              setSelectedView={setSelectedView || (() => {})}
              calculateTotalPromptCount={calculateTotalPromptCount}
              bundleItems={bundleItems}
              onVote={handleVote}
              onSaveNote={handleSaveNote}
              userVerdicts={userVerdicts}
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
                    <span>{(() => {
                      const bundle = bundleItems.find(b => b.name === selectedBundle);
                      if (!bundle || !bundle.recipes || bundle.recipes.length === 0) return '0%';
                      let totalScore = 0;
                      let totalPrompts = 0;
                      bundle.recipes.forEach(recipe => {
                        if (recipe.prompts && recipe.prompts.length > 0) {
                          const recipeTotalScore = getAdjustedRecipeTotalScore(recipe, bundle.name);
                          totalScore += recipeTotalScore;
                          totalPrompts += recipe.prompts.length;
                        }
                      });
                      if (totalPrompts === 0) return '0%';
                      const averageScore = totalScore / totalPrompts;
                      return Math.round(averageScore * 100) + '%';
                    })()}</span>
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
                            <span>{(() => {
                              if (!recipe.prompts || recipe.prompts.length === 0) return '0';
                              const totalScore = getAdjustedRecipeTotalScore(recipe, selectedBundle);
                              const averageScore = totalScore / recipe.prompts.length;
                              return Math.round(averageScore * 100) / 100;
                            })()}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
              <div className="divider"></div>
              <div className="metric-group">
                <span className="metric-label">Confidence</span>
                <span className="metric-value">{(() => {
                  const bundle = bundleItems.find(b => b.name === selectedBundle);
                  if (!bundle || !bundle.recipes || bundle.recipes.length === 0) return '0%';
                  let totalScore = 0;
                  let totalPrompts = 0;
                  bundle.recipes.forEach(recipe => {
                    if (recipe.prompts && recipe.prompts.length > 0) {
                      recipe.prompts.forEach((prompt, promptIndex) => {
                        // Generate the same ID that was used in flattenedData
                        const generatedId = prompt.id || `${bundle.name}-${recipe.name}-${promptIndex}-${prompt.prompt_message.substring(0, 50)}`;
                        
                        // Get user verdict for this prompt
                        const verdict = userVerdicts.get(generatedId);
                        
                        // Use adjusted score for calculation
                        const adjustedScore = getAdjustedScore(prompt.score, verdict);
                        
                        totalScore += adjustedScore;
                        totalPrompts += 1;
                      });
                    }
                  });
                  if (totalPrompts === 0) return '0%';
                  const confidence = totalScore / totalPrompts;
                  return Math.round(confidence * 100) + '%';
                })()}</span>
              </div>
              <div className="divider"></div>
              <div className="metric-group">
                <span className="metric-label">Prompts</span>
                <div className="prompts-content">
                  <span className="prompt-count">{calculateBundlePromptCount(selectedBundle)}</span>
                  <span className="score-adjusted">{getAdjustedScoreCount()} score{getAdjustedScoreCount() !== 1 ? 's' : ''} adjusted</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '24px 0' }}>
              <div style={{ fontSize: '14px', color: 'var(--slate-500)' }}>
                Table temporarily removed for debugging
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReport;
