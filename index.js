import 'dotenv/config';
import fs from 'fs';
import path from 'path';
const dataPath = path.join(process.cwd(), 'data.json');
const backupDir = path.join(process.cwd(), 'backups');

// Tạo thư mục backup nếu chưa tồn tại
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Hàm backup dữ liệu
const backupData = () => {
    try {
        if (fs.existsSync(dataPath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupPath = path.join(backupDir, `data_backup_${timestamp}.json`);
            fs.copyFileSync(dataPath, backupPath);
            console.log(`📦 Đã backup dữ liệu vào: ${path.basename(backupPath)}`);
        } else {
            console.warn('⚠️ Không thể backup: data.json không tồn tại');
        }
    } catch (err) {
        console.error('❌ Lỗi backup:', err);
    }
};
import { 
    Client, Events, GatewayIntentBits, MessageFlags, 
    ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder 
} from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const ANIMALS = [
    { name: 'Chuột', emoji: '🐭', rarity: 'Phổ Thông', price: 10, weight: 120 },
    { name: 'Thỏ', emoji: '🐰', rarity: 'Phổ Thông', price: 10, weight: 120 },
    { name: 'Cá', emoji: '🐟', rarity: 'Phổ Thông', price: 10, weight: 120 },
    { name: 'Gà', emoji: '🐔', rarity: 'Bình Thường', price: 50, weight: 60 },
    { name: 'Chó', emoji: '🐶', rarity: 'Bình Thường', price: 50, weight: 60 },
    { name: 'Mèo', emoji: '🐱', rarity: 'Bình Thường', price: 50, weight: 60 },
    { name: 'Hổ', emoji: '🐯', rarity: 'Hiếm', price: 100, weight: 40 },
    { name: 'Sư Tử', emoji: '🦁', rarity: 'Hiếm', price: 100, weight: 40 },
    { name: 'Gấu', emoji: '🐻', rarity: 'Hiếm', price: 100, weight: 40 },
    { name: 'Rùa', emoji: '🐢', rarity: 'Cực Hiếm', price: 500, weight: 20 },
    { name: 'Cá Mập', emoji: '🦈', rarity: 'Cực Hiếm', price: 500, weight: 20 },
    { name: 'Chim Đại Bàng', emoji: '🦅', rarity: 'Cực Hiếm', price: 500, weight: 20 },
    { name: 'Rồng', emoji: '🐉', rarity: 'Truyền Thuyết', price: 1000, weight: 5 },
    { name: 'Khủng Long', emoji: '🦖', rarity: 'Truyền Thuyết', price: 1000, weight: 5 },
    { name: 'Cổ Dài', emoji: '🦕', rarity: 'Truyền Thuyết', price: 1000, weight: 5 },
    { name: 'Kỳ Lân', emoji: '🦄', rarity: 'Thần thoại', price: 5000, weight: 1 }
];

const cooldowns = new Map();
const isPlaying = new Set(); 
const processingInteractions = new Set(); // Track interactions đang xử lý
let lastDataHash = null; // Track hash của data để phát hiện thay đổi bất ngờ

// Hàm tính hash đơn giản của data
const getDataHash = (data) => {
    return JSON.stringify(data).length + '_' + Object.keys(data).length;
};

// Hàm reply an toàn (xử lý lỗi Unknown interaction)
const safeReply = async (interaction, options) => {
    try {
        if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(options);
        } else {
            return await interaction.reply(options);
        }
    } catch (error) {
        if (error.code === 10062) { // Unknown interaction
            console.warn('⚠️ Interaction đã hết hạn, bỏ qua reply');
        } else {
            console.error('❌ Lỗi reply:', error);
        }
    }
};

