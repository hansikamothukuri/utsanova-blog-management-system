import blogService from '../services/blogService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateBlogInput, sanitizeTags, parsePagination } from '../utils/validators.js';

export const blogController = {
  /**
   * Public: Get all published blogs with optional search/tag filter
   * Supports pagination via ?page= and ?limit= (defaults: page=1, limit=9)
   * GET /api/blogs?page=1&limit=9
   */
  async getPublishedBlogs(req, res, next) {
    try {
      const { search, tag } = req.query;
      const { page, limit } = parsePagination(req.query);
      const result = await blogService.getPublishedBlogs({ search, tag, page, limit });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Public: Get single published blog by ID
   * GET /api/blogs/:id
   */
  async getPublishedBlogById(req, res, next) {
    try {
      const { id } = req.params;
      const blog = await blogService.getPublishedBlogById(id);

      if (!blog) {
        return sendError(res, 'Blog not found', 404);
      }

      return sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin: Get all blogs (Draft + Published)
   * GET /api/admin/blogs
   */
  async getAllAdminBlogs(req, res, next) {
    try {
      const { status } = req.query;
      const blogs = await blogService.getAllBlogs({ status });
      return sendSuccess(res, blogs);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin: Get single blog by ID
   * GET /api/admin/blogs/:id
   */
  async getAdminBlogById(req, res, next) {
    try {
      const { id } = req.params;
      const blog = await blogService.getBlogById(id);

      if (!blog) {
        return sendError(res, 'Blog not found', 404);
      }

      return sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin: Create a new blog
   * POST /api/admin/blogs
   */
  async createBlog(req, res, next) {
    try {
      const { title, content, tags, conclusion, status } = req.body;
      const cleanTags = sanitizeTags(tags);

      const validation = validateBlogInput({
        title,
        content,
        tags: cleanTags,
        conclusion,
        status,
      });

      if (!validation.isValid) {
        return sendError(res, validation.errors.join('. '), 400);
      }

      const newBlog = await blogService.createBlog({
        title,
        content,
        tags: cleanTags,
        conclusion,
        status,
      });

      return sendSuccess(res, newBlog, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin: Update blog
   * PUT /api/admin/blogs/:id
   */
  async updateBlog(req, res, next) {
    try {
      const { id } = req.params;
      const { title, content, tags, conclusion, status } = req.body;
      const cleanTags = sanitizeTags(tags);

      const validation = validateBlogInput({
        title,
        content,
        tags: cleanTags,
        conclusion,
        status,
      });

      if (!validation.isValid) {
        return sendError(res, validation.errors.join('. '), 400);
      }

      const updated = await blogService.updateBlog(id, {
        title,
        content,
        tags: cleanTags,
        conclusion,
        status,
      });

      if (!updated) {
        return sendError(res, 'Blog not found', 404);
      }

      return sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Admin: Delete blog
   * DELETE /api/admin/blogs/:id
   */
  async deleteBlog(req, res, next) {
    try {
      const { id } = req.params;
      const success = await blogService.deleteBlog(id);

      if (!success) {
        return sendError(res, 'Blog not found', 404);
      }

      return sendSuccess(res, { message: 'Blog deleted successfully', id: Number(id) });
    } catch (error) {
      next(error);
    }
  },
};

export default blogController;
