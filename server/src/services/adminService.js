import db from '../config/db.js';

export const adminService = {
  /**
   * Find admin by Firebase UID
   */
  async findByFirebaseUID(uid) {
    const [rows] = await db.query('SELECT * FROM admins WHERE firebase_uid = ?', [uid]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Add a new admin to MySQL
   */
  async addAdmin({ firebase_uid, email, name }) {
    const existing = await this.findByFirebaseUID(firebase_uid);
    if (existing) {
      return existing;
    }

    const sql = 'INSERT INTO admins (firebase_uid, email, name) VALUES (?, ?, ?)';
    const [result] = await db.query(sql, [firebase_uid, email, name || 'Utsanova Admin']);
    const insertId = result.insertId || result[0]?.insertId;

    const [created] = await db.query('SELECT * FROM admins WHERE id = ?', [insertId]);
    return created[0];
  },

  /**
   * List all admins (Admin management)
   */
  async listAdmins() {
    const [rows] = await db.query('SELECT id, firebase_uid, email, name, created_at FROM admins ORDER BY created_at ASC');
    return rows;
  },
};

export default adminService;
