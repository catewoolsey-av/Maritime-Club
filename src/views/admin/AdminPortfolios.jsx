import React, { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Briefcase, User, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../supabase';
import { formatDate } from '../../utils/formatters';
import { Button, Card, Badge, Modal } from '../../components/ui';

const AdminPortfolios = ({ investments, members, deals, onRefresh, onNavigate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filterMember, setFilterMember] = useState('');
  const [formData, setFormData] = useState({
    member_id: '',
    deal_id: '',
    news: '',
    investment_date: '',
    dd_report_url: '',
    amount_invested: '',
    cost_basis: '',
    current_value: '',
    exit_status: 'Active',
  });

  const exitOptions = ['Active', 'IPO', 'Acquired', 'Write-off', 'Partial Exit'];

  const getDealCompanyName = (dealId) => {
    const deal = deals?.find(d => d.id === dealId);
    return deal?.company_name || 'Unknown Company';
  };

  const getDealCompanyUrl = (dealId) => {
    const deal = deals?.find(d => d.id === dealId);
    return deal?.company_url || deal?.portal_url || deal?.deck_url || '';
  };

  const openAddModal = (preselectedMemberId = '') => {
    setEditingInvestment(null);
    setSaveSuccess(false);
    setFormData({
      member_id: preselectedMemberId,
      deal_id: '',
      news: '',
      investment_date: '',
      dd_report_url: '',
      amount_invested: '',
      cost_basis: '',
      current_value: '',
      exit_status: 'Active',
    });
    setShowModal(true);
  };

  const openEditModal = (investment) => {
    setEditingInvestment(investment);
    setSaveSuccess(false);
    setFormData({
      member_id: investment.member_id || '',
      deal_id: investment.deal_id || '',
      news: investment.news || '',
      investment_date: investment.investment_date || '',
      dd_report_url: investment.dd_report_url || '',
      amount_invested: investment.amount_invested || '',
      cost_basis: investment.cost_basis || '',
      current_value: investment.current_value || '',
      exit_status: investment.exit_status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.member_id || !formData.deal_id) {
      alert('Member and Deal are required');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);

    try {
      const saveData = {
        ...formData,
        amount_invested: formData.amount_invested ? parseFloat(formData.amount_invested) : null,
        cost_basis: formData.cost_basis ? parseFloat(formData.cost_basis) : null,
        current_value: formData.current_value ? parseFloat(formData.current_value) : null,
      };

      if (editingInvestment) {
        const { error } = await supabase
          .from('portfolio_investments')
          .update(saveData)
          .eq('id', editingInvestment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_investments')
          .insert([saveData]);
        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        onRefresh();
      }, 1000);
    } catch (err) {
      console.error('Error saving investment:', err);
      alert('Error saving investment: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (investment) => {
    if (!confirm(`Delete investment in ${getDealCompanyName(investment.deal_id)}?`)) return;

    try {
      const { error } = await supabase
        .from('portfolio_investments')
        .delete()
        .eq('id', investment.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error deleting investment:', err);
      alert('Error deleting investment: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member ? member.full_name : 'Unknown';
  };

  const filteredInvestments = filterMember 
    ? investments.filter(inv => inv.member_id === filterMember)
    : investments;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Portfolios</h2>
          <p className="text-sm text-gray-500">{investments.length} investments across {new Set(investments.map(i => i.member_id)).size} members</p>
        </div>
        <Button icon={Plus} onClick={() => openAddModal()}>Add Investment</Button>
      </div>

      {/* Filter by Member */}
      <Card>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Member:</label>
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Members</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
          {filterMember && (
            <Button variant="outline" onClick={() => openAddModal(filterMember)}>
              Add Investment for {getMemberName(filterMember)}
            </Button>
          )}
        </div>
      </Card>

      {/* Investments Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invested</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Current Value</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No investments found. Click "Add Investment" to create one.
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{getMemberName(inv.member_id)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => onNavigate('deals')}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {getDealCompanyName(inv.deal_id)}
                      </button>
                      {getDealCompanyUrl(inv.deal_id) && (
                        <a href={getDealCompanyUrl(inv.deal_id)} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                          Website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inv.investment_date ? formatDate(inv.investment_date) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(inv.amount_invested)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(inv.current_value)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExitBadgeColor(inv.exit_status)}`}>
                        {inv.exit_status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => openEditModal(inv)} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(inv)} 
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingInvestment ? 'Edit Investment' : 'Add Investment'} size="lg">
        {saveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Saved Successfully!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Member Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Member</h3>
              <select
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
            </div>

            {/* Deal Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Deal</h3>
              <select
                value={formData.deal_id}
                onChange={(e) => setFormData({ ...formData, deal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Deal...</option>
                {deals && deals.map(deal => (
                  <option key={deal.id} value={deal.id}>{deal.company_name}</option>
                ))}
              </select>
            </div>

            {/* Investment Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Investment Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Date</label>
                  <input
                    type="date"
                    value={formData.investment_date}
                    onChange={(e) => setFormData({ ...formData, investment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DD Report URL</label>
                  <input
                    type="url"
                    value={formData.dd_report_url}
                    onChange={(e) => setFormData({ ...formData, dd_report_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Invested ($)</label>
                  <input
                    type="number"
                    value={formData.amount_invested}
                    onChange={(e) => setFormData({ ...formData, amount_invested: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Basis ($)</label>
                  <input
                    type="number"
                    value={formData.cost_basis}
                    onChange={(e) => setFormData({ ...formData, cost_basis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value ($)</label>
                  <input
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="75000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exit Status</label>
                  <select
                    value={formData.exit_status}
                    onChange={(e) => setFormData({ ...formData, exit_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {exitOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* News */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">News</h3>
              <textarea
                value={formData.news}
                onChange={(e) => setFormData({ ...formData, news: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Latest news or updates about the company..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} icon={loading ? null : Save}>
                {loading ? 'Saving...' : editingInvestment ? 'Save Changes' : 'Add Investment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


export default AdminPortfolios;
