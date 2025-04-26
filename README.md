# EComBackEnd

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://app.koyeb.com/deploy?name=ecombackend&repository=hungtran3011%2FEComBackend&branch=main&instance_type=free&regions=was&instances_min=0&autoscaling_sleep_idle_delay=300&env%5BACCESS_TOKEN_SECRET%5D=3861c6a628e69985ea9b85c46675bd22e608dd187d208b41ae2b8da398e2b7d7b87cb3d7ae7cadd83f14819bc9bb7f9bd26fc2d5d4dae1c806238a7ccd1bb59e&env%5BADMIN_URL%5D=https%3A%2F%2Fecom-admin-dashboard-hung.vercel.app%2F&env%5BCLOUDINARY_API_KEY%5D=913236922868761&env%5BCLOUDINARY_API_SECRET%5D=wf3qQcWWfrHH5Ixm2A8jxbBOHIg&env%5BCLOUDINARY_CLOUD_NAME%5D=dqncf4dyz&env%5BCSRF_TOKEN_SECRET%5D=643798851989f1d7f2487cef5b84186e44e79c76ec6bbf449cb8778d639a9c58cff704f8ffc53c0998d4792c5810dc286cd60b022564d6b5c652d6f7b2ee213d&env%5BEMAIL_FROM_ADDRESS%5D=no-reply%40hungtq225004.me&env%5BEMAIL_FROM_NAME%5D=EComApp&env%5BFRONTEND_URL%5D=https%3A%2F%2Fecom-fe-ten.vercel.app%2F&env%5BMONGO_READ_URI%5D=mongodb%2Bsrv%3A%2F%2FReadAllAnon%3ApObmgvzkewXCdoiY%40ecom.fxtgd.mongodb.net%2F%3FretryWrites%3Dtrue%26w%3Dmajority%26appName%3Decom&env%5BMONGO_READ_WRITE_URI%5D=mongodb%2Bsrv%3A%2F%2FReadWriteAll%3AmOl3xxSJCWmQQ54z%40ecom.fxtgd.mongodb.net%2Fecom%3FretryWrites%3Dtrue%26w%3Dmajority%26appName%3Decom&env%5BNODE_ENV%5D=production&env%5BPORT%5D=8080&env%5BREDIS_URL%5D=redis%3A%2F%2Fredis-16542.c295.ap-southeast-1-1.ec2.redns.redis-cloud.com%3A16542&env%5BREFRESH_TOKEN_SECRET%5D=d59b65e82f3b27efac6113a6958c35d5e82906a791a5a2d8dd323a4085510ed51373ed1e5174a1614978382904e80543ed88610fbf7226ed58de86607bfa448&env%5BSESSION_SECRET%5D=1cfd125749eb5081891c010ff2f28a9d97fe616ece85d3ae92d9f001c6220c6564610f87529241589e246b25d23ea35f0fa8b14043e63589e6eb46c7ffa243f6&env%5BSMTP_HOST%5D=smtp-relay.brevo.com&env%5BSMTP_PASSWORD%5D=2mLYc5KpQrnAFqft&env%5BSMTP_PORT%5D=587&env%5BSMTP_USER%5D=88f9d6001%40smtp-brevo.com&ports=8080%3Bhttp%3B%2F&hc_protocol%5B8080%5D=tcp&hc_grace_period%5B8080%5D=5&hc_interval%5B8080%5D=30&hc_restart_limit%5B8080%5D=3&hc_timeout%5B8080%5D=5&hc_path%5B8080%5D=%2F&hc_method%5B8080%5D=get)

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
