import React, { useState } from 'react';
import { Briefcase, TrendingUp, DollarSign, Calendar, ExternalLink, FileText } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { Card, Badge } from '../../components/ui';

const MemberPortfolio = ({ investments, currentUser, deals, onNavigate }) => {
  const myInvestments = investments.filter(inv => inv.member_id === currentUser?.id);
  
  const getDealCompanyName = (dealId) => {
    const deal = deals?.find(d => d.id === dealId);
    return deal?.company_name || 'Unknown Company';
  };

  const getDealCompanyUrl = (dealId) => {
    const deal = deals?.find(d => d.id === dealId);
    return deal?.company_url || deal?.portal_url || deal?.deck_url || '';
  };
  
  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };
  
  const getExitBadgeColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'IPO': return 'bg-purple-100 text-purple-700';
      case 'Acquired': return 'bg-blue-100 text-blue-700';
      case 'Write-off': return 'bg-red-100 text-red-700';
      case 'Partial Exit': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const totalInvested = myInvestments.reduce((sum, inv) => sum + (parseFloat(inv.amount_invested) || 0), 0);
  const totalValue = myInvestments.reduce((sum, inv) => sum + (parseFloat(inv.current_value) || 0), 0);
  const totalGain = totalValue - totalInvested;
  const gainPercent = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(1) : 0;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</p>
          <p className="text-xs text-gray-400">Net of fees</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Return</p>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGain >= 0 ? '+' : ''}{gainPercent}%
          </p>
        </Card>
      </div>
      
      {/* Investments Table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">My Investments</h2>
          <p className="text-sm text-gray-500">{myInvestments.length} companies</p>
        </div>
        
        {myInvestments.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No investments yet</p>
            <p className="text-sm text-gray-400">Your portfolio will appear here once you invest in deals</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invested</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cost Basis</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myInvestments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <button 
                          onClick={() => onNavigate('deals')}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {getDealCompanyName(inv.deal_id)}
                        </button>
                        {getDealCompanyUrl(inv.deal_id) && (
                          <a href={getDealCompanyUrl(inv.deal_id)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            Website <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inv.investment_date ? formatDate(inv.investment_date) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(inv.amount_invested)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {formatCurrency(inv.cost_basis)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      <span className={inv.current_value > inv.cost_basis ? 'text-green-600' : inv.current_value < inv.cost_basis ? 'text-red-600' : 'text-gray-900'}>
                        {formatCurrency(inv.current_value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExitBadgeColor(inv.exit_status)}`}>
                        {inv.exit_status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {inv.dd_report_url ? (
                        <a href={inv.dd_report_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          <FileText size={18} />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* News Section */}
      {myInvestments.some(inv => inv.news) && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Portfolio News</h3>
          <div className="space-y-4">
            {myInvestments.filter(inv => inv.news).map((inv) => (
              <div key={inv.id} className="border-l-4 border-blue-400 pl-4">
                <p className="font-medium text-gray-900">{getDealCompanyName(inv.deal_id)}</p>
                <p className="text-sm text-gray-600">{inv.news}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};


export default MemberPortfolio;
