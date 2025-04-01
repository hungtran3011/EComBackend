import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

/**
 * @name MailService
 * @description Service gửi email sử dụng Brevo SMTP
 * Cung cấp các phương thức gửi email cho các mục đích khác nhau trong ứng dụng
 */

// In-memory cache của transporter để tránh tạo lại nhiều lần
let emailTransporter = null;

/**
 * @name createEmailTransporter
 * @description Tạo và cấu hình transporter cho Nodemailer
 * @returns {nodemailer.Transporter} Transporter đã cấu hình
 * @private
 */
const createEmailTransporter = () => {
  if (emailTransporter) {
    return emailTransporter;
  }
  
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
  
  return emailTransporter;
};

/**
 * @name verifyConnection
 * @description Kiểm tra kết nối với SMTP server
 * @returns {Promise<boolean>} Kết quả kiểm tra (true nếu thành công)
 */
const verifyConnection = async () => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('Mail service: SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('Mail service: Failed to verify SMTP connection:', error);
    return false;
  }
};

/**
 * @name sendMail
 * @description Gửi email với nội dung tùy chỉnh
 * @param {Object} mailOptions - Tùy chọn email
 * @param {string} mailOptions.to - Địa chỉ email người nhận
 * @param {string} mailOptions.subject - Tiêu đề email
 * @param {string} mailOptions.html - Nội dung HTML của email
 * @param {string} [mailOptions.text] - Nội dung text của email (tùy chọn)
 * @param {string} [mailOptions.from] - Địa chỉ email người gửi (tùy chọn)
 * @param {Object[]} [mailOptions.attachments] - Tệp đính kèm (tùy chọn)
 * @returns {Promise<Object>} Thông tin về email đã gửi
 */
const sendMail = async (mailOptions) => {
  try {
    const transporter = createEmailTransporter();
    
    const defaultFrom = `"${process.env.EMAIL_FROM_NAME || 'EComApp'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@ecomapp.com'}>`;
    
    const mailData = {
      from: mailOptions.from || defaultFrom,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      attachments: mailOptions.attachments
    };
    
    const info = await transporter.sendMail(mailData);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error(`Mail service: Error sending email:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * @name sendOTPEmail
 * @description Gửi email chứa mã OTP
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} otp - Mã OTP
 * @param {string} purpose - Mục đích sử dụng OTP (login, register, reset_password)
 * @returns {Promise<Object>} Thông tin về email đã gửi
 */
const sendOTPEmail = async (email, otp, purpose) => {
  // Xác định tiêu đề email dựa trên mục đích
  const subject = 
    purpose === 'login' ? 'Mã xác thực đăng nhập' : 
    purpose === 'register' ? 'Mã xác thực đăng ký tài khoản' : 
    'Mã xác thực đặt lại mật khẩu';
  
  // Xác định nội dung email dựa trên mục đích
  const purposeText = 
    purpose === 'login' ? 'đăng nhập vào tài khoản của bạn' : 
    purpose === 'register' ? 'hoàn tất đăng ký tài khoản' : 
    'đặt lại mật khẩu cho tài khoản của bạn';
  
  // Tạo nội dung HTML cho email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Mã xác thực của bạn</h2>
      <p>Xin chào! Vui lòng sử dụng mã OTP dưới đây để ${purposeText}:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
        <h1 style="letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h1>
      </div>
      <p>Mã này sẽ hết hạn sau 10 phút.</p>
      <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #777; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
    </div>
  `;
  
  return await sendMail({
    to: email,
    subject,
    html
  });
};

/**
 * @name sendWelcomeEmail
 * @description Gửi email chào mừng cho người dùng mới
 * @param {string} email - Địa chỉ email người nhận
 * @param {string} name - Tên người dùng
 * @returns {Promise<Object>} Thông tin về email đã gửi
 */
const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Chào mừng đến với EComApp!</h2>
      <p>Xin chào ${name || 'bạn'},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại EComApp. Chúng tôi rất vui mừng được chào đón bạn!</p>
      <p>Với tài khoản của mình, bạn có thể:</p>
      <ul>
        <li>Mua sắm các sản phẩm</li>
        <li>Theo dõi đơn hàng</li>
        <li>Lưu các sản phẩm yêu thích</li>
        <li>Nhận ưu đãi đặc biệt dành cho thành viên</li>
      </ul>
      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
      <p>Trân trọng,<br>Đội ngũ EComApp</p>
    </div>
  `;
  
  return await sendMail({
    to: email,
    subject: 'Chào mừng đến với EComApp',
    html
  });
};

/**
 * @name sendOrderConfirmation
 * @description Gửi email xác nhận đơn hàng
 * @param {string} email - Địa chỉ email người nhận
 * @param {Object} orderDetails - Chi tiết đơn hàng
 * @returns {Promise<Object>} Thông tin về email đã gửi
 */
const sendOrderConfirmation = async (email, orderDetails) => {
  const { orderId, items, totalAmount, shippingAddress } = orderDetails;
  
  // Tạo HTML cho danh sách sản phẩm
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Xác nhận đơn hàng #${orderId}</h2>
      <p>Cảm ơn bạn đã đặt hàng tại EComApp. Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.</p>
      
      <h3>Chi tiết đơn hàng:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="padding: 10px; text-align: left;">Sản phẩm</th>
            <th style="padding: 10px; text-align: center;">Số lượng</th>
            <th style="padding: 10px; text-align: right;">Giá</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Tổng cộng:</td>
            <td style="padding: 8px; text-align: right; font-weight: bold;">${totalAmount.toLocaleString('vi-VN')} đ</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Địa chỉ giao hàng:</h3>
      <p>${shippingAddress.fullName}<br>
      ${shippingAddress.address}<br>
      ${shippingAddress.city}, ${shippingAddress.postalCode}<br>
      ${shippingAddress.phoneNumber}</p>
      
      <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng của bạn được gửi đi.</p>
      <p>Trân trọng,<br>Đội ngũ EComApp</p>
    </div>
  `;
  
  return await sendMail({
    to: email,
    subject: `Xác nhận đơn hàng #${orderId}`,
    html
  });
};

// Khởi tạo kết nối khi service được import
(async function initMailService() {
  await verifyConnection();
})();

export default {
  sendMail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  verifyConnection
};