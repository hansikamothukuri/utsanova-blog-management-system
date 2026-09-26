import db from '../config/db.js';

export const blogService = {
  /**
   * Retrieves published blogs with optional search and tag filters
   */
  async getPublishedBlogs({ search, tag } = {}) {
    let sql = "SELECT * FROM blogs WHERE status = 'Published'";
    const params = [];

    if (tag && tag.trim()) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag.trim()}%`);
    }

    if (search && search.trim()) {
      sql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Retrieves single published blog by ID
   */
  async getPublishedBlogById(id) {
    const sql = "SELECT * FROM blogs WHERE id = ? AND status = 'Published'";
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Admin: Retrieves all blogs with optional status filter
   */
  async getAllBlogs({ status } = {}) {
    let sql = 'SELECT * FROM blogs';
    const params = [];

    if (status && ['Draft', 'Published'].includes(status)) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    return rows;
  },

  /**
   * Admin: Retrieves single blog by ID
   */
  async getBlogById(id) {
    const sql = 'SELECT * FROM blogs WHERE id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Admin: Creates a new blog
   */
  async createBlog({ title, content, tags, conclusion, status }) {
    const sql =
      'INSERT INTO blogs (title, content, tags, conclusion, status) VALUES (?, ?, ?, ?, ?)';
    const params = [title.trim(), content.trim(), tags.trim(), conclusion.trim(), status];

    const [result] = await db.query(sql, params);
    const insertId = result.insertId || result[0]?.insertId;

    if (insertId) {
      return await this.getBlogById(insertId);
    }
    return null;
  },

  /**
   * Admin: Updates an existing blog
   */
  async updateBlog(id, { title, content, tags, conclusion, status }) {
    const existing = await this.getBlogById(id);
    if (!existing) {
      return null;
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedContent = content !== undefined ? content.trim() : existing.content;
    const updatedTags = tags !== undefined ? tags.trim() : existing.tags;
    const updatedConclusion = conclusion !== undefined ? conclusion.trim() : existing.conclusion;
    const updatedStatus = status !== undefined ? status : existing.status;

    const sql =
      'UPDATE blogs SET title = ?, content = ?, tags = ?, conclusion = ?, status = ? WHERE id = ?';
    const params = [updatedTitle, updatedContent, updatedTags, updatedConclusion, updatedStatus, id];

    await db.query(sql, params);
    return await this.getBlogById(id);
  },

  /**
   * Admin: Deletes a blog by ID
   */
  async deleteBlog(id) {
    const existing = await this.getBlogById(id);
    if (!existing) {
      return false;
    }

    const sql = 'DELETE FROM blogs WHERE id = ?';
    await db.query(sql, [id]);
    return true;
  },

  /**
   * Admin: Retrieves aggregated dashboard statistics
   */
  async getDashboardStats() {
    const [totalRows] = await db.query('SELECT COUNT(*) AS total FROM blogs');
    const [publishedRows] = await db.query(
      "SELECT COUNT(*) AS published FROM blogs WHERE status = 'Published'"
    );
    const [draftRows] = await db.query(
      "SELECT COUNT(*) AS drafts FROM blogs WHERE status = 'Draft'"
    );
    const [recentRows] = await db.query(
      'SELECT * FROM blogs ORDER BY created_at DESC LIMIT 6'
    );

    const totalBlogs = Number(totalRows[0]?.total || 0);
    const publishedBlogs = Number(publishedRows[0]?.published || 0);
    const draftBlogs = Number(draftRows[0]?.drafts || 0);

    return {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      recentBlogs: recentRows || [],
      dbStatus: db.getDBStatus(),
    };
  },
};

export default blogService;
