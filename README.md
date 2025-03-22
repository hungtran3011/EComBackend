# EComBackEnd

## Giới thiệu

Đây là phần backend của dự án, viết bằng ExpressJS và JS (f*** JS)

## Mô tả

Backend này được xây dựng để hỗ trợ ứng dụng thương mại điện tử với các chức năng chính:

- Quản lý người dùng (đăng ký, đăng nhập, phân quyền)
- Quản lý sản phẩm (thêm, sửa, xóa, tìm kiếm)
- Quản lý đơn hàng (tạo đơn, theo dõi trạng thái, thanh toán)
- API tích hợp với các dịch vụ bên thứ ba (thanh toán, vận chuyển)
- Hệ thống thông báo (email, push notification)

Được xây dựng trên kiến trúc RESTful API, sử dụng ExpressJS làm framework chính, kết hợp với MongoDB làm cơ sở dữ liệu. Hệ thống có khả năng mở rộng và tối ưu hóa hiệu suất cho việc xử lý số lượng lớn giao dịch.

## Sử dụng

### Cài đặt gói

1. Cài trình quản lý [Yarn](https://yarnpkg.com/) sử dụng thay cho npm (khuyến khích dùng flag `-g` để cài đặt toàn cục  cho dễ xài)

```bash
npm i -g yarn
```

2. Cài dependencies

```bash
yarn
```

3. Chạy trên môi trường development

```bash
yarn dev
```

### Thiết lập môi trường

Trong repo đã có sẵn 1 template cho các biến môi trường `.env.example`.

Hãy thiết lập 1 file môi trường khác `.env` để trữ dữ liệu môi trường thực sự của bạn, và hãy đảm bảo rằng các dữ liệu `.env` thực không được đưa lên Git công khai (trừ phi bạn muốn API key của mình bị spam tới chết).
