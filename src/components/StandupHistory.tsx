import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Target,
  AlertCircle,
  Clock
} from 'lucide-react';

interface StandupEntry {
  id: string;
  date: string;
  accomplished: string;
  working_on: string;
  blockers: string;
  goals: string;
  feedback: string;
  answers: Record<string, string>;
}

interface StandupHistoryProps {
  entries: StandupEntry[];
}

const StandupHistory: React.FC<StandupHistoryProps> = ({ entries }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'accomplished' | 'working_on' | 'goals'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    hasBlockers: false,
    dateRange: 'all' as 'all' | 'week' | 'month' | 'quarter'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredEntries, setFilteredEntries] = useState<StandupEntry[]>(entries);

  useEffect(() => {
    applyFiltersAndSort();
  }, [entries, searchQuery, sortField, sortDirection, filters]);

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...entries];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.accomplished.toLowerCase().includes(query) ||
        entry.working_on.toLowerCase().includes(query) ||
        entry.blockers?.toLowerCase().includes(query) ||
        entry.goals.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.hasBlockers) {
      filtered = filtered.filter(entry => entry.blockers && entry.blockers.trim().length > 0);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (filters.dateRange) {
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoff.setMonth(now.getMonth() - 3);
          break;
      }
      filtered = filtered.filter(entry => new Date(entry.date) >= cutoff);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        default:
          comparison = b[sortField].localeCompare(a[sortField]);
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    setFilteredEntries(filtered);
  };

  if (!entries.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No standup history</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start your day by sharing your progress and goals.
          </p>
          <div className="mt-6">
            <Link
              to="/idea-hub/cofounder-bot"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Daily Standup
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-lg font-medium text-gray-900"
          >
            <Calendar className="h-5 w-5 mr-2 text-gray-400" />
            Recent Standups
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 ml-2 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 ml-2 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <>
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standups..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="flex items-center space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasBlockers}
                    onChange={(e) => setFilters(prev => ({ ...prev, hasBlockers: e.target.checked }))}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Has Blockers</span>
                </label>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Date Range:</span>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as typeof filters.dateRange }))}
                    className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="quarter">Past Quarter</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Sort By:</span>
                  <select
                    value={sortField}
                    onChange={(e) => toggleSort(e.target.value as typeof sortField)}
                    className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="date">Date</option>
                    <option value="accomplished">Accomplishments</option>
                    <option value="working_on">Current Work</option>
                    <option value="goals">Goals</option>
                  </select>
                  <button
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1 rounded-md hover:bg-gray-100"
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc className="h-4 w-4 text-gray-400" />
                    ) : (
                      <SortDesc className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Standup Entries */}
          <div className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-6">
                <button
                  onClick={() => toggleEntry(entry.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    {!expandedEntries[entry.id] && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {entry.working_on}
                      </p>
                    )}
                  </div>
                  {expandedEntries[entry.id] ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {expandedEntries[entry.id] && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-2 text-gray-400" />
                        Accomplished
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">{entry.accomplished}</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        Working On
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">{entry.working_on}</p>
                    </div>

                    {entry.blockers && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-gray-400" />
                          Blockers
                        </h5>
                        <p className="mt-1 text-sm text-gray-500">{entry.blockers}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-sm font-medium text-gray-900 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-gray-400" />
                        Goals
                      </h5>
                      <p className="mt-1 text-sm text-gray-500">{entry.goals}</p>
                    </div>

                    {entry.feedback && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">AI Analysis</h5>
                        <div className="mt-1 text-sm text-gray-500 whitespace-pre-wrap rounded-lg bg-gray-50 p-4">
                          {(() => {
                            try {
                              const feedbackObj = JSON.parse(entry.feedback);
                              const insights = feedbackObj.insights;
                              return `🎯 Key Insights

${insights.strengths.length > 0 ? `Strengths:
${insights.strengths.map(s => `• ${s}`).join('\n')}

` : ''}${insights.areas_for_improvement.length > 0 ? `Areas for Improvement:
${insights.areas_for_improvement.map(a => `• ${a}`).join('\n')}

` : ''}${insights.opportunities.length > 0 ? `Opportunities:
${insights.opportunities.map(o => `• ${o}`).join('\n')}

` : ''}${insights.risks.length > 0 ? `Risks:
${insights.risks.map(r => `• ${r}`).join('\n')}

` : ''}${insights.strategic_recommendations.length > 0 ? `Strategic Recommendations:
${insights.strategic_recommendations.map(r => `• ${r}`).join('\n')}` : ''}`;
                            } catch (e) {
                              return '';
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StandupHistory;