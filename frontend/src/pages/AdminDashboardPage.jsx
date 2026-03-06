import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, featureFlagsAPI } from '../lib/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Calendar, MapPin, UserCheck, UserPlus, Settings, ToggleLeft, ToggleRight, Eye, EyeOff, Shield, FileText, Edit3, Save, X, History, User, Clock, CheckCircle, MessageSquare, Flag } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AdminDashboardPage() {
  const getNextVersion = (currentVersion) => {
    if (!currentVersion) return '1.0';
    const parts = currentVersion.split('.');
    const nums = parts.map(p => Number.isFinite(Number(p)) ? Number(p) : p);
    // Increment last numeric segment
    for (let i = parts.length - 1; i >= 0; i--) {
      const n = Number(parts[i]);
      if (!Number.isNaN(n)) {
        const next = n + 1;
        return [...parts.slice(0, i), String(next), ...parts.slice(i + 1)].join('.');
      }
    }
    // Fallback: append .1
    return `${currentVersion}.1`;
  };
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Agreement management state
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    agreementText: '',
    version: '',
    changeDescription: ''
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historyType, setHistoryType] = useState('USER');

  // Fetch user statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await adminAPI.getUserStats();
      return response.data;
    },
  });

  // Fetch recent users
  const { data: recentUsers, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['adminRecentUsers'],
    queryFn: async () => {
      const response = await adminAPI.getRecentUsers(20);
      return response.data;
    },
  });

  // Fetch feature flags
  const { data: featureFlags, isLoading: flagsLoading, error: flagsError } = useQuery({
    queryKey: ['adminFeatureFlags'],
    queryFn: async () => {
      const response = await featureFlagsAPI.getAllFeatureFlags();
      return response;
    },
  });

  const { data: feedbackList } = useQuery({
    queryKey: ['adminFeedback'],
    queryFn: async () => {
      const response = await adminAPI.getFeedback();
      return response.data || response;
    },
    enabled: activeTab === 'feedback',
  });

  // Agreement queries
  const { data: currentUserAgreement } = useQuery({
    queryKey: ['admin-current-agreement', 'USER'],
    queryFn: async () => {
      const response = await adminAPI.getCurrentAgreement('USER');
      return response.data;
    },
    enabled: activeTab === 'agreements' && !isEditing,
  });

  const { data: currentOrganiserAgreement } = useQuery({
    queryKey: ['admin-current-agreement', 'ORGANISER'],
    queryFn: async () => {
      const response = await adminAPI.getCurrentAgreement('ORGANISER');
      return response.data;
    },
    enabled: activeTab === 'agreements' && !isEditing,
  });

  // Fetch history when requested
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['admin-agreement-history', historyType],
    queryFn: async () => {
      const response = await adminAPI.getAgreementHistory(historyType, 20);
      return response.data;
    },
    enabled: showHistory && activeTab === 'agreements',
  });

  // Update feature flag mutation
  const updateFlagMutation = useMutation({
    mutationFn: async ({ flagKey, isEnabled }) => {
      return await featureFlagsAPI.updateFeatureFlag(flagKey, isEnabled);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['adminFeatureFlags']);
      queryClient.invalidateQueries(['featureFlags']);
      toast.success(`Feature flag "${variables.flagKey}" ${variables.isEnabled ? 'enabled' : 'disabled'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update feature flag: ' + (error.message || 'Unknown error'));
    },
  });

  // Update agreement mutation
  const updateAgreementMutation = useMutation({
    mutationFn: async (data) => {
      const response = await adminAPI.updateAgreement(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Agreement updated successfully!');
      setIsEditing(false);
      setSelectedAgreement(null);
      queryClient.invalidateQueries(['admin-current-agreement']);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update agreement');
    }
  });

  // Agreement management functions
  const handleEdit = (agreement) => {
    setSelectedAgreement(agreement);
    setEditForm({
      agreementText: agreement.agreementText,
      version: getNextVersion(agreement.version),
      changeDescription: ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedAgreement || !editForm.agreementText.trim()) {
      toast.error('Agreement text is required');
      return;
    }
    if (!editForm.version.trim()) {
      toast.error('Version is required');
      return;
    }
    if (!editForm.changeDescription.trim()) {
      toast.error('Change description is required');
      return;
    }

    const updateData = {
      agreementType: selectedAgreement.agreementType,
      agreementText: editForm.agreementText,
      version: editForm.version || undefined,
      changeDescription: editForm.changeDescription || undefined
    };

    updateAgreementMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedAgreement(null);
    setEditForm({ agreementText: '', version: '', changeDescription: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAgreementTypeIcon = (type) => {
    return type === 'USER' ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />;
  };

  const getAgreementTypeColor = (type) => {
    return type === 'USER' 
      ? 'from-purple-500 to-pink-500' 
      : 'from-orange-500 to-pink-500';
  };

  if (statsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || usersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  // Stat cards data
  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      change: `+${stats?.newUsersThisMonth || 0} this month`,
    },
    {
      title: 'New Today',
      value: stats?.newUsersToday || 0,
      icon: UserPlus,
      gradient: 'from-pink-500 to-orange-500',
      change: `+${stats?.newUsersThisWeek || 0} this week`,
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Calendar,
      gradient: 'from-orange-500 to-amber-500',
      change: 'All time',
    },
    {
      title: 'Total Groups',
      value: stats?.totalGroups || 0,
      icon: MapPin,
      gradient: 'from-emerald-500 to-teal-500',
      change: 'Active groups',
    },
    {
      title: 'Organisers',
      value: stats?.totalOrganisers || 0,
      icon: UserCheck,
      gradient: 'from-blue-500 to-indigo-500',
      change: 'Creating events',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-purple-500',
      change: 'Last 30 days',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Monitor platform growth and manage system settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex gap-2">
            {[
              { key: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
              { key: 'feature-flags', icon: Settings, label: 'Feature Flags' },
              { key: 'agreements', icon: Shield, label: 'Agreements' },
              { key: 'feedback', icon: MessageSquare, label: 'Feedback' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center justify-center px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label={label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
                <h3 className="text-gray-600 font-medium mb-1">{stat.title}</h3>
                <p className="text-sm text-gray-500">{stat.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Signups Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Signups (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.dailySignups || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="url(#colorGradient)" 
                  strokeWidth={3}
                  dot={{ fill: '#9333ea', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="New Users"
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* User Activity Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Users', value: stats?.totalUsers || 0 },
                { name: 'Events', value: stats?.totalEvents || 0 },
                { name: 'Groups', value: stats?.totalGroups || 0 },
                { name: 'Organisers', value: stats?.totalOrganisers || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent User Signups</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profilePhotoUrl ? (
                            <img className="h-10 w-10 rounded-full" src={user.profilePhotoUrl} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{user.displayName || 'Anonymous'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-[200px]">{user.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {user.hasOrganiserRole ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                          Organiser
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Member
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-3">
                        <span title="Groups Joined">🏔️ {user.groupsJoined}</span>
                        <span title="Events Joined">📅 {user.eventsJoined}</span>
                        {user.hasOrganiserRole && (
                          <>
                            <span title="Groups Created">🎯 {user.groupsCreated}</span>
                            <span title="Events Created">✨ {user.eventsCreated}</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* Feature Flags Tab Content */}
        {activeTab === 'feature-flags' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Feature Flag Management</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <Settings className="w-4 h-4 mr-2" />
                  Control platform features
                </div>
              </div>
              
              {flagsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Loading feature flags...</span>
                </div>
              ) : flagsError ? (
                <div className="text-center py-12">
                  <div className="text-red-600 text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load feature flags</h3>
                  <p className="text-gray-600">Please try refreshing the page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {featureFlags?.map((flag) => (
                    <div
                      key={flag.flagKey}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{flag.flagName}</h3>
                          <span className="text-[11px] sm:text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {flag.flagKey}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{flag.description}</p>
                        {flag.updatedByEmail && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated by {flag.updatedByEmail} on{' '}
                            {format(new Date(flag.updatedAt), 'MMM dd, yyyy at h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 ml-0 sm:ml-6">
                        <div className="flex items-center gap-1.5">
                          {flag.isEnabled ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${flag.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {flag.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <button
                          onClick={() => updateFlagMutation.mutate({
                            flagKey: flag.flagKey,
                            isEnabled: !flag.isEnabled
                          })}
                          disabled={updateFlagMutation.isLoading}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            flag.isEnabled ? 'bg-purple-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {featureFlags?.length === 0 && (
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No feature flags found</h3>
                      <p className="text-gray-600">Feature flags will appear here when they are created.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Feature Flag Legend */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 rounded-full p-1">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Feature Flag Information</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Toggle feature flags to enable or disable platform features in real-time. Changes take effect immediately 
                    across the application. Use caution when disabling core features as it may affect user experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agreements Tab Content */}
        {activeTab === 'agreements' && (
          <div className="space-y-6">
            {/* Current Agreements */}
            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* User Agreement Card */}
                {currentUserAgreement && (
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getAgreementTypeColor('USER')} rounded-lg flex items-center justify-center`}>
                          {getAgreementTypeIcon('USER')}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">User Agreement</h3>
                          <p className="text-sm text-gray-500">Version {currentUserAgreement.version}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(currentUserAgreement)}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all w-full sm:w-auto"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Effective: {formatDate(currentUserAgreement.effectiveDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {formatDate(currentUserAgreement.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                      {currentUserAgreement.agreementText}
                    </div>
                  </div>
                )}

                {/* Organiser Agreement Card */}
                {currentOrganiserAgreement && (
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${getAgreementTypeColor('ORGANISER')} rounded-lg flex items-center justify-center`}>
                          {getAgreementTypeIcon('ORGANISER')}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Organiser Agreement</h3>
                          <p className="text-sm text-gray-500">Version {currentOrganiserAgreement.version}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(currentOrganiserAgreement)}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white rounded-lg hover:from-orange-600 hover:to-pink-700 transition-all w-full sm:w-auto"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Effective: {formatDate(currentOrganiserAgreement.effectiveDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {formatDate(currentOrganiserAgreement.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                      {currentOrganiserAgreement.agreementText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Form */}
            {isEditing && selectedAgreement && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${getAgreementTypeColor(selectedAgreement.agreementType)} rounded-lg flex items-center justify-center`}>
                      {getAgreementTypeIcon(selectedAgreement.agreementType)}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Edit {selectedAgreement.agreementType === 'USER' ? 'User' : 'Organiser'} Agreement
                    </h3>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto justify-center"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateAgreementMutation.isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 w-full sm:w-auto justify-center"
                    >
                      <Save className="w-4 h-4" />
                      <span>{updateAgreementMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Version and Description */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Version <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.version}
                        onChange={(e) => setEditForm(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Auto-generated if empty"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Prefilled with next version; required; supports Markdown in the Agreement Text below.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.changeDescription}
                        onChange={(e) => setEditForm(prev => ({ ...prev, changeDescription: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Brief description of changes"
                        required
                      />
                    </div>
                  </div>

                  {/* Agreement Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreement Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={editForm.agreementText}
                      onChange={(e) => setEditForm(prev => ({ ...prev, agreementText: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                      rows={20}
                      placeholder="Enter the agreement text..."
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Supports Markdown formatting
                      </p>
                      <p className="text-xs text-gray-500">
                        {editForm.agreementText.length} characters
                      </p>
                    </div>
                    <div className="mt-4 border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-[70vh] min-h-[40vh] overflow-y-auto">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Live Preview</p>
                      <div className="markdown-preview text-gray-800 text-sm sm:text-base leading-relaxed">
                        <ReactMarkdown>{editForm.agreementText || '*Preview will appear here*'}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History Section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Agreement History</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryType('USER')}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      historyType === 'USER'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    User
                  </button>
                  <button
                    onClick={() => setHistoryType('ORGANISER')}
                    className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      historyType === 'ORGANISER'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Org
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">{showHistory ? 'Hide History' : 'View History'}</span>
                    <span className="sm:hidden">{showHistory ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {showHistory && (
                <>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Loading history...</span>
                    </div>
                  ) : historyData?.length > 0 ? (
                    <div className="space-y-3">
                      {historyData.map((version) => (
                        <div key={version.version} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 bg-gradient-to-br ${getAgreementTypeColor(version.agreementType)} rounded flex items-center justify-center`}>
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-gray-900">v{version.version}</span>
                              {version.changeDescription && (
                                <span className="text-xs text-gray-600 line-clamp-1">· {version.changeDescription}</span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">{formatDate(version.effectiveDate)}</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded line-clamp-3 sm:line-clamp-4">
                            {version.agreementText}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No history found for {historyType.toLowerCase()} agreements</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Feedback inbox</p>
                <p className="text-xs text-gray-500">Submissions from the in-app feedback button.</p>
              </div>
              <Flag className="h-5 w-5 text-purple-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Summary</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Priority</th>
                    <th className="py-2 pr-4">Reporter</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList?.map((fb) => (
                    <tr key={fb.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-gray-700">{fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ''}</td>
                      <td className="py-2 pr-4 font-semibold text-purple-700">{fb.type}</td>
                      <td className="py-2 pr-4 text-gray-800">{fb.summary}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{fb.status}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          fb.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          fb.priority === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {fb.priority}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{fb.memberName || fb.email || 'Anonymous'}</td>
                      <td className="py-2 pr-4 flex items-center gap-2">
                        <select
                          className="border border-gray-200 rounded-md text-xs px-2 py-1"
                          value={fb.status}
                          onChange={async (e) => {
                            try {
                              await adminAPI.updateFeedback(fb.id, { status: e.target.value })
                              queryClient.invalidateQueries(['adminFeedback'])
                              toast.success('Status updated')
                            } catch {
                              toast.error('Update failed')
                            }
                          }}
                        >
                          <option value="NEW">NEW</option>
                          <option value="TRIAGING">TRIAGING</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="WONT_FIX">WONT_FIX</option>
                        </select>
                        <select
                          className="border border-gray-200 rounded-md text-xs px-2 py-1"
                          value={fb.priority}
                          onChange={async (e) => {
                            try {
                              await adminAPI.updateFeedback(fb.id, { priority: e.target.value })
                              queryClient.invalidateQueries(['adminFeedback'])
                              toast.success('Priority updated')
                            } catch {
                              toast.error('Update failed')
                            }
                          }}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                        {fb.screenshotUrl && (
                          <a
                            href={fb.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-700 hover:underline"
                          >
                            Screenshot
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!feedbackList?.length && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">No feedback yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
