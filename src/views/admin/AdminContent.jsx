import React, { useState } from 'react';
import { Plus, Edit, Trash2, Upload, GripVertical, Eye, FileText, Video, ExternalLink, Save, CheckCircle, ChevronRight } from 'lucide-react';
import { supabase } from '../../supabase';
import { Button, Card, Badge, Modal } from '../../components/ui';

const AdminContent = ({ content, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    url: '',
    file_name: '',
    duration: '',
    author: '',
    featured: false,
  });

  const typeOptions = ['video', 'article', 'template', 'guide', 'podcast', 'slides', 'pdf', 'link', 'powerpoint'];

  // File type to content type mapping
  const fileTypeMap = {
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
    'application/msword': 'article',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'article',
    'video/mp4': 'video',
    'video/quicktime': 'video',
    'audio/mpeg': 'podcast',
    'audio/mp3': 'podcast',
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setUploadingFile(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `content/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('content-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);
      
      // Auto-detect content type from file
      const detectedType = fileTypeMap[file.type] || 'article';
      
      // Update form with file info
      setFormData(prev => ({
        ...prev,
        url: urlData.publicUrl,
        file_name: file.name,
        type: detectedType,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));
      
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file: ' + err.message);
    }
    
    setUploadingFile(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setUploadDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    setUploadDragOver(true);
  };

  const handleFileDragLeave = () => {
    setUploadDragOver(false);
  };

  const openAddModal = () => {
    setEditingContent(null);
    setSaveSuccess(false);
    setFormData({
      title: '',
      description: '',
      type: 'article',
      url: '',
      file_name: '',
      duration: '',
      author: '',
      featured: false,
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingContent(item);
    setSaveSuccess(false);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'article',
      url: item.url || '',
      file_name: item.file_name || '',
      duration: item.duration || '',
      author: item.author || '',
      featured: item.featured || false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    setLoading(true);
    setSaveSuccess(false);

    try {
      if (editingContent) {
        const { error } = await supabase
          .from('content')
          .update(formData)
          .eq('id', editingContent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('content')
          .insert([formData]);
        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        onRefresh();
      }, 1000);
    } catch (err) {
      console.error('Error saving content:', err);
      alert('Error saving content: ' + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', item.id);
      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error deleting content:', err);
      alert('Error deleting content: ' + err.message);
    }
  };

  const handleMoveUp = async (item, index) => {
    if (index === 0) return;
    const newContent = [...content];
    const temp = newContent[index - 1];
    newContent[index - 1] = item;
    newContent[index] = temp;
    
    // Update sort_order in database
    try {
      await supabase.from('content').update({ sort_order: index - 1 }).eq('id', item.id);
      await supabase.from('content').update({ sort_order: index }).eq('id', temp.id);
      onRefresh();
    } catch (err) {
      console.error('Error reordering:', err);
    }
  };

  const handleMoveDown = async (item, index) => {
    if (index === content.length - 1) return;
    const newContent = [...content];
    const temp = newContent[index + 1];
    newContent[index + 1] = item;
    newContent[index] = temp;
    
    // Update sort_order in database
    try {
      await supabase.from('content').update({ sort_order: index + 1 }).eq('id', item.id);
      await supabase.from('content').update({ sort_order: index }).eq('id', temp.id);
      onRefresh();
    } catch (err) {
      console.error('Error reordering:', err);
    }
  };

  const handleToggleFeatured = async (item) => {
    try {
      await supabase.from('content').update({ featured: !item.featured }).eq('id', item.id);
      onRefresh();
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Content</h2>
          <p className="text-sm text-gray-500">{content.length} items · Drag to reorder</p>
        </div>
        <Button icon={Plus} onClick={openAddModal}>Add Content</Button>
      </div>

      {/* Content Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase w-10">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Content</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Featured</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No content yet. Click "Add Content" to create one.
                  </td>
                </tr>
              ) : (
                content.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleMoveUp(item, index)}
                          disabled={index === 0}
                          className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                          <ChevronRight size={16} className="-rotate-90" />
                        </button>
                        <button 
                          onClick={() => handleMoveDown(item, index)}
                          disabled={index === content.length - 1}
                          className={`p-1 rounded ${index === content.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                          <ChevronRight size={16} className="rotate-90" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-[250px]">{item.description || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {item.type || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          item.featured 
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {item.featured ? '⭐ Featured' : 'Set Featured'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-[30px] h-[30px] flex items-center justify-center">
                          {item.url ? (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-2 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          ) : null}
                        </div>
                        <button 
                          onClick={() => openEditModal(item)} 
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item)} 
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingContent ? `Edit: ${editingContent.title}` : 'Add New Content'} size="lg">
        {saveSuccess ? (
          <div className="text-center py-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">Saved Successfully!</p>
            <p className="text-gray-500">Content has been saved to the library.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Upload File</h3>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
                  uploadDragOver ? 'border-blue-500 bg-blue-100' : 'border-gray-300 hover:border-gray-400 bg-white'
                }`}
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
                onClick={() => document.getElementById('content-file-input').click()}
              >
                {uploadingFile ? (
                  <div>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-600">Uploading...</p>
                  </div>
                ) : formData.file_name ? (
                  <div>
                    <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-gray-900">{formData.file_name}</p>
                    <p className="text-sm text-gray-500">Click or drop to replace</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="font-medium text-gray-700">Drag & drop a file here</p>
                    <p className="text-sm text-gray-500">PDF, PowerPoint, Word, Video (max 25MB)</p>
                    <p className="text-xs text-gray-400 mt-2">or click to browse</p>
                  </div>
                )}
                <input 
                  id="content-file-input"
                  type="file" 
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.mp3"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Introduction to Venture Capital"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Brief description of the content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {typeOptions.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="15 min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Tuleeka Hazra"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600"
                    />
                    <span className="text-sm text-gray-700">⭐ Featured content</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} icon={loading ? null : Save}>
                {loading ? 'Saving...' : editingContent ? 'Save Changes' : 'Add Content'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};


export default AdminContent;
