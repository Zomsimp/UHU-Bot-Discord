# UHU Bot - Hướng dẫn khôi phục dữ liệu

## 🚨 Dữ liệu bị mất?

Đừng lo! Bot đã được trang bị hệ thống bảo vệ dữ liệu tự động.

## 🔧 Công cụ khôi phục

### 1. Khôi phục tự động (Khuyến nghị)
Bot sẽ tự động phát hiện và khôi phục dữ liệu từ backup khi:
- File `data.json` bị xóa
- File `data.json` bị corrupt
- Dữ liệu bị reset bất ngờ

**Cách hoạt động:**
- Bot sẽ log: `🚨 PHÁT HIỆN DATA BỊ RESET BẤT NGỜ!`
- Tự động khôi phục từ backup gần nhất
- Log: `🔄 Tự động khôi phục từ: data_backup_...`

### 2. Khôi phục thủ công
Nếu cần khôi phục thủ công:

```bash
# Xem danh sách backup
node emergency-restore.js

# Khôi phục từ backup số 1 (mới nhất)
node emergency-restore.js 1
```

### 3. Khôi phục từ script cũ
```bash
node restore-backup.js
```

## 📊 Kiểm tra dữ liệu

```bash
# Xem dữ liệu hiện tại
cat data.json | jq '.[] | {xu: .xu, soLuongChuong: (.chuong | length)}'

# Xem các file backup
ls -la backups/
```

## 🛡️ Bảo vệ dữ liệu

Bot đã được cải tiến với:
- ✅ Backup tự động trước mỗi lần lưu
- ✅ Phát hiện data reset bất ngờ
- ✅ Khôi phục tự động từ backup
- ✅ Logging chi tiết để debug
- ✅ Validation dữ liệu trước khi lưu

## 📝 Lưu ý

- File `data.json` được bảo vệ bởi `.gitignore` - không bị commit lên git
- Thư mục `backups/` chứa tất cả phiên bản backup
- Bot sẽ log chi tiết mọi hoạt động liên quan đến dữ liệu

## 🆘 Cần hỗ trợ?

Nếu dữ liệu vẫn bị mất, hãy:
1. Kiểm tra log của bot
2. Chạy `node emergency-restore.js` để khôi phục thủ công
3. Liên hệ admin nếu cần khôi phục từ dữ liệu cũ