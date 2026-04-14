import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'xu',
    description: 'Xem số dư xu hiện có của bạn',
  },
  {
    name: 'chanle',
    description: 'Đặt cược Chẵn hoặc Lẻ (x1 tiền thưởng)',
    options: [
      {
        name: 'chon',
        description: 'Chọn Chẵn hoặc Lẻ',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Chẵn', value: 'chan' },
          { name: 'Lẻ', value: 'le' }
        ]
      },
      {
        name: 'cuoc',
        description: 'Số tiền bạn muốn cược',
        type: 4, // INTEGER
        required: true
      }
    ]
  },
  {
    name: 'hunt',
    description: 'Đi săn động vật quý hiếm',
  },
  {
    name: 'chuong',
    description: 'Xem danh sách động vật trong chuồng của bạn',
  },
  {
    name: 'ban',
    description: 'Bán động vật để lấy xu',
    options: [
      {
        name: 'ten',
        description: 'Tên con vật muốn bán (ví dụ: Rồng, Hổ...)',
        type: 3, // STRING
        required: true
      },
      {
        name: 'soluong',
        description: 'Số lượng muốn bán (mặc định là 1)',
        type: 4, // INTEGER
        required: false
      }
    ]
  },
  {
    name: 'xidach',
    description: 'Chơi bài Xì Dách với Bot',
    options: [
      {
        name: 'cuoc',
        description: 'Số tiền muốn cược',
        type: 4, // INTEGER
        required: true
      }
    ]
  },
  {
  name: 'chuyenxu',
  description: 'Chuyển xu cho người chơi khác',
  options: [
    {
      name: 'nguoi_nhan',
      description: 'Người bạn muốn tặng xu',
      type: 6, // USER
      required: true
    },
    {
      name: 'so_tien',
      description: 'Số xu muốn chuyển',
      type: 4, // INTEGER
      required: true
    }
  ]
},
{
    name: 'chaydua',
    description: 'Tham gia chạy đua cùng các VDV sau',
    options: [
        {
            name: 'vandongvien',
            description: 'Chọn người bạn tin tưởng để đặt cược',
            type: 3, // STRING
            required: true,
            choices: [
                { name: 'NamVuiVe', value: 'NamVuiVe' },
                { name: 'Tày Tay To', value: 'Tày Tay To' },
                { name: 'Hải Sao Hoả', value: 'Hải Sao Hoả' },
                { name: 'ZomSimp', value: 'ZomSimp' },
                { name: 'Yêu Chị Vú To', value: 'Yêu Chị Vú To' },
                { name: 'Food(Phuc)', value: 'Food(Phuc)' },
                { name: 'Furry', value: 'Furry' }
            ]
        },
        {
            name: 'cuoc',
            description: 'Số tiền đặt cược',
            type: 4, // INTEGER
            required: true
        }
    ]
},
];


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Đang đăng ký lệnh mới...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Đăng ký thành công! Nhấn Ctrl + R tại Discord để cập nhật.');
  } catch (error) {
    console.error(error);
  }
})();