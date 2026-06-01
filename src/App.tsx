import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import {
  CalendarHeart,
  Check,
  ChevronLeft,
  Copy,
  Download,
  Edit3,
  Filter,
  Home,
  Image,
  ListFilter,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import {
  attendanceStatusLabels,
  inviteStatusLabels,
  needStatusLabels,
} from "./data";
import { generateInvitationText, getGuestSalutation } from "./invitation";
import { loadGuests, loadSettings, makeGuestId, makeOptionId, saveGuests, saveSettings } from "./storage";
import type {
  AppSettings,
  AttendanceStatus,
  Guest,
  GuestCategory,
  GuestFormData,
  GuestSide,
  InviteStatus,
  LabelOption,
  NeedStatus,
  WeddingInfo,
} from "./types";

type View = "dashboard" | "list" | "form" | "detail" | "preview" | "settings";
type FilterState = {
  side: "all" | GuestSide;
  category: "all" | GuestCategory;
  inviteStatus: "all" | InviteStatus;
  attendanceStatus: "all" | AttendanceStatus;
  needHotel: "all" | NeedStatus;
  needPickup: "all" | NeedStatus;
};

const emptyFilters: FilterState = {
  side: "all",
  category: "all",
  inviteStatus: "all",
  attendanceStatus: "all",
  needHotel: "all",
  needPickup: "all",
};

const emptyForm: GuestFormData = {
  groupName: "",
  mainName: "",
  guestNames: [],
  guestNamesInput: "",
  side: "groom",
  category: "relative",
  relationNote: "",
  phone: "",
  wechat: "",
  expectedCount: 1,
  confirmedCount: 0,
  inviteStatus: "not_invited",
  attendanceStatus: "unconfirmed",
  needHotel: "unknown",
  needPickup: "unknown",
  tableNo: "",
  note: "",
};

function App() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestFormData>(emptyForm);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState("");
  const [invitationText, setInvitationText] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const inviteCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuests(loadGuests());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveGuests(guests);
      saveSettings(settings);
    }
  }, [guests, hydrated, settings]);

  const sideLabelMap = useMemo(() => makeLabelMap(settings.sideOptions), [settings.sideOptions]);
  const categoryLabelMap = useMemo(() => makeLabelMap(settings.categoryOptions), [settings.categoryOptions]);

  const selectedGuest = useMemo(
    () => guests.find((guest) => guest.id === selectedId) ?? null,
    [guests, selectedId],
  );

  const stats = useMemo(() => {
    return guests.reduce(
      (acc, guest) => {
        acc.totalFamilies += 1;
        acc.expected += Number(guest.expectedCount || 0);
        acc.confirmed += Number(guest.confirmedCount || 0);
        if (guest.attendanceStatus === "unconfirmed") acc.unconfirmed += Number(guest.expectedCount || 0);
        if (guest.inviteStatus === "invited") acc.invited += Number(guest.expectedCount || 0);
        if (guest.inviteStatus === "not_invited") acc.notInvited += Number(guest.expectedCount || 0);
        return acc;
      },
      { totalFamilies: 0, expected: 0, confirmed: 0, unconfirmed: 0, invited: 0, notInvited: 0 },
    );
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return guests.filter((guest) => {
      const searchable = [
        guest.groupName,
        guest.mainName,
        guest.guestNames.join(","),
        guest.relationNote,
        guest.phone,
        guest.wechat,
        guest.tableNo,
        guest.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesKeyword = !keyword || searchable.includes(keyword);
      const matchesFilters =
        (filters.side === "all" || guest.side === filters.side) &&
        (filters.category === "all" || guest.category === filters.category) &&
        (filters.inviteStatus === "all" || guest.inviteStatus === filters.inviteStatus) &&
        (filters.attendanceStatus === "all" || guest.attendanceStatus === filters.attendanceStatus) &&
        (filters.needHotel === "all" || guest.needHotel === filters.needHotel) &&
        (filters.needPickup === "all" || guest.needPickup === filters.needPickup);

      return matchesKeyword && matchesFilters;
    });
  }, [filters, guests, query]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function goToDetail(id: string) {
    setSelectedId(id);
    setInvitationText("");
    setGeneratedImage("");
    setView("detail");
  }

  function startCreate() {
    setEditingId(null);
    setForm(makeEmptyGuestForm(settings));
    setView("form");
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id);
    setForm({
      ...guest,
      guestNamesInput: guest.guestNames.join("，"),
      confirmedCount: guest.confirmedCount ?? 0,
      needHotel: guest.needHotel ?? "unknown",
      needPickup: guest.needPickup ?? "unknown",
    });
    setView("form");
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const now = new Date().toISOString();
    const guestNames = form.guestNamesInput
      .split(/[,，]/)
      .map((name) => name.trim())
      .filter(Boolean);

    const payload: Guest = {
      id: editingId ?? makeGuestId(),
      groupName: form.groupName.trim(),
      mainName: form.mainName.trim(),
      guestNames,
      side: form.side,
      category: form.category,
      relationNote: form.relationNote?.trim(),
      phone: form.phone?.trim(),
      wechat: form.wechat?.trim(),
      expectedCount: Math.max(0, Number(form.expectedCount || 0)),
      confirmedCount: Math.max(0, Number(form.confirmedCount || 0)),
      inviteStatus: form.inviteStatus,
      attendanceStatus: form.attendanceStatus,
      needHotel: form.needHotel,
      needPickup: form.needPickup,
      tableNo: form.tableNo?.trim(),
      note: form.note?.trim(),
      createdAt: editingId ? guests.find((guest) => guest.id === editingId)?.createdAt ?? now : now,
      updatedAt: now,
    };

    if (!payload.groupName || !payload.mainName) {
      notify("请填写家庭/分组名称和主联系人");
      return;
    }

    setGuests((current) =>
      editingId ? current.map((guest) => (guest.id === editingId ? payload : guest)) : [payload, ...current],
    );
    setSelectedId(payload.id);
    setView("detail");
    notify(editingId ? "来宾信息已更新" : "来宾已新增");
  }

  function deleteGuest(id: string) {
    const target = guests.find((guest) => guest.id === id);
    if (!target) return;
    if (!window.confirm(`确定删除「${target.groupName}」吗？`)) return;

    setGuests((current) => current.filter((guest) => guest.id !== id));
    setSelectedId(null);
    setView("list");
    notify("已删除来宾");
  }

  function patchGuest(id: string, patch: Partial<Guest>, message: string) {
    setGuests((current) =>
      current.map((guest) =>
        guest.id === id ? { ...guest, ...patch, updatedAt: new Date().toISOString() } : guest,
      ),
    );
    notify(message);
  }

  async function copyInvitationText(guest: Guest) {
    const text = generateInvitationText(guest, settings.weddingInfo);
    setInvitationText(text);

    try {
      await navigator.clipboard.writeText(text);
      notify("请柬文案已复制");
    } catch {
      notify("已生成文案，可手动复制");
    }
  }

  async function renderInvitationImage() {
    if (!inviteCardRef.current) return;

    // html2canvas 直接把预览卡片导出为图片，后续可替换为小程序 canvas 绘制。
    const canvas = await html2canvas(inviteCardRef.current, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
    });
    const image = canvas.toDataURL("image/png");
    setGeneratedImage(image);
    notify("请柬图片已生成");
  }

  function downloadImage() {
    if (!generatedImage || !selectedGuest) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `${selectedGuest.groupName}-婚礼请柬.png`;
    link.click();
  }

  return (
    <main className="app-shell">
      <section className="app-frame">
        <Header
          view={view}
          selectedGuest={selectedGuest}
          onBack={() => {
            if (view === "detail") setView("list");
            else if (view === "preview") setView("detail");
            else setView("dashboard");
          }}
          onCreate={startCreate}
        />

        <div className="screen">
          {view === "dashboard" && (
            <Dashboard
              stats={stats}
              guests={guests}
              weddingInfo={settings.weddingInfo}
              sideLabelMap={sideLabelMap}
              categoryLabelMap={categoryLabelMap}
              onOpenList={() => setView("list")}
              onCreate={startCreate}
              onOpenGuest={goToDetail}
            />
          )}

          {view === "list" && (
            <GuestList
              guests={filteredGuests}
              allCount={guests.length}
              query={query}
              filters={filters}
              showFilters={showFilters}
              stats={stats}
              sideOptions={settings.sideOptions}
              categoryOptions={settings.categoryOptions}
              sideLabelMap={sideLabelMap}
              categoryLabelMap={categoryLabelMap}
              onQueryChange={setQuery}
              onFilterChange={setFilters}
              onToggleFilters={() => setShowFilters((value) => !value)}
              onResetFilters={() => setFilters(emptyFilters)}
              onOpenGuest={goToDetail}
              onCreate={startCreate}
            />
          )}

          {view === "form" && (
            <GuestForm
              form={form}
              editing={Boolean(editingId)}
              sideOptions={withCurrentOption(settings.sideOptions, form.side)}
              categoryOptions={withCurrentOption(settings.categoryOptions, form.category)}
              onChange={setForm}
              onSubmit={submitForm}
              onCancel={() => (selectedGuest ? setView("detail") : setView("list"))}
            />
          )}

          {view === "detail" && selectedGuest && (
            <GuestDetail
              guest={selectedGuest}
              invitationText={invitationText}
              sideLabelMap={sideLabelMap}
              categoryLabelMap={categoryLabelMap}
              onEdit={() => startEdit(selectedGuest)}
              onDelete={() => deleteGuest(selectedGuest.id)}
              onPatch={(patch, message) => patchGuest(selectedGuest.id, patch, message)}
              onCopyText={() => copyInvitationText(selectedGuest)}
              onPreviewImage={() => {
                setGeneratedImage("");
                setView("preview");
              }}
            />
          )}

          {view === "preview" && selectedGuest && (
            <InvitationPreview
              guest={selectedGuest}
              image={generatedImage}
              weddingInfo={settings.weddingInfo}
              inviteCardRef={inviteCardRef}
              onRender={renderInvitationImage}
              onDownload={downloadImage}
            />
          )}

          {view === "settings" && (
            <SettingsPage settings={settings} onChange={setSettings} onNotify={notify} />
          )}
        </div>

        <BottomNav view={view} onView={setView} />
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

type HeaderProps = {
  view: View;
  selectedGuest: Guest | null;
  onBack: () => void;
  onCreate: () => void;
};

function Header({ view, selectedGuest, onBack, onCreate }: HeaderProps) {
  const titleMap: Record<View, string> = {
    dashboard: "婚礼来宾管理",
    list: "来宾列表",
    form: "来宾信息",
    detail: selectedGuest?.groupName ?? "来宾详情",
    preview: "请柬预览",
    settings: "系统设置",
  };

  return (
    <header className="topbar">
      {view === "dashboard" ? (
        <div className="brand-mark">
          <CalendarHeart size={20} />
        </div>
      ) : (
        <button className="icon-button" type="button" onClick={onBack} aria-label="返回">
          <ChevronLeft size={22} />
        </button>
      )}
      <div>
        <p className="eyebrow">Wedding RSVP</p>
        <h1>{titleMap[view]}</h1>
      </div>
      <button className="icon-button gold" type="button" onClick={onCreate} aria-label="新增来宾">
        <Plus size={21} />
      </button>
    </header>
  );
}

type DashboardProps = {
  stats: ReturnType<typeof createStatsShape>;
  guests: Guest[];
  weddingInfo: WeddingInfo;
  sideLabelMap: Record<string, string>;
  categoryLabelMap: Record<string, string>;
  onOpenList: () => void;
  onCreate: () => void;
  onOpenGuest: (id: string) => void;
};

function createStatsShape() {
  return { totalFamilies: 0, expected: 0, confirmed: 0, unconfirmed: 0, invited: 0, notInvited: 0 };
}

function Dashboard({
  stats,
  guests,
  weddingInfo,
  sideLabelMap,
  categoryLabelMap,
  onOpenList,
  onCreate,
  onOpenGuest,
}: DashboardProps) {
  const pendingGuests = guests.filter((guest) => guest.attendanceStatus === "unconfirmed").slice(0, 4);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">邀约进度</p>
          <h2>
            {weddingInfo.groomName} & {weddingInfo.brideName}
          </h2>
          <p>{weddingInfo.weddingDate} · {weddingInfo.venue}</p>
        </div>
        <button className="primary-button" type="button" onClick={onCreate}>
          <Plus size={18} />
          新增来宾
        </button>
      </section>

      <StatsGrid stats={stats} />

      <section className="section-block">
        <div className="section-heading">
          <h3>待确认</h3>
          <button className="text-button" type="button" onClick={onOpenList}>
            查看全部
          </button>
        </div>
        {pendingGuests.length ? (
          <div className="guest-card-list">
            {pendingGuests.map((guest) => (
              <GuestCard
                key={guest.id}
                guest={guest}
                sideLabelMap={sideLabelMap}
                categoryLabelMap={categoryLabelMap}
                onClick={() => onOpenGuest(guest.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="暂无待确认来宾" action="去来宾列表查看" onAction={onOpenList} />
        )}
      </section>
    </div>
  );
}

function StatsGrid({ stats }: { stats: ReturnType<typeof createStatsShape> }) {
  const items = [
    { label: "邀请家庭", value: stats.totalFamilies },
    { label: "预计人数", value: stats.expected },
    { label: "确认到场", value: stats.confirmed },
    { label: "未确认人数", value: stats.unconfirmed },
    { label: "已邀请人数", value: stats.invited },
    { label: "未邀请人数", value: stats.notInvited },
  ];

  return (
    <section className="stats-grid">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}

type GuestListProps = {
  guests: Guest[];
  allCount: number;
  query: string;
  filters: FilterState;
  showFilters: boolean;
  stats: ReturnType<typeof createStatsShape>;
  sideOptions: LabelOption[];
  categoryOptions: LabelOption[];
  sideLabelMap: Record<string, string>;
  categoryLabelMap: Record<string, string>;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: FilterState) => void;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  onOpenGuest: (id: string) => void;
  onCreate: () => void;
};

function GuestList({
  guests,
  allCount,
  query,
  filters,
  showFilters,
  stats,
  sideOptions,
  categoryOptions,
  sideLabelMap,
  categoryLabelMap,
  onQueryChange,
  onFilterChange,
  onToggleFilters,
  onResetFilters,
  onOpenGuest,
  onCreate,
}: GuestListProps) {
  return (
    <div className="page-stack">
      <StatsGrid stats={stats} />

      <section className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索姓名、关系、电话、桌号"
          />
        </label>
        <button className="icon-button" type="button" onClick={onToggleFilters} aria-label="筛选">
          <Filter size={19} />
        </button>
      </section>

      {showFilters && (
        <section className="filter-panel">
          <FilterSelect
            label="男方/女方"
            value={filters.side}
            options={[["all", "全部"], ...sideOptions.map((option) => [option.id, option.label] as [string, string])]}
            onChange={(value) => onFilterChange({ ...filters, side: value as FilterState["side"] })}
          />
          <FilterSelect
            label="关系分类"
            value={filters.category}
            options={[["all", "全部"], ...categoryOptions.map((option) => [option.id, option.label] as [string, string])]}
            onChange={(value) => onFilterChange({ ...filters, category: value as FilterState["category"] })}
          />
          <FilterSelect
            label="邀请状态"
            value={filters.inviteStatus}
            options={[["all", "全部"], ...Object.entries(inviteStatusLabels)]}
            onChange={(value) =>
              onFilterChange({ ...filters, inviteStatus: value as FilterState["inviteStatus"] })
            }
          />
          <FilterSelect
            label="到场状态"
            value={filters.attendanceStatus}
            options={[["all", "全部"], ...Object.entries(attendanceStatusLabels)]}
            onChange={(value) =>
              onFilterChange({ ...filters, attendanceStatus: value as FilterState["attendanceStatus"] })
            }
          />
          <FilterSelect
            label="住宿"
            value={filters.needHotel}
            options={[["all", "全部"], ...Object.entries(needStatusLabels)]}
            onChange={(value) => onFilterChange({ ...filters, needHotel: value as FilterState["needHotel"] })}
          />
          <FilterSelect
            label="接送"
            value={filters.needPickup}
            options={[["all", "全部"], ...Object.entries(needStatusLabels)]}
            onChange={(value) => onFilterChange({ ...filters, needPickup: value as FilterState["needPickup"] })}
          />
          <button className="ghost-button full" type="button" onClick={onResetFilters}>
            <X size={16} />
            清空筛选
          </button>
        </section>
      )}

      <div className="list-meta">
        <span>共 {allCount} 组来宾</span>
        <span>当前显示 {guests.length} 组</span>
      </div>

      {guests.length ? (
        <div className="guest-card-list">
          {guests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              sideLabelMap={sideLabelMap}
              categoryLabelMap={categoryLabelMap}
              onClick={() => onOpenGuest(guest.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="没有匹配的来宾" action="新增来宾" onAction={onCreate} />
      )}
    </div>
  );
}

function GuestCard({
  guest,
  sideLabelMap,
  categoryLabelMap,
  onClick,
}: {
  guest: Guest;
  sideLabelMap: Record<string, string>;
  categoryLabelMap: Record<string, string>;
  onClick: () => void;
}) {
  return (
    <button className="guest-card" type="button" onClick={onClick}>
      <div className="guest-card-main">
        <h3>{guest.groupName}</h3>
        <p>
          {getOptionLabel(sideLabelMap, guest.side)} · {getOptionLabel(categoryLabelMap, guest.category)}
          {guest.relationNote ? ` · ${guest.relationNote}` : ""}
        </p>
      </div>
      <div className="guest-card-side">
        <span className={`status-pill ${guest.attendanceStatus}`}>{attendanceStatusLabels[guest.attendanceStatus]}</span>
        <small>{guest.confirmedCount ?? 0}/{guest.expectedCount} 人</small>
      </div>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field compact">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

type GuestFormProps = {
  form: GuestFormData;
  editing: boolean;
  sideOptions: LabelOption[];
  categoryOptions: LabelOption[];
  onChange: (form: GuestFormData) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

function GuestForm({ form, editing, sideOptions, categoryOptions, onChange, onSubmit, onCancel }: GuestFormProps) {
  return (
    <form className="form-page" onSubmit={onSubmit}>
      <div className="form-grid">
        <TextField label="家庭/分组名称" value={form.groupName} required onChange={(groupName) => onChange({ ...form, groupName })} />
        <TextField label="主联系人姓名" value={form.mainName} required onChange={(mainName) => onChange({ ...form, mainName })} />
        <TextField
          label="具体姓名列表"
          value={form.guestNamesInput}
          placeholder="例如：张三，李四"
          onChange={(guestNamesInput) => onChange({ ...form, guestNamesInput })}
        />
        <label className="field">
          <span>所属方</span>
          <select value={form.side} onChange={(event) => onChange({ ...form, side: event.target.value as GuestSide })}>
            {sideOptions.map((option) => (
              <option value={option.id} key={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>关系分类</span>
          <select
            value={form.category}
            onChange={(event) => onChange({ ...form, category: event.target.value as GuestCategory })}
          >
            {categoryOptions.map((option) => (
              <option value={option.id} key={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <TextField label="关系备注" value={form.relationNote ?? ""} placeholder="例如：大学同学" onChange={(relationNote) => onChange({ ...form, relationNote })} />
        <TextField label="手机号" value={form.phone ?? ""} inputMode="tel" onChange={(phone) => onChange({ ...form, phone })} />
        <TextField label="微信号" value={form.wechat ?? ""} onChange={(wechat) => onChange({ ...form, wechat })} />
        <TextField
          label="预计人数"
          value={String(form.expectedCount)}
          type="number"
          min={0}
          onChange={(expectedCount) => onChange({ ...form, expectedCount: Number(expectedCount) })}
        />
        <TextField
          label="确认人数"
          value={String(form.confirmedCount ?? 0)}
          type="number"
          min={0}
          onChange={(confirmedCount) => onChange({ ...form, confirmedCount: Number(confirmedCount) })}
        />
        <label className="field">
          <span>邀请状态</span>
          <select
            value={form.inviteStatus}
            onChange={(event) => onChange({ ...form, inviteStatus: event.target.value as InviteStatus })}
          >
            {Object.entries(inviteStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>到场状态</span>
          <select
            value={form.attendanceStatus}
            onChange={(event) => onChange({ ...form, attendanceStatus: event.target.value as AttendanceStatus })}
          >
            {Object.entries(attendanceStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </label>
        <NeedField label="住宿需求" value={form.needHotel ?? "unknown"} onChange={(needHotel) => onChange({ ...form, needHotel })} />
        <NeedField label="接送需求" value={form.needPickup ?? "unknown"} onChange={(needPickup) => onChange({ ...form, needPickup })} />
        <TextField label="桌号" value={form.tableNo ?? ""} placeholder="后期分桌填写" onChange={(tableNo) => onChange({ ...form, tableNo })} />
        <label className="field wide">
          <span>备注</span>
          <textarea value={form.note ?? ""} rows={4} onChange={(event) => onChange({ ...form, note: event.target.value })} />
        </label>
      </div>

      <div className="sticky-actions">
        <button className="ghost-button" type="button" onClick={onCancel}>
          取消
        </button>
        <button className="primary-button" type="submit">
          <Save size={18} />
          {editing ? "保存修改" : "保存来宾"}
        </button>
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  inputMode,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        required={required}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NeedField({ label, value, onChange }: { label: string; value: NeedStatus; onChange: (value: NeedStatus) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as NeedStatus)}>
        {Object.entries(needStatusLabels).map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

type GuestDetailProps = {
  guest: Guest;
  invitationText: string;
  sideLabelMap: Record<string, string>;
  categoryLabelMap: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
  onPatch: (patch: Partial<Guest>, message: string) => void;
  onCopyText: () => void;
  onPreviewImage: () => void;
};

function GuestDetail({
  guest,
  invitationText,
  sideLabelMap,
  categoryLabelMap,
  onEdit,
  onDelete,
  onPatch,
  onCopyText,
  onPreviewImage,
}: GuestDetailProps) {
  const detailRows = [
    ["具体姓名", guest.guestNames.join("、") || "未填写"],
    ["所属分类", `${getOptionLabel(sideLabelMap, guest.side)} · ${getOptionLabel(categoryLabelMap, guest.category)}`],
    ["关系备注", guest.relationNote || "未填写"],
    ["联系方式", [guest.phone, guest.wechat ? `微信：${guest.wechat}` : ""].filter(Boolean).join(" / ") || "未填写"],
    ["预计/确认人数", `${guest.expectedCount} / ${guest.confirmedCount ?? 0}`],
    ["邀请状态", inviteStatusLabels[guest.inviteStatus]],
    ["到场状态", attendanceStatusLabels[guest.attendanceStatus]],
    ["住宿/接送", `${needStatusLabels[guest.needHotel ?? "unknown"]} / ${needStatusLabels[guest.needPickup ?? "unknown"]}`],
    ["桌号", guest.tableNo || "未分桌"],
    ["备注", guest.note || "无"],
  ];

  return (
    <div className="page-stack">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">Guest Detail</p>
          <h2>{guest.groupName}</h2>
          <p>{guest.mainName}</p>
        </div>
        <span className={`status-pill ${guest.attendanceStatus}`}>{attendanceStatusLabels[guest.attendanceStatus]}</span>
      </section>

      <section className="quick-actions">
        <button className="action-button" type="button" onClick={onEdit}>
          <Edit3 size={18} />
          编辑
        </button>
        <button className="action-button" type="button" onClick={() => onPatch({ inviteStatus: "invited" }, "已标记为已邀请")}>
          <Send size={18} />
          已邀请
        </button>
        <button
          className="action-button"
          type="button"
          onClick={() =>
            onPatch(
              { attendanceStatus: "confirmed", confirmedCount: guest.confirmedCount || guest.expectedCount },
              "已标记为确认到场",
            )
          }
        >
          <Check size={18} />
          确认
        </button>
        <button className="action-button" type="button" onClick={() => onPatch({ attendanceStatus: "declined", confirmedCount: 0 }, "已标记为不到场")}>
          <X size={18} />
          不到场
        </button>
      </section>

      <section className="detail-list">
        {detailRows.map(([label, value]) => (
          <div className="detail-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>

      <section className="invite-tools">
        <button className="primary-button full" type="button" onClick={onCopyText}>
          <Copy size={18} />
          生成并复制请柬文本
        </button>
        <button className="secondary-button full" type="button" onClick={onPreviewImage}>
          <Image size={18} />
          生成请柬图片
        </button>
        <button className="danger-button full" type="button" onClick={onDelete}>
          <Trash2 size={18} />
          删除来宾
        </button>
      </section>

      {invitationText && (
        <section className="text-preview">
          <h3>请柬文案</h3>
          <pre>{invitationText}</pre>
        </section>
      )}
    </div>
  );
}

type InvitationPreviewProps = {
  guest: Guest;
  image: string;
  weddingInfo: WeddingInfo;
  inviteCardRef: React.RefObject<HTMLDivElement>;
  onRender: () => void;
  onDownload: () => void;
};

function InvitationPreview({ guest, image, weddingInfo, inviteCardRef, onRender, onDownload }: InvitationPreviewProps) {
  return (
    <div className="page-stack">
      <div className="invite-preview-wrap">
        <div className="invite-card" ref={inviteCardRef}>
          <div className="corner-flower top-left" />
          <div className="corner-flower bottom-right" />
          <p className="invite-overline">Wedding Invitation</p>
          <h2>{getGuestSalutation(guest)}</h2>
          <p className="invite-copy">诚挚邀请您和家人共同见证我们的幸福时刻</p>
          <div className="couple-names">
            <span>{weddingInfo.groomName}</span>
            <small>&</small>
            <span>{weddingInfo.brideName}</span>
          </div>
          <div className="invite-info">
            <p>{weddingInfo.weddingDate}</p>
            <p>{weddingInfo.weddingTime}</p>
            <p>{weddingInfo.venue}</p>
            <p>{weddingInfo.address}</p>
          </div>
          <p className="invite-footer">期待您的到来</p>
        </div>
      </div>

      <div className="sticky-actions">
        <button className="primary-button" type="button" onClick={onRender}>
          <Image size={18} />
          生成图片
        </button>
        <button className="secondary-button" type="button" onClick={onDownload} disabled={!image}>
          <Download size={18} />
          下载图片
        </button>
      </div>

      {image && (
        <section className="image-result">
          <h3>生成结果</h3>
          <img src={image} alt={`${guest.groupName}的婚礼请柬`} />
        </section>
      )}
    </div>
  );
}

function SettingsPage({
  settings,
  onChange,
  onNotify,
}: {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onNotify: (message: string) => void;
}) {
  function updateWeddingInfo(field: keyof WeddingInfo, value: string) {
    onChange({
      ...settings,
      weddingInfo: {
        ...settings.weddingInfo,
        [field]: value,
      },
    });
  }

  return (
    <div className="page-stack">
      <section className="settings-section">
        <div className="section-heading">
          <h3>婚礼信息</h3>
          <span className="save-hint">自动保存</span>
        </div>
        <div className="form-grid settings-grid">
          <TextField label="新郎姓名" value={settings.weddingInfo.groomName} onChange={(value) => updateWeddingInfo("groomName", value)} />
          <TextField label="新娘姓名" value={settings.weddingInfo.brideName} onChange={(value) => updateWeddingInfo("brideName", value)} />
          <TextField label="婚礼日期" value={settings.weddingInfo.weddingDate} placeholder="例如：2026年10月1日" onChange={(value) => updateWeddingInfo("weddingDate", value)} />
          <TextField label="婚礼时间" value={settings.weddingInfo.weddingTime} placeholder="例如：晚上 18:18" onChange={(value) => updateWeddingInfo("weddingTime", value)} />
          <TextField label="婚礼酒店/宴会厅" value={settings.weddingInfo.venue} onChange={(value) => updateWeddingInfo("venue", value)} />
          <TextField label="联系人电话" value={settings.weddingInfo.contactPhone} inputMode="tel" onChange={(value) => updateWeddingInfo("contactPhone", value)} />
          <label className="field wide">
            <span>酒店地址</span>
            <textarea
              value={settings.weddingInfo.address}
              rows={3}
              onChange={(event) => updateWeddingInfo("address", event.target.value)}
            />
          </label>
        </div>
      </section>

      <LabelEditor
        title="所属方标签"
        options={settings.sideOptions}
        onChange={(sideOptions) => onChange({ ...settings, sideOptions })}
        onNotify={onNotify}
      />

      <LabelEditor
        title="关系分类标签"
        options={settings.categoryOptions}
        onChange={(categoryOptions) => onChange({ ...settings, categoryOptions })}
        onNotify={onNotify}
      />
    </div>
  );
}

function LabelEditor({
  title,
  options,
  onChange,
  onNotify,
}: {
  title: string;
  options: LabelOption[];
  onChange: (options: LabelOption[]) => void;
  onNotify: (message: string) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  function addOption() {
    const label = newLabel.trim();
    if (!label) {
      onNotify("请输入标签名称");
      return;
    }

    const baseId = makeOptionId(label);
    const ids = new Set(options.map((option) => option.id));
    let id = baseId;
    let index = 2;
    while (ids.has(id)) {
      id = `${baseId}_${index}`;
      index += 1;
    }

    onChange([...options, { id, label }]);
    setNewLabel("");
    onNotify("标签已新增");
  }

  function updateOption(id: string, label: string) {
    onChange(options.map((option) => (option.id === id ? { ...option, label } : option)));
  }

  function deleteOption(id: string) {
    if (options.length <= 1) {
      onNotify("至少保留一个标签");
      return;
    }
    onChange(options.filter((option) => option.id !== id));
    onNotify("标签已删除");
  }

  return (
    <section className="settings-section">
      <div className="section-heading">
        <h3>{title}</h3>
        <span className="save-hint">{options.length} 个</span>
      </div>

      <div className="label-editor-list">
        {options.map((option) => (
          <div className="label-editor-row" key={option.id}>
            <input
              value={option.label}
              aria-label={`${title}-${option.id}`}
              onChange={(event) => updateOption(option.id, event.target.value)}
            />
            <button className="icon-button danger-icon" type="button" onClick={() => deleteOption(option.id)} aria-label="删除标签">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      <div className="label-add-row">
        <input value={newLabel} placeholder="新增标签名称" onChange={(event) => setNewLabel(event.target.value)} />
        <button className="primary-button" type="button" onClick={addOption}>
          <Plus size={18} />
          添加
        </button>
      </div>
    </section>
  );
}

function BottomNav({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <nav className="bottom-nav">
      <button className={view === "dashboard" ? "active" : ""} type="button" onClick={() => onView("dashboard")}>
        <Home size={20} />
        首页
      </button>
      <button className={view === "list" ? "active" : ""} type="button" onClick={() => onView("list")}>
        <ListFilter size={20} />
        来宾
      </button>
      <button className={view === "settings" ? "active" : ""} type="button" onClick={() => onView("settings")}>
        <Settings size={20} />
        设置
      </button>
    </nav>
  );
}

function makeLabelMap(options: LabelOption[]) {
  return Object.fromEntries(options.map((option) => [option.id, option.label]));
}

function getOptionLabel(labelMap: Record<string, string>, value: string) {
  return labelMap[value] || value || "未设置";
}

function withCurrentOption(options: LabelOption[], current: string) {
  if (!current || options.some((option) => option.id === current)) {
    return options;
  }
  return [...options, { id: current, label: current }];
}

function makeEmptyGuestForm(settings: AppSettings): GuestFormData {
  return {
    ...emptyForm,
    side: settings.sideOptions[0]?.id ?? "other",
    category: settings.categoryOptions[0]?.id ?? "other",
  };
}

function EmptyState({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <section className="empty-state">
      <CalendarHeart size={34} />
      <h3>{title}</h3>
      <button className="secondary-button" type="button" onClick={onAction}>
        {action}
      </button>
    </section>
  );
}

export default App;
