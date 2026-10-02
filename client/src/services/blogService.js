import api from './api.js';

const unwrapApiResponse = (response) => {
  const payload = response?.data ?? response;

  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }

  return payload;
};

export const blogService = {
  async getPublishedBlogs({
    search = '',
    tag = '',
    page = 1,
    limit = 9,
  } = {}) {
    const params = { page, limit };

    if (search) params.search = search;
    if (tag) params.tag = tag;

    const response = await api.get('/blogs', { params });
    const data = unwrapApiResponse(response);

    return (
      data || {
        blogs: [],
        pagination: {
          currentPage: 1,
          limit,
          totalBlogs: 0,
          totalPages: 0,
        },
      }
    );
  },

  async getPublishedBlogById(id) {
    const response = await api.get(`/blogs/${id}`);
    return unwrapApiResponse(response);
  },

  async getAdminBlogs({
    status = '',
    search = '',
    page = 1,
    limit = 9,
  } = {}) {
    const params = { page, limit };

    if (status) params.status = status;
    if (search) params.search = search;

    const response = await api.get('/admin/blogs', { params });
    const data = unwrapApiResponse(response);

    return (
      data || {
        blogs: [],
        pagination: {
          currentPage: 1,
          limit,
          totalBlogs: 0,
          totalPages: 0,
        },
      }
    );
  },

  async getAdminBlogById(id) {
    const response = await api.get(`/admin/blogs/${id}`);
    return unwrapApiResponse(response);
  },

  async createBlog(data) {
    const response = await api.post('/admin/blogs', data);
    return unwrapApiResponse(response);
  },

  async updateBlog(id, data) {
    const response = await api.put(`/admin/blogs/${id}`, data);
    return unwrapApiResponse(response);
  },

  async deleteBlog(id) {
    const response = await api.delete(`/admin/blogs/${id}`);
    return unwrapApiResponse(response);
  },

  async getDashboardStats() {
    const response = await api.get('/admin/dashboard/stats');
    return unwrapApiResponse(response);
  },

  async generateAiBlog(topic, keywords = '') {
    const response = await api.post(
      '/admin/ai/generate-ai',
      {
        topic,
        keywords,
      },
      {
        timeout: 60000,
      }
    );

    return unwrapApiResponse(response);
  },
};

export default blogService;