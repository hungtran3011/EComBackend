# EComBackEnd

## Giới thiệu

Đây là phần backend của dự án, viết bằng ExpressJS và JS (f*** JS)

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