const getData = () => {
    if (!fs.existsSync(dataPath)) {
        console.log('⚠️ File data.json không tìm thấy!');
        
        // Thử khôi phục từ backup mới nhất
        if (fs.existsSync(backupDir)) {
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('data_backup_'))
                .sort()
                .reverse();
            
            if (backups.length > 0) {
                const latestBackup = path.join(backupDir, backups[0]);
                console.log(`✅ Khôi phục từ backup: ${backups[0]}`);
                fs.copyFileSync(latestBackup, dataPath);
                const content = fs.readFileSync(dataPath, 'utf8');
                const data = JSON.parse(content);
                lastDataHash = getDataHash(data);
                return data;
            }
        }
        
        // Nếu không có backup, tạo file mới
        console.log('📝 Tạo file data.json mới...');
        fs.writeFileSync(dataPath, '{}', 'utf8');
        lastDataHash = getDataHash({});
        return {};
    }
    try {
        const content = fs.readFileSync(dataPath, 'utf8');
        const data = (content && content.trim() !== "") ? JSON.parse(content) : {};
        const currentHash = getDataHash(data);
        
        // Phát hiện data bị reset bất ngờ
        if (lastDataHash && lastDataHash !== currentHash && Object.keys(data).length < 2) {
            console.error('🚨 PHÁT HIỆN DATA BỊ RESET BẤT NGỜ!');
            console.error(`   Trước: ${lastDataHash}, Sau: ${currentHash}`);
            
            // Thử khôi phục từ backup
            if (fs.existsSync(backupDir)) {
                const backups = fs.readdirSync(backupDir)
                    .filter(f => f.startsWith('data_backup_'))
                    .sort()
                    .reverse();
                
                if (backups.length > 0) {
                    const latestBackup = path.join(backupDir, backups[0]);
                    console.log(`🔄 Tự động khôi phục từ: ${backups[0]}`);
                    fs.copyFileSync(latestBackup, dataPath);
                    const backupContent = fs.readFileSync(dataPath, 'utf8');
                    const backupData = JSON.parse(backupContent);
                    lastDataHash = getDataHash(backupData);
                    return backupData;
                }
            }
        }
        
        lastDataHash = currentHash;
        console.log(`📖 Đã đọc dữ liệu (${Object.keys(data).length} users)`);
        return data;
    } catch (err) {
        console.error('❌ Lỗi đọc data.json:', err);
        
        // Nếu file corrupt, thử khôi phục từ backup
        if (fs.existsSync(backupDir)) {
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('data_backup_'))
                .sort()
                .reverse();
            
            if (backups.length > 0) {
                const latestBackup = path.join(backupDir, backups[0]);
                console.log(`⚠️ File data.json corrupt! Khôi phục từ: ${backups[0]}`);
                fs.copyFileSync(latestBackup, dataPath);
                const content = fs.readFileSync(dataPath, 'utf8');
                const data = JSON.parse(content);
                lastDataHash = getDataHash(data);
                return data;
            }
        }
        lastDataHash = getDataHash({});
        return {};
    }
};

const saveData = (data) => {
    if (!data) {
        console.error('❌ LỖI: saveData được gọi với data null/undefined!');
        return;
    }

    const userCount = Object.keys(data).length;
    console.log(`💾 Đang lưu dữ liệu (${userCount} users)...`);

    try {
        backupData(); // Backup trước khi ghi
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log(`✅ Đã lưu thành công dữ liệu (${userCount} users)`);
    } catch (error) {
        console.error('❌ LỖI khi lưu data.json:', error);
    }
};

