/**
 * Làm sạch đầu vào từ người dùng để ngăn chặn SQL injection và các vấn đề bảo mật khác
 * @param {any} input - Dữ liệu đầu vào từ người dùng cần làm sạch
 * @returns {any} - Dữ liệu đã được làm sạch
 */
/**
 * @description Hàm này làm sạch dữ liệu đầu vào để ngăn chặn tấn công SQL injection.
 * Nó xử lý nhiều loại dữ liệu khác nhau bao gồm chuỗi, số, boolean, mảng và đối tượng.
 * Đối với chuỗi, hàm sẽ thoát các ký tự đặc biệt và loại bỏ các mẫu tấn công SQL phổ biến.
 * Đối với mảng và đối tượng, hàm sẽ đệ quy để làm sạch từng phần tử.
 * 
 * @param {*} input - Dữ liệu đầu vào cần được làm sạch, có thể là bất kỳ kiểu dữ liệu nào
 * 
 * @returns {*} Dữ liệu đã được làm sạch với cùng cấu trúc như dữ liệu đầu vào
 * 
 * @example
 * // Làm sạch một chuỗi
 * sanitizeInput("John's data"); // Kết quả: "John''s data"
 * 
 * // Làm sạch một đối tượng
 * sanitizeInput({name: "John's", age: 30}); // Kết quả: {name: "John''s", age: 30}
 * 
 * // Làm sạch một mảng
 * sanitizeInput(["John's", "Mary's"]); // Kết quả: ["John''s", "Mary''s"]
 */
function sanitizeInput(input) {
  // Xử lý giá trị null hoặc undefined
  if (input === null || input === undefined) {
    return input;
  }

  // Xử lý chuỗi
  if (typeof input === 'string') {
    // Thêm giới hạn kích thước đầu vào để ngăn chặn tấn công ReDoS
    const MAX_STRING_LENGTH = 1000; // Điều chỉnh theo nhu cầu ứng dụng của bạn
    if (input.length > MAX_STRING_LENGTH) {
      // Cắt ngắn hoặc từ chối đầu vào quá dài
      input = input.substring(0, MAX_STRING_LENGTH);
    }

    // Thoát các ký tự đặc biệt có thể được sử dụng cho SQL injection
    let sanitized = input
      .replace(/'/g, "''")           // Thoát dấu nháy đơn
      .replace(/\\/g, "\\\\")        // Thoát dấu gạch chéo ngược
      .replace(/\0/g, "\\0")         // Thoát byte null
      .trim();                       // Cắt khoảng trắng

    // Sử dụng phương pháp đơn giản hơn, không backtracking để loại bỏ các mẫu SQL
    // Thay vì sử dụng regex với quantifiers không giới hạn, sử dụng thao tác chuỗi
    sanitized = sanitized.toLowerCase().includes(' or ') ? sanitized.split(/ or /i).join(" ") : sanitized;
    sanitized = sanitized.toLowerCase().includes(' and ') ? sanitized.split(/ and /i).join(" ") : sanitized;
    sanitized = sanitized.replace(/;/g, "");

    // Bảo vệ chống NoSQL injection - tránh backtracking thảm họa
    sanitized = sanitized
      .replace(/\$(?=[a-z])/gi, "") // Loại bỏ toán tử MongoDB ($eq, $gt) nhưng giữ $ trong các ngữ cảnh khác
      .replace(/\{\s*\$[a-z]+\s*:/gi, "{"); // Loại bỏ đối tượng toán tử MongoDB nhưng giữ JSON hợp lệ

    // Bảo vệ cơ bản chống XSS
    sanitized = sanitized
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\(/g, "&#40;")
      .replace(/\)/g, "&#41;")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "");

    return sanitized;
  }

  // Xử lý số
  if (typeof input === 'number') {
    return input;
  }

  // Xử lý boolean
  if (typeof input === 'boolean') {
    return input;
  }

  // Xử lý mảng
  if (Array.isArray(input)) {
    // Thêm giới hạn kích thước mảng
    const MAX_ARRAY_LENGTH = 100; // Điều chỉnh theo nhu cầu
    return input.slice(0, MAX_ARRAY_LENGTH).map(item => sanitizeInput(item));
  }

  // Xử lý đối tượng
  if (typeof input === 'object') {
    const sanitized = {};
    // Thêm giới hạn số lượng thuộc tính
    const MAX_PROPERTIES = 100; // Điều chỉnh theo nhu cầu
    let propertyCount = 0;

    for (const key in input) {
      if (propertyCount >= MAX_PROPERTIES) break;
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        sanitized[key] = sanitizeInput(input[key]);
        propertyCount++;
      }
    }
    return sanitized;
  }

  // Đối với bất kỳ kiểu dữ liệu nào khác, trả về như ban đầu
  return input;
}

module.exports = { sanitizeInput };