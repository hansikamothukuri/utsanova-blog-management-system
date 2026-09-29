import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import blogService from '../../services/blogService.js';
import { LoadingSpinner } from '../../components/LoadingSpinner.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { formatDate } from '../../utils/formatDate.js';
import TagBadge from '../../components/TagBadge.jsx';

export const AdminBlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'Published' | 'Draft'
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogService.getAdminBlogs(statusFilter);
      setBlogs(data);
    } catch (err) {
      console.error('Failed to fetch admin blogs:', err);
      setError(err.message || 'Failed to load blogs from MySQL database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter]);

  const handleOpenDelete = (blog) => {
    setBlogToDelete(blog);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!blogToDelete) return;
    try {
      setIsDeleting(true);
      await blogService.deleteBlog(blogToDelete.id);
      setSuccessMsg(`Blog "${blogToDelete.title}" was successfully deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setDeleteModalOpen(false);
      setBlogToDelete(null);
      await fetchBlogs();
    } catch (err) {
      setError(err.message || 'Failed to delete blog.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (blog) => {
    const newStatus = blog.status === 'Published' ? 'Draft' : 'Published';
    try {
      await blogService.updateBlog(blog.id, {
        title: blog.title,
        content: blog.content,
        tags: blog.tags,
        conclusion: blog.conclusion,
        status: newStatus,
      });
      setSuccessMsg(
        `Status of "${blog.title}" changed to ${newStatus}.${
          newStatus === 'Published'
            ? ' It is now live on the public site.'
            : ' It has been removed from public view.'
        }`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      await fetchBlogs();
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  // Client-side search filtering on current list
  const filteredBlogs = blogs.filter((blog) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      blog.title.toLowerCase().includes(term) ||
      blog.tags.toLowerCase().includes(term) ||
      blog.content.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manage Blogs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, update, toggle publication state, or remove articles from MySQL.
          </p>
        </div>

        <Link
          to="/admin/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Blog
        </Link>
      </div>

      {/* Success / Error notification alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          {[
            { label: 'All Blogs', value: '' },
            { label: 'Published', value: 'Published' },
            { label: 'Drafts', value: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === tab.value
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input in admin */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, tag, content..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Querying MySQL blogs table..." />
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm mb-4">
              {searchTerm || statusFilter
                ? 'No blogs match your filter criteria.'
                : 'No blogs in database yet.'}
            </p>
            <Link
              to="/admin/blogs/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Write First Blog Post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">ID</th>
                  <th scope="col" className="px-6 py-3.5">Title & Summary</th>
                  <th scope="col" className="px-6 py-3.5">Tags</th>
                  <th scope="col" className="px-6 py-3.5">Publication Status</th>
                  <th scope="col" className="px-6 py-3.5">Created Date</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      #{blog.id}
                    </td>

                    <td className="px-6 py-4 max-w-sm">
                      <Link
                        to={`/admin/blogs/${blog.id}/edit`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-sm mb-0.5 line-clamp-1"
                      >
                        {blog.title}
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {blog.content}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {blog.tags
                          ?.split(',')
                          .slice(0, 2)
                          .map((t, idx) => (
                            <TagBadge key={idx} tag={t} size="xs" />
                          ))}
                        {blog.tags?.split(',').length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{blog.tags.split(',').length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(blog)}
                        title={`Click to switch to ${
                          blog.status === 'Published' ? 'Draft' : 'Published'
                        }`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                          blog.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {blog.status === 'Published' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {blog.status}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(blog.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {blog.status === 'Published' && (
                          <Link
                            to={`/blogs/${blog.id}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Preview on Public Site"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          to={`/admin/blogs/${blog.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Blog"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(blog)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Blog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Blog Article"
        message={`Are you sure you want to permanently delete "${blogToDelete?.title}" from MySQL? This action cannot be undone.`}
        confirmLabel="Yes, Delete Blog"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setBlogToDelete(null);
        }}
      />
    </div>
  );
};

export default AdminBlogsPage;
