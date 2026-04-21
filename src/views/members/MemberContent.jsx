import React, { useState } from 'react';
import { BookOpen, Video, FileText, ExternalLink, Play, Eye, Calendar, Download } from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { formatDate } from '../../utils/formatters';

const MemberContent = ({ content, sessions }) => {
  const [selectedContent, setSelectedContent] = useState(null);
  
  const handleDownload = (item) => {
    if (item.file_url) {
      window.open(item.file_url, '_blank');
    } else if (item.url) {
      window.open(item.url, '_blank');
    } else {
      alert('Download not available for this item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Grid */}
      {content.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">No content available</p>
          <p className="text-gray-400">Check back later for resources and materials</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => (
            <Card
              key={item.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedContent(item)}
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {item.description || ''}
                  </p>
                  {item.session_title && (
                    <p className="text-xs text-gray-400 mt-1">From: {item.session_title}</p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 uppercase">{item.type || item.file_type}</span>
                    <Button variant="ghost" size="sm" icon={Download} onClick={(e) => { e.stopPropagation(); handleDownload(item); }}>
                      {(item.type === 'link' || item.file_type === 'link') ? 'Open' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        title={selectedContent?.title || 'Content'}
        size="lg"
      >
        {selectedContent && (
          <div className="space-y-4 overflow-x-hidden break-words">
            {selectedContent.description && (
              <p className="text-gray-700 whitespace-pre-wrap break-words">{selectedContent.description}</p>
            )}
            <div className="text-sm text-gray-500 space-y-1">
              {selectedContent.session_title && <div className="break-words">From: {selectedContent.session_title}</div>}
              {(selectedContent.type || selectedContent.file_type) && (
                <div className="break-words">Type: {selectedContent.type || selectedContent.file_type}</div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" icon={Download} onClick={() => handleDownload(selectedContent)}>
                {(selectedContent.type === 'link' || selectedContent.file_type === 'link') ? 'Open' : 'Download'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Member Deals (Deal Room)

export default MemberContent;
