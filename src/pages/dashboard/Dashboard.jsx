import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import dashboardService from '../services/dashboardService';
import showToast from '../utils/toast';
import { CATEGORY_CONFIG } from '../utils/constants';

// Quick date range presets
const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: 'Last 7 Days', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 Days', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'This Month', getValue: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'All Time', getValue: () => ({ start: null, end: null }) }
];

const Dashboard = () => {
  // State
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('All Time');

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [summaryRes, alertsRes, statsRes] = await Promise.all([
        dashboardService.getSummary(params),
        dashboardService.getAlerts(),
        dashboardService.getStats()
      ]);

      setSummary(summaryRes.data);
      setAlerts(alertsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Apply date preset
  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    const { start, end } = preset.getValue();
    setStartDate(start ? format(start, 'yyyy-MM-dd') : '');
    setEndDate(end ? format(end, 'yyyy-MM-dd') : '');
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Category Card Component
  const CategoryCard = ({ categoryKey, data }) => {
    const config = CATEGORY_CONFIG[categoryKey];
    if (!config) return null;

    return (
      <Link
        to={`/categories/${categoryKey}`}
        className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className={`font-semibold ${config.textColor}`}>{config.label}</h3>
        </div>
        <div className="space-y-1">
          <p className={`text-2xl font-bold ${config.textColor}`}>
            {data?.count || 0}
          </p>
          <p className={`text-sm ${config.textColor} opacity-75`}>
            {formatCurrency(data?.totalValue)}
          </p>
        </div>
      </Link>
    );
  };

  // Alert Badge Component
  const AlertBadge = ({ count, label, severity, link }) => {
    if (count === 0) return null;

    const severityClasses = {
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      danger: 'bg-red-100 border-red-400 text-red-800',
      info: 'bg-blue-100 border-blue-400 text-blue-800'
    };

    return (
      <Link
        to={link}
        className={`flex items-center justify-between p-3 rounded-lg border ${severityClasses[severity]} hover:opacity-80 transition-opacity`}
      >
        <span className="text-sm font-medium">{label}</span>
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-white/50">
          {count}
        </span>
      </Link>
    );
  };

  if (loading && !summary) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Service Center Stock Overview
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activePreset === preset.label
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">From Date (Bill Date)</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('');
              }}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('');
              }}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => applyPreset(DATE_PRESETS[4])} // All Time
              className="btn-secondary text-sm"
            >
              Clear Dates
            </button>
          )}
          <div className="flex-1 text-right text-sm text-gray-500">
            {startDate || endDate ? (
              <span>
                Showing parts received {startDate ? `from ${format(new Date(startDate), 'dd MMM yyyy')}` : ''} 
                {endDate ? ` to ${format(new Date(endDate), 'dd MMM yyyy')}` : ''}
              </span>
            ) : (
              <span>Showing all time data</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm mb-1">Total Inventory</p>
          <p className="text-3xl font-bold">{summary?.totals?.count || 0}</p>
          <p className="text-blue-100 text-sm mt-1">
            {formatCurrency(summary?.totals?.value)}
          </p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm mb-1">This Month</p>
          <p className="text-3xl font-bold">{stats?.thisMonth?.totalSerials || 0} parts</p>
          <p className="text-green-100 text-sm mt-1">
            from {stats?.thisMonth?.count || 0} bills
          </p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm mb-1">OG Cash Collection</p>
          <p className="text-3xl font-bold">
            {formatCurrency(summary?.ogPaymentSummary?.total?.amount)}
          </p>
          <p className="text-purple-100 text-sm mt-1">
            {summary?.ogPaymentSummary?.paid?.count || 0} paid, {summary?.ogPaymentSummary?.pending?.count || 0} pending
          </p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CategoryCard categoryKey="IN_STOCK" data={summary?.categories?.IN_STOCK} />
          <CategoryCard categoryKey="SPU_PENDING" data={summary?.categories?.SPU_PENDING} />
          <CategoryCard categoryKey="SPU_CLEARED" data={summary?.categories?.SPU_CLEARED} />
          <CategoryCard categoryKey="AMC" data={summary?.categories?.AMC} />
          <CategoryCard categoryKey="OG" data={summary?.categories?.OG} />
          <CategoryCard categoryKey="RETURN" data={summary?.categories?.RETURN} />
          <CategoryCard categoryKey="RECEIVED_FOR_OTHERS" data={summary?.categories?.RECEIVED_FOR_OTHERS} />
          <CategoryCard categoryKey="UNCATEGORIZED" data={summary?.categories?.UNCATEGORIZED} />
        </div>
      </div>

      {/* Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
            {alerts?.totalAlerts > 0 && (
              <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">
                {alerts.totalAlerts} alerts
              </span>
            )}
          </div>

          {alerts?.totalAlerts === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>All clear! No pending alerts.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AlertBadge
                count={alerts?.alerts?.spuPendingOld?.count}
                label="SPU Pending > 30 days"
                severity="warning"
                link="/categories/SPU_PENDING"
              />
              <AlertBadge
                count={alerts?.alerts?.paymentPending?.count}
                label="OG Payment Pending > 15 days"
                severity="warning"
                link="/categories/OG"
              />
              <AlertBadge
                count={alerts?.alerts?.returnPending?.count}
                label="Return Pending > 7 days"
                severity="warning"
                link="/categories/RETURN"
              />
              <AlertBadge
                count={alerts?.alerts?.uncategorized?.count}
                label={`Uncategorized Items (${alerts?.alerts?.uncategorized?.billsCount} bills)`}
                severity="info"
                link="/categories/UNCATEGORIZED"
              />
              <AlertBadge
                count={alerts?.alerts?.chargeablePending?.count}
                label="Chargeable Items - Payment Pending"
                severity="info"
                link="/serials/search"
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/bills/new"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="p-2 bg-blue-500 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">New Bill</p>
                <p className="text-xs text-gray-500">Add new stock entry</p>
              </div>
            </Link>

            <Link
              to="/bills"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="p-2 bg-green-500 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Bills</p>
                <p className="text-xs text-gray-500">Manage all bills</p>
              </div>
            </Link>

            <Link
              to="/serials/search"
              className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="p-2 bg-purple-500 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Search Serials</p>
                <p className="text-xs text-gray-500">Find any part</p>
              </div>
            </Link>

            <Link
              to="/categories/UNCATEGORIZED"
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="p-2 bg-orange-500 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Categorize</p>
                <p className="text-xs text-gray-500">Pending items</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Payments Details */}
      {alerts?.details?.paymentPending?.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending OG Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Serial</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Part</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Since</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {alerts.details.paymentPending.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">{item.serialNumber}</td>
                    <td className="px-4 py-2 text-sm">{item.partName}</td>
                    <td className="px-4 py-2 text-sm">{item.context?.customerName || '-'}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-orange-600">
                      {formatCurrency(item.context?.cashAmount)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {item.categorizedDate ? format(new Date(item.categorizedDate), 'dd MMM') : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/serials/${item._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;