import fs from 'fs';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backups');
const dataPath = path.join(process.cwd(), 'data.json');

console.log('🔧 UHU Bot - Công cụ khôi phục dữ liệu\n');

if (!fs.existsSync(backupDir)) {
    console.log('❌ Không có thư mục backup.');
    process.exit(1);
}

const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('data_backup_'))
    .sort()
    .reverse();

if (backups.length === 0) {
    console.log('❌ Không có file backup nào.');
    process.exit(1);
}

console.log('📋 Danh sách backup khả dụng:\n');

backups.forEach((file, index) => {
    const fullPath = path.join(backupDir, file);
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`${index + 1}. ${file}`);
    console.log(`   📅 ${stats.mtime.toLocaleString('vi-VN')}`);
    console.log(`   📏 ${size} KB\n`);
});

console.log('💡 Cách sử dụng:');
console.log('1. Chạy: node emergency-restore.js <số>');
console.log('2. Ví dụ: node emergency-restore.js 1\n');

const index = parseInt(process.argv[2]);
if (isNaN(index) || index < 1 || index > backups.length) {
    console.log('❌ Vui lòng nhập số thứ tự hợp lệ.');
    console.log('💡 Ví dụ: node emergency-restore.js 1');
    process.exit(1);
}

const backupFile = backups[index - 1];
const backupPath = path.join(backupDir, backupFile);

// Đọc dữ liệu hiện tại để backup trước khi restore
let currentData = '{}';
if (fs.existsSync(dataPath)) {
    currentData = fs.readFileSync(dataPath, 'utf8');
    const emergencyBackup = path.join(backupDir, `emergency_backup_before_restore_${Date.now()}.json`);
    fs.writeFileSync(emergencyBackup, currentData);
    console.log(`✅ Đã backup dữ liệu hiện tại vào: ${path.basename(emergencyBackup)}`);
}

// Khôi phục từ backup
const backupContent = fs.readFileSync(backupPath, 'utf8');
fs.writeFileSync(dataPath, backupContent);

console.log(`\n✅ KHÔI PHỤC THÀNH CÔNG từ: ${backupFile}`);

// Hiển thị thông tin dữ liệu sau khi restore
const restoredData = JSON.parse(backupContent);
console.log(`\n📊 Dữ liệu sau khi khôi phục:`);
console.log(`   👥 Số users: ${Object.keys(restoredData).length}`);

Object.entries(restoredData).forEach(([userId, data]) => {
    console.log(`   🔹 ${userId}: ${data.xu} xu, ${data.chuong.length} con vật`);
});

console.log('\n🎉 Bot sẽ tự động sử dụng dữ liệu mới khi restart!');
