// import auditLogger from '../services/audit-logger.service.js';
import AuthService from 'auth.service.js';
import { debugLogger } from '../../common/middlewares/debug-logger';

const logger = debugLogger('admin-controller');

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Lấy nhật ký hoạt động admin
 *     description: Truy xuất nhật ký hành động của admin với phân trang và tùy chọn lọc
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Lọc theo ID của admin (tùy chọn)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số lượng bản ghi tối đa trả về
 *     responses:
 *       200:
 *         description: Danh sách nhật ký hoạt động admin
 *       401:
 *         description: Không được xác thực
 *       403:
 *         description: Không có quyền truy cập
 */
const getAdminLogs = async (req, res) => {
  try {
    // Kiểm tra xem người dùng hiện tại có phải là admin không
    const { user } = req;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { adminId, limit } = req.query;
    const logs = await auditLogger.getAdminLogs(
      adminId || null,
      parseInt(limit) || 50
    );
    
    res.status(200).json({ logs });
  } catch (error) {
    logger.error('Error retrieving admin logs:', error);
    res.status(500).json({ message: 'Failed to retrieve admin logs' });
  }
};

/**
 * @swagger
 * /admin/logs/{logId}:
 *   get:
 *     summary: Lấy chi tiết một nhật ký
 *     description: Truy xuất thông tin chi tiết của một bản ghi nhật ký cụ thể
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bản ghi nhật ký
 *     responses:
 *       200:
 *         description: Chi tiết bản ghi nhật ký
 *       401:
 *         description: Không được xác thực
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy bản ghi
 */
const getLogById = async (req, res) => {
  try {
    // Kiểm tra xem người dùng hiện tại có phải là admin không
    const { user } = req;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { logId } = req.params;
    const log = await auditLogger.getLogById(logId, 'admin');
    
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    
    res.status(200).json({ log });
  } catch (error) {
    logger.error('Error retrieving log details:', error);
    res.status(500).json({ message: 'Failed to retrieve log details' });
  }
};

export default {
  getAdminLogs,
  getLogById
};