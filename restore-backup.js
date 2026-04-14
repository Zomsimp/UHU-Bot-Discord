import fs from 'fs';
import path from 'path';

const backupDir = path.join(process.cwd(), 'backups');
const dataPath = path.join(process.cwd(), 'data.json');

console.log('📋 Các bản backup khả dụng:\n');

if (!fs.existsSync(backupDir)) {
    console.log('❌ Không có bản backup nào.');
    process.exit(1);
}

const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('data_backup_'))
    .sort()
    .reverse();

if (backups.length === 0) {
    console.log('❌ Không có bản backup nào.');
    process.exit(1);
}

backups.forEach((file, index) => {
    const fullPath = path.join(backupDir, file);
    const stats = fs.statSync(fullPath);
    const size = (stats.size / 1024).toFixed(2);
    console.log(`${index + 1}. ${file} (${size} KB) - ${stats.mtime.toLocaleString('vi-VN')}`);
});

console.log('\n💡 Sử dụng: node restore-backup.js <số>');
console.log('   Ví dụ: node restore-backup.js 1\n');

const index = parseInt(process.argv[2]);
if (isNaN(index) || index < 1 || index > backups.length) {
    console.log('❌ Số thứ tự không hợp lệ.');
    process.exit(1);
}

const backupFile = backups[index - 1];
const backupPath = path.join(backupDir, backupFile);

// Backup file hiện tại trước khi restore
if (fs.existsSync(dataPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const currentBackup = path.join(backupDir, `data_backup_before_restore_${timestamp}.json`);
    fs.copyFileSync(dataPath, currentBackup);
    console.log(`✅ Đã backup file hiện tại: ${currentBackup}`);
}

// Restore
fs.copyFileSync(backupPath, dataPath);
console.log(`\n✅ Khôi phục thành công từ: ${backupFile}`);

// Hiển thị dữ liệu sau khi restore
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
console.log(`\n📊 Dữ liệu hiện tại:`);
console.log(JSON.stringify(data, null, 2));
