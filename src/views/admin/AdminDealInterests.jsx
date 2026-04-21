import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { Mail, CheckCircle, Clock, TrendingUp, Users, Trash2, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const AdminDealInterests = ({ onRefresh }) => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avTeamByEmail, setAvTeamByEmail] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [viewMode, setViewMode] = useState('active');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      console.log('Loading interests from database...');
      
      const [{ data: interestsData, error }, { data: avTeamData }] = await Promise.all([
        supabase
          .from('deal_interests')
          .select(`
            *,
            members:member_id (full_name, email),
            deals:deal_id (company_name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('av_team')
          .select('full_name, email')
      ]);

      console.log('Query result:', { data: interestsData, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      const avMap = {};
      (avTeamData || []).forEach(person => {
        if (person?.email) {
          avMap[person.email.toLowerCase()] = person;
        }
      });
      setAvTeamByEmail(avMap);

      console.log(`Loaded ${interestsData?.length || 0} interests`);
      setInterests(interestsData || []);
    } catch (err) {
      console.error('Error loading interests:', err);
      showToastMessage(`Error loading interests: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const updateStatus = async (interestId, newStatus) => {
    try {
      const interest = interests.find(i => i.id === interestId);
      
      // Check if we're REMOVING a completed investment
      if (interest.status === 'completed' && newStatus !== 'completed' && interest.interest_type === 'want_to_invest') {
        console.log('=== REMOVING INVESTMENT RECORD ===');
        console.log('Interest was completed, now changing to:', newStatus);
        console.log('Member:', interest.members?.full_name, '(', interest.member_id, ')');
        console.log('Deal:', interest.deals?.company_name, '(', interest.deal_id, ')');
        
        // Delete the investment record
        const { error: deleteError } = await supabase
          .from('portfolio_investments')
          .delete()
          .eq('member_id', interest.member_id)
          .eq('deal_id', interest.deal_id);
        
        if (deleteError) {
          console.error('Error deleting investment:', deleteError);
          throw new Error('Failed to remove investment record: ' + deleteError.message);
        }
        
        console.log('✅ Investment record removed from portfolio_investments');
        
        if (onRefresh) {
          await onRefresh({ silent: true });
        }
      }
      
      // If completing an investment interest, create an investment record
      if (newStatus === 'completed' && interest.interest_type === 'want_to_invest') {
        let amountInvested = interest.investment_amount || 0;
        
        console.log('=== CREATING INVESTMENT RECORD ===');
        console.log('Interest ID:', interestId);
        console.log('Member:', interest.members?.full_name, '(', interest.member_id, ')');
        console.log('Deal:', interest.deals?.company_name, '(', interest.deal_id, ')');
        console.log('Amount:', amountInvested);

        // Check if user exists in members table
        const { data: memberCheck } = await supabase
          .from('members')
          .select('id')
          .eq('id', interest.member_id)
          .maybeSingle();

        if (!memberCheck) {
          console.warn('⚠️ WARNING: User not found in members table!');
          throw new Error(
            `Cannot create investment: User not found in database. ` +
            `Please ensure this user exists in the Members table first.`
          );
        }

        console.log('✅ User found in members table');

        // Check if deal exists
        const { data: dealCheck } = await supabase
          .from('deals')
          .select('id')
          .eq('id', interest.deal_id)
          .maybeSingle();

        if (!dealCheck) {
          console.warn('⚠️ WARNING: Deal not found in deals table!');
          throw new Error(
            `Cannot create investment: Deal not found in database.`
          );
        }

        console.log('✅ Deal exists');

        // Check if investment already exists to prevent duplicates
        const { data: existingInvestment } = await supabase
          .from('portfolio_investments')
          .select('id')
          .eq('member_id', interest.member_id)
          .eq('deal_id', interest.deal_id)
          .maybeSingle();

        if (existingInvestment) {
          console.log('⚠️ Investment already exists for this member/deal combination');
          console.log('Updating existing investment instead of creating duplicate');
          
          // Update existing investment
          const { error: updateError } = await supabase
            .from('portfolio_investments')
            .update({
              amount_invested: amountInvested,
              investment_date: new Date().toISOString().split('T')[0]
            })
            .eq('id', existingInvestment.id);

          if (updateError) {
            console.error('Error updating investment:', updateError);
            throw new Error(`Failed to update investment: ${updateError.message}`);
          }

          console.log('✅ Investment updated successfully');
        } else {
          // Create new investment record
          const investmentData = {
            member_id: interest.member_id,
            deal_id: interest.deal_id,
            amount_invested: amountInvested,
            cost_basis: amountInvested,
            current_value: amountInvested,
            investment_date: new Date().toISOString().split('T')[0],
            exit_status: 'Active'
          };

          console.log('Investment data to insert:', investmentData);

          const { data: created, error: createError } = await supabase
            .from('portfolio_investments')
            .insert([investmentData])
            .select()
            .single();

          if (createError) {
            console.error('Error creating investment:', createError);
            throw new Error(`Failed to create investment: ${createError.message}`);
          }

          console.log('✅ Investment created:', created);
        }

        if (onRefresh) {
          await onRefresh({ silent: true });
        }
      }

      // Update the interest status
      const { error: statusError } = await supabase
        .from('deal_interests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', interestId);

      if (statusError) throw statusError;

      // Update local state
      setInterests(prev => prev.map(i => 
        i.id === interestId 
          ? { ...i, status: newStatus, updated_at: new Date().toISOString() }
          : i
      ));

      showToastMessage(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToastMessage(`Error: ${err.message}`, 'error');
    }
  };

  const deleteInterest = async (interestId) => {
    if (!confirm('Are you sure you want to delete this interest? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: deletedRows, error } = await supabase
        .from('deal_interests')
        .delete()
        .eq('id', interestId)
        .select('id');

      if (error) throw error;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Delete failed. No rows removed.');
      }

      setInterests(prev => prev.filter(i => i.id !== interestId));
      if (onRefresh) {
        await onRefresh({ silent: true });
      }
      await loadInterests();
      showToastMessage('Interest deleted successfully');
    } catch (err) {
      console.error('Error deleting interest:', err);
      showToastMessage(`Error: ${err.message}`, 'error');
    }
  };

  const normalizeType = (type) => {
    if (type === 'want_to_invest') return 'invest';
    if (type === 'not_interested') return 'pass';
    return type;
  };

  const isInterestArchived = (interest) => Boolean(interest?.archived || interest?.is_archived);

  const setInterestArchived = async (interestId, archived) => {
    const timestamp = new Date().toISOString();

    try {
      let updateError = null;

      const archivedResult = await supabase
        .from('deal_interests')
        .update({
          archived,
          updated_at: timestamp
        })
        .eq('id', interestId);

      updateError = archivedResult.error;

      if (updateError && /column .*archived/i.test(updateError.message || '')) {
        const isArchivedResult = await supabase
          .from('deal_interests')
          .update({
            is_archived: archived,
            updated_at: timestamp
          })
          .eq('id', interestId);

        updateError = isArchivedResult.error;
      }

      if (updateError) throw updateError;

      setInterests(prev => prev.map((interest) => (
        interest.id === interestId
          ? {
              ...interest,
              archived,
              is_archived: archived,
              updated_at: timestamp
            }
          : interest
      )));

      showToastMessage(archived ? 'Interest archived' : 'Interest restored');
    } catch (err) {
      console.error('Error updating archive status:', err);
      showToastMessage(`Error: ${err.message}`, 'error');
    }
  };

  const getTypeBadge = (type) => {
    const normalized = normalizeType(type);
    if (normalized === 'invest') {
      return <Badge className="bg-emerald-100 text-emerald-700">Want to Invest</Badge>;
    } else if (normalized === 'pass') {
      return <Badge className="bg-red-100 text-red-700">Pass</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700">Interested</Badge>;
  };

  const getDisplayMember = (interest) => {
    const email = interest.members?.email?.toLowerCase() || '';
    const avMatch = email ? avTeamByEmail[email] : null;
    return {
      name: avMatch?.full_name || interest.members?.full_name || 'Unknown',
      email: avMatch?.email || interest.members?.email || ''
    };
  };

  const getInvestmentDetails = (interest) => {
    if (!interest) return { amountLabel: null, notes: '' };

    let amountLabel = null;
    let notes = interest.reason ? interest.reason.trim() : '';

    if (notes) {
      const match = notes.match(/^\s*\[(.+?)\]\s*(?:\r?\n\s*\r?\n)?([\s\S]*)$/);
      if (match) {
        const header = match[1].trim();
        notes = match[2].trim();

        if (/^UP TO \$/i.test(header)) {
          amountLabel = header.replace(/^UP TO /i, 'Up to ');
        } else if (/MAXIMUM ALLOCATION REQUESTED/i.test(header)) {
          amountLabel = 'Maximum Available Allocation';
        } else {
          amountLabel = header;
        }
      }
    }

    if (!amountLabel && interest.investment_amount) {
      amountLabel = `$${parseInt(interest.investment_amount).toLocaleString()}`;
    }

    return { amountLabel, notes };
  };

  const getStatusBadge = (interest) => {
    switch (interest.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-700"><Mail className="w-3 h-3 mr-1" />Contacted</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-700">Declined</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{interest.status}</Badge>;
    }
  };

  // Filter interests
  const filteredInterests = interests.filter(interest => {
    if (viewMode === 'active' && isInterestArchived(interest)) return false;
    if (viewMode === 'archived' && !isInterestArchived(interest)) return false;
    if (statusFilter !== 'all' && interest.status !== statusFilter) return false;
    if (typeFilter !== 'all') {
      const normalized = normalizeType(interest.interest_type);
      if (typeFilter === 'pass' && normalized !== 'pass') return false;
      if (typeFilter === 'invest' && normalized !== 'invest') return false;
    }
    if (memberFilter !== 'all' && interest.member_id !== memberFilter) return false;
    return true;
  });

  // Calculate stats
  const pendingCount = interests.filter(i => i.status === 'pending').length;
  const contactedCount = interests.filter(i => i.status === 'contacted').length;
  const completedCount = interests.filter(i => i.status === 'completed').length;
  const passCount = interests.filter(i => normalizeType(i.interest_type) === 'pass').length;
  const investCount = interests.filter(i => normalizeType(i.interest_type) === 'invest').length;
  const archivedCount = interests.filter(isInterestArchived).length;
  const activeCount = interests.length - archivedCount;

  // Get unique members for filter
  const uniqueMembers = Array.from(
    new Map(
      interests
        .filter(i => i.members)
        .map(i => {
          const displayMember = getDisplayMember(i);
          return [i.member_id, { id: i.member_id, name: displayMember.name }];
        })
    ).values()
  );

  // Calculate deal stats
  const dealStats = interests.reduce((acc, interest) => {
    const dealName = interest.deals?.company_name || 'Unknown Deal';
    if (!acc[dealName]) {
      acc[dealName] = { pass: 0, invest: 0, total: 0 };
    }
    const type = normalizeType(interest.interest_type);
    if (type === 'pass') acc[dealName].pass++;
    if (type === 'invest') acc[dealName].invest++;
    acc[dealName].total++;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{interests.length}</p>
              <p className="text-sm text-gray-600">Total Interests</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contactedCount}</p>
              <p className="text-sm text-gray-600">Contacted</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{investCount}</p>
              <p className="text-sm text-gray-600">Want to Invest</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending ({pendingCount})</option>
            <option value="contacted">Contacted ({contactedCount})</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Interest Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="pass">Pass ({passCount})</option>
            <option value="invest">Invest ({investCount})</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Member</label>
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Members</option>
            {uniqueMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Button
            type="button"
            onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
            className="w-full md:mt-0"
            variant={viewMode === 'archived' ? 'primary' : 'outline'}
          >
            {viewMode === 'archived' ? `Active (${activeCount})` : `Archived (${archivedCount})`}
          </Button>
        </div>
      </div>

      {/* Interests List */}
      {filteredInterests.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {interests.length === 0 
              ? 'No member interests yet. They will appear here when members express interest in deals.'
              : viewMode === 'archived'
                ? 'No archived interests match the current filters.'
                : 'No interests match the current filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInterests.map(interest => (
            <Card key={interest.id}>
              <div className={`flex gap-4 ${normalizeType(interest.interest_type) === 'invest' && interest.reason ? 'items-center' : 'items-start'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeBadge(interest.interest_type)}
                    {normalizeType(interest.interest_type) !== 'pass' && getStatusBadge(interest)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Member</p>
                      <p className="font-semibold text-gray-900">{getDisplayMember(interest).name}</p>
                      {getDisplayMember(interest).email && (
                        <a 
                          href={`mailto:${getDisplayMember(interest).email}`} 
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {getDisplayMember(interest).email}
                        </a>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Deal</p>
                      <p className="font-semibold text-gray-900">{interest.deals?.company_name || 'Unknown Deal'}</p>
                      <p className="text-xs text-gray-500">{formatDate(interest.created_at)}</p>
                    </div>
                  </div>

                  {interest.reason && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 mb-1">{normalizeType(interest.interest_type) === 'invest' ? 'Investment Details' : 'Notes'}</p>
                      {normalizeType(interest.interest_type) === 'invest' ? (
                        (() => {
                          const { amountLabel, notes } = getInvestmentDetails(interest);
                          return (
                            <div className="text-sm text-gray-700">
                              {amountLabel && (
                                <p>
                                  <span className="font-medium text-gray-900">Investment Amount:</span>{' '}
                                  <span className="text-gray-700">{amountLabel}</span>
                                </p>
                              )}
                              {notes && (
                                <p className={amountLabel ? 'mt-1' : undefined}>
                                  <span className="font-medium text-gray-900">Notes:</span>{' '}
                                  <span className="text-gray-700 whitespace-pre-line">{notes}</span>
                                </p>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-line">{interest.reason}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-[160px] shrink-0 min-h-[160px]">
                  {normalizeType(interest.interest_type) !== 'pass' ? (
                    <div className="flex flex-col gap-2">
                      {interest.status === 'pending' && (
                        <Button 
                          size="xs"
                          onClick={() => updateStatus(interest.id, 'contacted')}
                          className="w-full text-sm"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Mark Contacted
                        </Button>
                      )}
                      {interest.status === 'contacted' && (
                        <>
                          <Button 
                            size="xs"
                            onClick={() => updateStatus(interest.id, 'completed')}
                            className="w-full text-sm bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button 
                            size="xs"
                            onClick={() => updateStatus(interest.id, 'pending')}
                            className="w-full text-sm bg-gray-600 hover:bg-gray-700"
                          >
                            Back to Pending
                          </Button>
                        </>
                      )}
                      {interest.status === 'completed' && (
                        <Button 
                          size="xs"
                          onClick={() => updateStatus(interest.id, 'contacted')}
                          className="w-full text-sm bg-gray-600 hover:bg-gray-700"
                        >
                          Reopen
                        </Button>
                      )}
                      {interest.status === 'declined' && (
                        <Button 
                          size="xs"
                          onClick={() => updateStatus(interest.id, 'pending')}
                          className="w-full text-sm bg-gray-600 hover:bg-gray-700"
                        >
                          Reopen
                        </Button>
                      )}
                      {interest.status !== 'declined' && (
                        <Button 
                          size="xs"
                          onClick={() => updateStatus(interest.id, 'declined')}
                          className="w-full text-sm bg-red-600 hover:bg-red-700"
                        >
                          Decline
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                  {/* Delete button with dividing line */}
                  <div className="w-full border-t border-gray-200 pt-2 mt-auto">
                    <Button 
                      size="xs"
                      onClick={() => deleteInterest(interest.id)}
                      className="w-full text-sm bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      size="xs"
                      onClick={() => setInterestArchived(interest.id, !isInterestArchived(interest))}
                      className="w-full text-sm mt-2 bg-gray-600 hover:bg-gray-700"
                    >
                      {isInterestArchived(interest) ? 'Unarchive' : 'Archive'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deal Insights */}
      {interests.length > 0 && Object.keys(dealStats).length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Interest by Deal</h3>
          <div className="space-y-2">
            {Object.entries(dealStats)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .map(([dealName, stats]) => (
                <div key={dealName} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <p className="text-sm font-medium text-gray-900">{dealName}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-blue-600">{stats.pass} pass</span>
                    <span className="text-emerald-600 font-semibold">{stats.invest} invest</span>
                    <span className="text-gray-500">({stats.total} total)</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-6 py-3 rounded-lg shadow-lg ${
            toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white flex items-center gap-2`}>
            {toastType === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDealInterests;
