import type { Guest, WeddingInfo } from "./types";

export function getGuestSalutation(guest: Guest) {
  return guest.groupName || guest.mainName || guest.guestNames[0] || "亲爱的来宾";
}

export function generateInvitationText(guest: Guest, weddingInfo: WeddingInfo) {
  const salutation = getGuestSalutation(guest);

  return `亲爱的${salutation}：

诚挚邀请您参加我们的人生重要时刻。

我们将于${weddingInfo.weddingDate}${weddingInfo.weddingTime}在${weddingInfo.venue}举行婚礼，期待您和家人的到来，一同见证我们的幸福时刻。

地点：${weddingInfo.address}

新郎：${weddingInfo.groomName}
新娘：${weddingInfo.brideName}

联系人电话：${weddingInfo.contactPhone}

期待您的到来！`;
}
