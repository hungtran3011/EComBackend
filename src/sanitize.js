/**
 * Sanitizes user input to prevent SQL injection and other security issues
 * @param {any} input - The user input to sanitize
 * @returns {any} - The sanitized input
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
  // Handle null or undefined
  if (input === null || input === undefined) {
    return input;
  }

  // Handle strings
  if (typeof input === 'string') {
    // Add input size limit to prevent ReDoS attacks
    const MAX_STRING_LENGTH = 1000; // Adjust as needed for your application
    if (input.length > MAX_STRING_LENGTH) {
      // Either truncate or reject overly long inputs
      input = input.substring(0, MAX_STRING_LENGTH);
    }

    // Escape special characters that could be used for SQL injection
    let sanitized = input
      .replace(/'/g, "''")           // Escape single quotes
      .replace(/\\/g, "\\\\")        // Escape backslashes
      .replace(/\0/g, "\\0")         // Escape null bytes
      .trim();                       // Trim whitespace

    // Use simpler, non-backtracking approach to remove SQL patterns
    // Instead of using regex with unbounded quantifiers, use string operations
    sanitized = sanitized.toLowerCase().includes(' or ') ? sanitized.split(/ or /i).join(" ") : sanitized;
    sanitized = sanitized.toLowerCase().includes(' and ') ? sanitized.split(/ and /i).join(" ") : sanitized;
    sanitized = sanitized.replace(/;/g, "");

    // NoSQL injection protection - avoid potential catastrophic backtracking
    sanitized = sanitized
      .replace(/\$(?=[a-z])/gi, "") // Remove MongoDB operators ($eq, $gt) but keep $ in other contexts
      .replace(/\{\s*\$[a-z]+\s*:/gi, "{"); // Remove MongoDB operator objects but keep valid JSON

    // Basic XSS protection
    sanitized = sanitized
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return sanitized;
  }

  // Handle numbers
  if (typeof input === 'number') {
    return input;
  }

  // Handle booleans
  if (typeof input === 'boolean') {
    return input;
  }

  // Handle arrays
  if (Array.isArray(input)) {
    // Add array size limit
    const MAX_ARRAY_LENGTH = 100; // Adjust as needed
    return input.slice(0, MAX_ARRAY_LENGTH).map(item => sanitizeInput(item));
  }

  // Handle objects
  if (typeof input === 'object') {
    const sanitized = {};
    // Add property count limit
    const MAX_PROPERTIES = 100; // Adjust as needed
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

  // For any other type, return as is
  return input;
}

module.exports = { sanitizeInput };