client.on(Events.ClientReady, (c) => console.log(`✅ Bot ${c.user.tag} đã online!`));

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Tránh xử lý duplicate interaction
    if (processingInteractions.has(interaction.id)) {
        console.warn(`⚠️ Duplicate interaction ${interaction.id}, bỏ qua`);
        return;
    }
    processingInteractions.add(interaction.id);

    // Thêm timeout để tránh reply quá chậm
    const timeout = setTimeout(() => {
        console.warn(`⚠️ Interaction ${interaction.id} timeout sau 2500ms`);
    }, 2500);

    try {

    let userData = getData();
    let userId = interaction.user.id;
    const now = Date.now();

    if (!userData[userId]) {
        userData[userId] = { xu: 1000, chuong: [] };
        saveData(userData);
    }
    const user = userData[userId];

    if (isPlaying.has(userId) && interaction.commandName !== 'xu') {
        return await safeReply(interaction, { content: `⚠️ Bạn đang trong ván Xì Dách!`, flags: [MessageFlags.Ephemeral] });
    }

    const cooldownKey = `${interaction.commandName}-${userId}`;
    if (cooldowns.has(cooldownKey) && now < cooldowns.get(cooldownKey)) {
        const timeLeft = ((cooldowns.get(cooldownKey) - now) / 1000).toFixed(1);
        return await safeReply(interaction, { content: `⏳ Đợi **${timeLeft}s** nữa nhé.`, flags: [MessageFlags.Ephemeral] });
    }

    try {
        if (interaction.commandName === 'xu') {
            return await safeReply(interaction, `💰 Bạn có: **${user.xu.toLocaleString()}** xu.`);
        }

        if (interaction.commandName === 'hunt') {
            const totalWeight = ANIMALS.reduce((s, a) => s + a.weight, 0);
            let rand = Math.random() * totalWeight;
            let caught = ANIMALS[0];
            for (const a of ANIMALS) { if (rand < a.weight) { caught = a; break; } rand -= a.weight; }
            user.chuong.push(caught.name);
            cooldowns.set(cooldownKey, now + 60000);
            saveData(userData);
            return await safeReply(interaction, `🏹 Bắt được: **${caught.emoji} ${caught.name}**! (Độ hiếm: ${caught.rarity})`);
        }

        // --- 3. LỆNH CHUỒNG (PHIÊN BẢN FIX ICON) ---
        if (interaction.commandName === 'chuong') {
            if (!user.chuong || user.chuong.length === 0) {
                return await safeReply(interaction, '📪 Chuồng của bạn đang trống rỗng. Hãy đi săn ngay!');
            }

            const counts = {};
            user.chuong.forEach(t => counts[t] = (counts[t] || 0) + 1);

            const groups = {
                'Phổ Thông': { icon: '⚪', list: [] },
                'Bình Thường': { icon: '🔵', list: [] },
                'Hiếm': { icon: '🟢', list: [] },
                'Cực Hiếm': { icon: '🟡', list: [] },
                'Truyền Thuyết': { icon: '🟠', list: [] },
                'Thần thoại': { icon: '🔴', list: [] }
            };

            Object.entries(counts).forEach(([ten, sl]) => {
                const info = ANIMALS.find(a => a.name.toLowerCase() === ten.toLowerCase());
                if (info && groups[info.rarity]) {
                    groups[info.rarity].list.push(`${info.emoji} **${info.name}** \`x${sl}\``);
                }
            });

            let hienThi = `🏠 **KHO ĐỘNG VẬT CỦA ${interaction.user.username.toUpperCase()}**\n`;
            hienThi += `──────────────────\n`;

            let coThu = false;
            for (const [tenDoHiem, data] of Object.entries(groups)) {
                if (data.list.length > 0) {
                    hienThi += `${data.icon} **${tenDoHiem.toUpperCase()}:** ${data.list.join(' | ')}\n`;
                    coThu = true;
                }
            }
            return await safeReply(interaction, hienThi);
        }

        if (interaction.commandName === 'chuyenxu') {
            const receiver = interaction.options.getUser('nguoi_nhan');
            const amount = interaction.options.getInteger('so_tien');
            if (receiver.id === userId) return await safeReply(interaction, '❌ Tự chuyển cho mình à?');
            if (amount <= 0 || user.xu < amount) return await safeReply(interaction, '❌ Xu không hợp lệ!');
            if (!userData[receiver.id]) userData[receiver.id] = { xu: 1000, chuong: [] };
            user.xu -= amount;
            userData[receiver.id].xu += amount;
            saveData(userData);
            return await safeReply(interaction, `✅ Đã chuyển **${amount}** xu cho **${receiver.username}**!`);
        }

        if (interaction.commandName === 'xidach') {
            const tienCuoc = interaction.options.getInteger('cuoc');
            if (tienCuoc <= 0 || tienCuoc > user.xu) return await safeReply(interaction, '❌ Không đủ xu!');
            
            isPlaying.add(userId);
            const deck = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const getCard = () => deck[Math.floor(Math.random() * deck.length)];
            const getPoint = (h) => {
                let p = 0, a = 0;
                h.forEach(c => { if (['J','Q','K'].includes(c)) p+=10; else if (c==='A'){ p+=11; a++; } else p+=parseInt(c); });
                while (p>21 && a>0){ p-=10; a--; } return p;
            };

            let pHand = [getCard(), getCard()], bHand = [getCard(), getCard()];
            const render = (d=false) => `🃏 **BẠN:** ${pHand.join(', ')} (${getPoint(pHand)}đ)\n🤖 **BOT:** ${d ? bHand.join(', ')+' ('+getPoint(bHand)+'đ)' : bHand[0]+', ?'}`;
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('h').setLabel('Rút bài').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('s').setLabel('Dừng').setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ content: render(), components: [row] });
            const msg = await interaction.fetchReply();
            const col = msg.createMessageComponentCollector({ filter: i => i.user.id === userId, time: 60000 });

            col.on('collect', async i => {
                if (i.customId === 'h') {
                    pHand.push(getCard());
                    if (getPoint(pHand) > 21) {
                        user.xu -= tienCuoc; saveData(userData);
                        await i.update({ content: `💥 BẠN CHÁY!\n${render(true)}\nThua **${tienCuoc}** xu.`, components: [] });
                        col.stop('done');
                    } else await i.update({ content: render() });
                } else {
                    while (getPoint(bHand) < 17) bHand.push(getCard());
                    const pP = getPoint(pHand), bP = getPoint(bHand);
                    let r = "";
                    if (bP > 21 || pP > bP) { user.xu += tienCuoc; r = "🎉 THẮNG!"; }
                    else if (pP < bP) { user.xu -= tienCuoc; r = "💸 THUA!"; }
                    else r = "🤝 HÒA!";
                    saveData(userData);
                    await i.update({ content: `${r}\n${render(true)}`, components: [] });
                    col.stop('done');
                }
            });

            col.on('end', (collected, reason) => {
                isPlaying.delete(userId);
                cooldowns.set(cooldownKey, Date.now() + 5000);
                if (reason === 'time') interaction.editReply({ content: '⏰ Hết giờ! Ván đấu đã hủy, bạn không mất xu.', components: [] });
            });
        }
        
        // --- 4. CHẴN LẺ (BẢN FIX LỖI) ---
        if (interaction.commandName === 'chanle') {
            const luaChon = interaction.options.getString('chon');
            const tienCuoc = interaction.options.getInteger('cuoc');

            // Kiểm tra tiền trước khi defer để báo lỗi nhanh
            if (tienCuoc <= 0 || tienCuoc > user.xu) {
                return await safeReply(interaction, { content: '❌ Bạn không đủ xu để đặt cược!', flags: [MessageFlags.Ephemeral] });
            }

            // Báo cho Discord là Bot đang xử lý, đừng báo lỗi Unknown Interaction
            await interaction.deferReply();

            const so = Math.floor(Math.random() * 100) + 1;
            const ketQua = (so % 2 === 0) ? 'chan' : 'le';
            const win = ketQua === luaChon;

            user.xu += win ? tienCuoc : -tienCuoc;
            saveData(userData);
            
            // Set cooldown
            cooldowns.set(cooldownKey, Date.now() + 5000);

            const status = win ? `🎉 **THẮNG!** Bạn nhận được **${tienCuoc.toLocaleString()}** xu.` : `💸 **THUA!** Bạn mất **${tienCuoc.toLocaleString()}** xu.`;
            
            return await interaction.editReply(`🎲 Số ra: **${so}** (${ketQua === 'chan' ? 'Chẵn' : 'Lẻ'}).\n${status}\n💰 Số dư hiện tại: **${user.xu.toLocaleString()}** xu.`);
        }
        
        if (interaction.commandName === 'ban') {
            const tenNhap = interaction.options.getString('ten').trim();
            
            // Tìm thú trong danh sách mẫu (không phân biệt hoa thường)
            const info = ANIMALS.find(a => a.name.toLowerCase() === tenNhap.toLowerCase());
            
            if (!info) return await safeReply(interaction, '❌ Tên thú không tồn tại trong danh sách!');

            // Tìm vị trí của thú đó trong chuồng của user
            const index = user.chuong.findIndex(t => t.toLowerCase() === info.name.toLowerCase());

            if (index === -1) {
                return await safeReply(interaction, `❌ Bạn không có **${info.name}** trong chuồng!`);
            }

            // Xóa 1 con và cộng tiền
            user.chuong.splice(index, 1);
            user.xu += info.price;
            saveData(userData);

            return await safeReply(interaction, `💰 Đã bán **${info.emoji} ${info.name}** lấy **${info.price.toLocaleString()}** xu. Số dư: **${user.xu.toLocaleString()}**`);
        }

        if (interaction.commandName === 'chaydua') {
            const horseChoice = interaction.options.getString('vandongvien');
            const bet = interaction.options.getInteger('cuoc');

            if (bet <= 0 || user.xu < bet) return await safeReply(interaction, '❌ Bạn không đủ xu!');

            await interaction.deferReply();

            // Danh sách nhân vật
            const horses = [
                { name: 'NamVuiVe', emoji: '<:544616485_122141964572814344_317:1493480865311756319>', pos: 0, stats: '🏃928 💪982 ⚡852' },
                { name: 'Tày Tay To', emoji: '<:566454952_681196455040008_865220:1493480867644047420>', pos: 0, stats: '🏃945 💪910 ⚡890' },
                { name: 'Hải Sao Hoả', emoji: '<:553707392_1467932234264871_37311:1493480557928124548>', pos: 0, stats: '🏃960 💪850 ⚡910' },
                { name: 'ZomSimp', emoji: '<:638356699_1914456819199749_91733:1493480869824954418>', pos: 0, stats: '🏃999 💪800 ⚡820' },
                { name: 'Yêu Chị Vú To', emoji: '<:472816667_1343342706833053_90308:1493483883432509542>', pos: 0, stats: '🏃880 💪950 ⚡980' },
                { name: 'Food(Phuc)', emoji: '<:637593412_2869905910008282_10537:1493481024859144252>', pos: 0, stats: '🏃910 💪920 ⚡930' },
                { name: 'Furry', emoji: '<:543108343_798581053104615_676738:1493482360157507644>', pos: 0, stats: '🏃920 💪940 ⚡900' }
            ];

            const trackLength = 15;
            let winners = [];

           const renderTrack = (finished = false) => {
                // Tìm thông tin của nhân vật mà người chơi đã chọn
                const chosenInfo = horses.find(h => h.name === horseChoice);
                
                let trackMsg = `🏃‍♂️ **Chạy Đua - ${finished ? 'KẾT THÚC!' : 'ĐANG DIỄN RA...'}**\n\n`;
                
                // Thêm chosenInfo.emoji vào trước tên nhân vật
                trackMsg += `Bạn chọn: ${chosenInfo.emoji}: **${horseChoice}**\n`; 
                trackMsg += `Chỉ số: ${chosenInfo.stats}\n`;
                trackMsg += `Cược: **${bet.toLocaleString()} xu**\n`;
                trackMsg += `\n` + '─'.repeat(trackLength + 2) + '🏁\n';

                horses.forEach(h => {
                    let line = new Array(trackLength).fill('-'); // Dùng ô vuông trắng cho giống ảnh
                    let currentPos = Math.min(h.pos, trackLength - 1);
                    line[currentPos] = `${h.emoji} `; // Thêm khoảng trắng sau emoji
                    
                    trackMsg += `${line.join('')} (${h.pos})\n`;
                });
                
                if (finished) {
    const rank = winners.indexOf(horseChoice) + 1; // Hạng: 1, 2, 3...
    
    const getEmoji = (name) => {
        const h = horses.find(horse => horse.name === name);
        return h ? h.emoji : '';
    };

    let resultTxt = `\n━━━━ **KẾT QUẢ** ━━━━\n`;
    resultTxt += `🥇 **1st:** ${getEmoji(winners[0])} ${winners[0]}\n`;
    resultTxt += `🥈 **2nd:** ${getEmoji(winners[1])} ${winners[1]}\n`;
    resultTxt += `🥉 **3rd:** ${getEmoji(winners[2])} ${winners[2]}\n`;
    
    let winMoney = 0;

                if (rank === 1) {
                    winMoney = bet * 3; // Về nhất x3
                    user.xu += winMoney;
                    resultTxt += `\n🏆 **VỀ NHẤT!** Bạn nhận được **${winMoney.toLocaleString()}** xu (x3)`;
                } else if (rank === 2) {
                    winMoney = bet * 2; // Về nhì x2
                    user.xu += winMoney;
                    resultTxt += `\n🥈 **VỀ NHÌ!** Bạn nhận được **${winMoney.toLocaleString()}** xu (x2)`;
                } else if (rank === 3) {
                    winMoney = bet * 1; // Về ba x1 (huề vốn)
                    user.xu += winMoney;
                    resultTxt += `\n🥉 **VỀ BA!** Bạn nhận được **${winMoney.toLocaleString()}** xu (x1)`;
                } else {
                    // Hạng 4 trở đi là thua
                    user.xu -= bet;
                    resultTxt += `\n💸 **HẠNG ${rank}:** Rất tiếc, bạn mất **${bet.toLocaleString()}** xu`;
                }
                
                saveData(userData);
                trackMsg += resultTxt + `\n💰 Tổng xu hiện có: **${user.xu.toLocaleString()}** xu`;
            }
                return trackMsg;
            };

            const msg = await interaction.editReply(renderTrack());

            const gameInterval = setInterval(async () => {
                horses.forEach(h => {
                    if (h.pos < trackLength) {
                        // Tỉ lệ tiến ngẫu nhiên
                        h.pos += Math.floor(Math.random() * 3);
                        if (h.pos >= trackLength && !winners.includes(h.name)) {
                            winners.push(h.name);
                        }
                    }
                });

                if (winners.length >= horses.length) {
                    clearInterval(gameInterval);
                    await interaction.editReply(renderTrack(true));
                } else {
                    await interaction.editReply(renderTrack()).catch(() => clearInterval(gameInterval));
                }
            }, 1500); // 1.5 giây cập nhật 1 lần để tránh bị Discord chặn do spam update
        }

        } catch (err) {
            isPlaying.delete(userId);
            console.error('❌ Lỗi xử lý lệnh:', err);
        }
    } finally {
        clearTimeout(timeout);
        processingInteractions.delete(interaction.id);
    }
});

client.login(process.env.TOKEN);