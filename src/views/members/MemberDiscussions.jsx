import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card, Button } from '../../components/ui';

const MemberDiscussions = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Discussions</h2>
          <p className="text-sm text-gray-500">Connect with fellow members</p>
        </div>
        <Button icon={Plus}>New Discussion</Button>
      </div>
      
      <div className="text-center py-12">
        <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-2">No discussions yet</p>
        <p className="text-gray-400">Start a conversation with your cohort</p>
      </div>
    </div>
  );
};


export default MemberDiscussions;
