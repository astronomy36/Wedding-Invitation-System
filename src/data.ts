import type { AppSettings, Guest, WeddingInfo } from "./types";

export const defaultWeddingInfo: WeddingInfo = {
  groomName: "XXX",
  brideName: "XXX",
  weddingDate: "XXXX年XX月XX日",
  weddingTime: "晚上 18:18",
  venue: "XXXX酒店 XXXX厅",
  address: "XXXX市XXXX区XXXX路XX号",
  contactPhone: "13800000000",
};

export const defaultSideOptions = [
  { id: "groom", label: "男方" },
  { id: "bride", label: "女方" },
  { id: "both", label: "双方" },
  { id: "other", label: "其他" },
];

export const defaultCategoryOptions = [
  { id: "relative", label: "亲戚" },
  { id: "friend", label: "朋友" },
  { id: "colleague", label: "同事" },
  { id: "parent_friend", label: "父母朋友" },
  { id: "other", label: "其他" },
];

export const defaultSettings: AppSettings = {
  weddingInfo: defaultWeddingInfo,
  sideOptions: defaultSideOptions,
  categoryOptions: defaultCategoryOptions,
};

export const seedGuests: Guest[] = [
  {
    id: "guest-zhang",
    groupName: "张三一家",
    mainName: "张三",
    guestNames: ["张三", "李四"],
    side: "groom",
    category: "relative",
    relationNote: "大舅一家",
    phone: "13812345678",
    wechat: "",
    expectedCount: 3,
    confirmedCount: 2,
    inviteStatus: "invited",
    attendanceStatus: "confirmed",
    needHotel: "unknown",
    needPickup: "no",
    tableNo: "",
    note: "带小朋友，座位尽量靠边。",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "guest-li",
    groupName: "李老师一家",
    mainName: "李老师",
    guestNames: ["李老师"],
    side: "bride",
    category: "friend",
    relationNote: "高中班主任",
    phone: "",
    wechat: "li-teacher",
    expectedCount: 2,
    confirmedCount: 0,
    inviteStatus: "not_invited",
    attendanceStatus: "unconfirmed",
    needHotel: "unknown",
    needPickup: "unknown",
    tableNo: "",
    note: "",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "guest-wang",
    groupName: "王同事",
    mainName: "王同事",
    guestNames: ["王同事"],
    side: "both",
    category: "colleague",
    relationNote: "科室同事",
    phone: "",
    wechat: "",
    expectedCount: 1,
    confirmedCount: 0,
    inviteStatus: "invited",
    attendanceStatus: "pending",
    needHotel: "no",
    needPickup: "no",
    tableNo: "",
    note: "",
    createdAt: "2026-01-03T10:00:00.000Z",
    updatedAt: "2026-01-03T10:00:00.000Z",
  },
];

export const inviteStatusLabels = {
  not_invited: "未邀请",
  invited: "已邀请",
} as const;

export const attendanceStatusLabels = {
  unconfirmed: "未确认",
  confirmed: "确认到场",
  declined: "不到场",
  pending: "待定",
} as const;

export const needStatusLabels = {
  yes: "是",
  no: "否",
  unknown: "未确定",
} as const;
