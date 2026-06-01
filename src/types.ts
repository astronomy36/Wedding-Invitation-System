export type GuestSide = string;
export type GuestCategory = string;
export type InviteStatus = "not_invited" | "invited";
export type AttendanceStatus = "unconfirmed" | "confirmed" | "declined" | "pending";
export type NeedStatus = "yes" | "no" | "unknown";

export type Guest = {
  id: string;
  groupName: string;
  mainName: string;
  guestNames: string[];
  side: GuestSide;
  category: GuestCategory;
  relationNote?: string;
  phone?: string;
  wechat?: string;
  expectedCount: number;
  confirmedCount?: number;
  inviteStatus: InviteStatus;
  attendanceStatus: AttendanceStatus;
  needHotel?: NeedStatus;
  needPickup?: NeedStatus;
  tableNo?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type WeddingInfo = {
  groomName: string;
  brideName: string;
  weddingDate: string;
  weddingTime: string;
  venue: string;
  address: string;
  contactPhone: string;
};

export type GuestFormData = Omit<Guest, "id" | "createdAt" | "updatedAt"> & {
  guestNamesInput: string;
};

export type LabelOption = {
  id: string;
  label: string;
};

export type AppSettings = {
  weddingInfo: WeddingInfo;
  sideOptions: LabelOption[];
  categoryOptions: LabelOption[];
};
