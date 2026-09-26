import api from './api.js';

export const blogService = {
  // Public blog endpoints
  async getPublishedBlogs({ search = '', tag = '' } = {}) {
    const params = {};
    if (search) params.search = search;
    if (tag) params.tag = tag;
    const response = await api.get('/blogs', { params });
    return response.data || [];
  },

  async getPublishedBlogById(id) {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  },

  // Admin blog management endpoints
  async getAdminBlogs(status = '') {
    const params = {};
    if (status) params.status = status;
    const response = await api.get('/admin/blogs', { params });
    return response.data || [];
  },

  async getAdminBlogById(id) {
    const response = await api.get(`/admin/blogs/${id}`);
    return response.data;
  },

  async createBlog(data) {
    const response = await api.post('/admin/blogs', data);
    return response.data;
  },

  async updateBlog(id, data) {
    const response = await api.put(`/admin/blogs/${id}`, data);
    return response.data;
  },

  async deleteBlog(id) {
    const response = await api.delete(`/admin/blogs/${id}`);
    return response.data;
  },

  // Admin dashboard stats
  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Future enhancement: AI Blog Generator
  async generateAiBlog(topic, keywords = '') {
    const response = await api.post('/admin/ai/generate-ai', { topic, keywords });
    return response.data;
  },
};

export default blogService;
