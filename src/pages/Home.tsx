import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck, LockKeyhole, LogOut, MessageCircleMore, MoreHorizontal, Paperclip, Phone, Plus, Search, Smile, UsersRound, Video } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
const logo = '/favicon.png';

const features = [
  {
    icon: MessageCircleMore,
    title: 'Trò chuyện tức thì',
    description: 'Gửi tin nhắn, ảnh, tệp và biểu cảm ngay khi ý tưởng vừa xuất hiện.',
  },
  {
    icon: UsersRound,
    title: 'Không gian cho nhóm',
    description: 'Tạo nhóm, kênh văn bản hoặc kênh thoại để mọi cuộc trao đổi luôn đúng chỗ.',
  },
  {
    icon: Video,
    title: 'Gọi khi cần',
    description: 'Chuyển từ tin nhắn sang cuộc gọi thoại hoặc video mà không làm gián đoạn nhịp làm việc.',
  },
  {
    icon: LockKeyhole,
    title: 'Riêng tư, chủ động',
    description: 'Quản lý lời mời, tin nhắn chờ và các cuộc trò chuyện theo cách của bạn.',
  },
];

export default function Home() {
  return (
    <main className="relative h-full min-h-screen overflow-y-auto overflow-x-hidden bg-[#f7f8fc] text-slate-900 dark:bg-discord-black dark:text-white">
      <div className="absolute inset-x-0 top-0 h-[42rem] bg-gradient-to-br from-indigo-100 via-white to-violet-100 dark:from-indigo-950/70 dark:via-discord-black dark:to-violet-950/50" />
      <div className="absolute -top-36 left-[12%] h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/15" />
      <div className="absolute top-36 right-[8%] h-72 w-72 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/10" />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-5 sm:px-8">
        <header className="home-reveal flex items-center justify-between py-5 sm:py-7">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Trang chủ NexTalk">
            <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover drop-shadow-md border border-gray-200/50 dark:border-zinc-700/50" />
            <span className="text-[1.7rem] font-extrabold tracking-[-0.045em]" aria-hidden="true">
              <span className="text-slate-950 dark:text-white">Nex</span>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Talk</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/70 dark:text-discord-text dark:hover:bg-white/10 sm:block"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Bắt đầu
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 pb-20 pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:pb-28 lg:pt-20">
          <div className="home-reveal home-delay-1 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200">
              <Bell className="h-4 w-4" />
              Kết nối theo cách tự nhiên hơn
            </div>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Mọi cuộc trò chuyện,
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"> một nơi để tiếp tục.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-discord-muted sm:text-lg">
              NexTalk giúp bạn nhắn tin, cộng tác theo nhóm và gặp nhau qua cuộc gọi — nhanh, rõ ràng và luôn trong nhịp của bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Tạo tài khoản miễn phí <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-200 bg-white/70 px-5 py-3.5 font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-discord-text dark:hover:bg-zinc-800"
              >
                Tôi đã có tài khoản
              </Link>
            </div>
            <div className="mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex shrink-0 -space-x-2" aria-hidden="true">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-sky-400 to-indigo-500 text-[10px] font-bold text-white dark:border-discord-black">W</div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[10px] font-bold text-white dark:border-discord-black">M</div>
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[10px] font-bold text-white dark:border-discord-black">
                  N
                  <span className="home-status-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-discord-black" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Web và mobile luôn đồng bộ</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-discord-muted">Một tài khoản, tiếp tục cuộc trò chuyện ở bất cứ đâu.</p>
              </div>
            </div>
          </div>

          {/* Hero Illustration: Web + Mobile mockups */}
          <div className="home-reveal home-delay-2 relative mx-auto grid w-full max-w-2xl grid-cols-1 items-end gap-5 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-4">
            {/* Glow background */}
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-indigo-500/25 to-violet-500/20 blur-2xl" />

            {/* Web App Mockup */}
            <div className="home-mockup-float relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-2 shadow-2xl shadow-indigo-950/15 backdrop-blur dark:border-zinc-700/70 dark:bg-discord-mid/95 sm:col-start-2 sm:row-start-1">
              <div className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-[#f8f9fc] text-left shadow-inner dark:border-zinc-700 dark:bg-discord-dark">
                <div className="grid h-[325px] grid-cols-[28px_105px_1fr] sm:h-[360px] sm:grid-cols-[32px_118px_1fr] lg:grid-cols-[36px_132px_1fr]">
                  <aside className="flex flex-col items-center border-r border-slate-200 bg-slate-100 py-3 dark:border-zinc-700 dark:bg-discord-black">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-[9px] font-bold text-white sm:h-6 sm:w-6">N</div>
                    <div className="mt-5 h-5 w-5 rounded-full bg-slate-300 dark:bg-zinc-700" />
                    <div className="mt-3 h-5 w-5 rounded-full border-2 border-slate-400 dark:border-zinc-500" />
                    <div className="mt-auto flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300"><LogOut className="h-3 w-3" /></div>
                  </aside>
                  <aside className="border-r border-slate-200 bg-white dark:border-zinc-700 dark:bg-discord-mid">
                    <div className="flex h-11 items-center justify-between border-b border-slate-200 px-2.5 dark:border-zinc-700">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white sm:text-xs">Tin nhắn <span className="text-emerald-500">●</span></p>
                      <Plus className="h-3.5 w-3.5 rounded-full bg-slate-100 p-0.5 text-slate-500 dark:bg-zinc-800" />
                    </div>
                    <div className="mx-2 mt-2 flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-slate-400 dark:bg-zinc-800"><Search className="h-3 w-3" /><span className="truncate text-[8px] sm:text-[9px]">Tìm người, nhóm...</span></div>
                    <div className="mx-2 mt-2 grid grid-cols-2 rounded-lg bg-slate-100 p-0.5 text-center text-[8px] font-medium dark:bg-zinc-800"><span className="rounded-md bg-white py-1 text-indigo-600 shadow-sm dark:bg-zinc-700">Trò chuyện</span><span className="py-1 text-slate-400">Chờ</span></div>
                    <div className="mt-3 bg-indigo-50 px-2 py-2 dark:bg-indigo-500/10">
                      <div className="flex gap-1.5"><div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div className="min-w-0"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-white sm:text-[10px]">Trương Chi Bảo</p><p className="mt-0.5 truncate text-[8px] text-slate-400">Bạn: Mình xem rồi</p></div></div>
                    </div>
                    <div className="px-2 py-2.5"><div className="flex gap-1.5"><div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" /><div className="min-w-0"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-white sm:text-[10px]">ABCV1</p><p className="mt-0.5 truncate text-[8px] text-slate-400"># Chung · Hôm qua</p></div></div></div>
                    <div className="px-2 py-1"><div className="flex gap-1.5 pl-2"><div className="min-w-0"><p className="truncate text-[8px] text-indigo-500 font-medium"># Học Tập</p></div></div></div>
                    <div className="px-2 py-1"><div className="flex gap-1.5 pl-2"><div className="min-w-0"><p className="truncate text-[8px] text-indigo-500 font-medium"># Chơi game</p></div></div></div>
                  </aside>
                  <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#f7f8fb] dark:bg-discord-dark">
                    <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-zinc-700 dark:bg-discord-mid">
                      <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div><p className="text-[10px] font-bold text-slate-900 dark:text-white">ABCV1 › #Chung</p><p className="text-[8px] text-slate-400">3 thành viên</p></div></div>
                      <div className="flex gap-2 text-slate-500"><Phone className="h-3.5 w-3.5" /><Video className="h-3.5 w-3.5" /><MoreHorizontal className="h-3.5 w-3.5" /></div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden p-3 sm:p-4">
                      <div className="mb-3 self-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[8px] text-slate-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">Hôm nay, 10:19</div>
                      <div className="flex items-end gap-1.5"><div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-[6px] font-bold text-white">N</div><div><div className="rounded-e-xl rounded-es-xl bg-white px-2.5 py-2 text-[10px] text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-white max-w-[140px] sm:max-w-[180px]"><span className="font-semibold text-indigo-600">@NexTalk AI</span> Vấn đề N+1 query xảy ra khi...</div><p className="mt-1 text-[8px] text-slate-400">10:29</p></div></div>
                      <div className="mt-2 flex items-end gap-1.5"><div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div><div className="rounded-e-xl rounded-es-xl bg-white px-2.5 py-2 text-[10px] text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-white">Hỏi toàn máy câu xịn thế 😂</div></div></div>
                      <div className="mt-2 flex items-end justify-end gap-1.5"><div className="text-right"><div className="rounded-s-xl rounded-ee-xl bg-indigo-600 px-2.5 py-2 text-[10px] text-white shadow-sm">:)))</div><div className="mt-1 flex justify-end gap-0.5 text-[8px] text-slate-400"><span>10:35</span><CheckCheck className="h-3 w-3 text-indigo-500" /></div></div></div>
                    </div>
                    <div className="m-2 shrink-0 rounded-xl border border-slate-200 bg-white p-2 dark:border-zinc-700 dark:bg-discord-mid">
                      <div className="flex gap-2 border-b border-slate-100 pb-1.5 text-slate-500 dark:border-zinc-700"><Smile className="h-3 w-3" /><Paperclip className="h-3 w-3" /><span className="text-[9px]">@</span><MoreHorizontal className="h-3 w-3" /></div>
                      <div className="pt-1.5 text-[9px] text-slate-400">Nhập tin nhắn...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Phone Mockup – displayed beside the web app */}
            <div className="home-mockup-float-delayed relative mx-auto w-[152px] sm:col-start-1 sm:row-start-1 sm:w-full">
              {/* Phone frame */}
              <div className="relative overflow-hidden rounded-[26px] border-[4px] border-slate-900 bg-slate-900 p-[2px] shadow-2xl shadow-indigo-950/30 ring-1 ring-white/20 dark:border-zinc-700">
                {/* Screen */}
                <div className="overflow-hidden rounded-[20px] bg-[#f3f5fb] text-left dark:bg-[#171827]">
                  {/* Status bar */}
                  <div className="relative flex h-5 items-center justify-between px-2.5 pt-0.5">
                    <span className="text-[6px] font-semibold text-slate-700 dark:text-white">16:50</span>
                    <div className="absolute left-1/2 top-1 h-2.5 w-9 -translate-x-1/2 rounded-full bg-slate-950" />
                    <div className="flex items-center gap-0.5">
                      <div className="flex gap-px items-end"><div className="w-[2px] h-[4px] bg-slate-600 dark:bg-white rounded-sm" /><div className="w-[2px] h-[5px] bg-slate-600 dark:bg-white rounded-sm" /><div className="w-[2px] h-[3px] bg-slate-400 dark:bg-slate-400 rounded-sm" /></div>
                      <div className="w-[8px] h-[5px] rounded-sm border border-slate-600 dark:border-white relative"><div className="absolute inset-[1px] rounded-[1px] bg-slate-600 dark:bg-white w-[60%]" /></div>
                    </div>
                  </div>
                  {/* Header */}
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-1.5">
                    <p className="text-[9px] font-bold text-slate-900 dark:text-white">Tin nhắn <span className="text-[7px] text-emerald-500">●</span></p>
                    <div className="flex gap-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center"><Plus className="w-2 h-2 text-indigo-600 dark:text-indigo-300" /></div>
                    </div>
                  </div>
                  {/* Search bar */}
                  <div className="mx-2 mb-1.5 flex items-center gap-1 rounded-lg border border-slate-200/70 bg-white px-1.5 py-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
                    <Search className="h-2 w-2 text-slate-400" />
                    <span className="text-[6px] text-slate-400">Tìm người, nhóm...</span>
                  </div>
                  {/* Section label */}
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[5.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Trò chuyện</span>
                    <span className="text-[5.5px] text-indigo-500 font-medium">Phân loại ▾</span>
                  </div>
                  {/* Conversation items */}
                  <div className="mx-1.5 mb-1 flex items-center gap-1.5 rounded-lg bg-indigo-100/70 px-1.5 py-1.5 dark:bg-indigo-500/15">
                    <div className="relative shrink-0"><div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div className="absolute -bottom-px -right-px w-2 h-2 rounded-full bg-emerald-400 border border-white" /></div>
                    <div className="min-w-0 flex-1"><p className="text-[6.5px] font-bold text-slate-900 dark:text-white truncate">Trương Chi Bảo</p><p className="text-[5.5px] text-slate-400 truncate">???</p></div>
                    <span className="text-[5px] text-slate-400 shrink-0">16:00</span>
                  </div>
                  <div className="mx-1.5 mb-1 flex items-center gap-1.5 px-1.5 py-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 shrink-0" />
                    <div className="min-w-0 flex-1"><p className="text-[6.5px] font-bold text-slate-900 dark:text-white truncate">ABCV1</p><p className="text-[5.5px] text-slate-400 truncate">Trương Chi Bảo: :)))</p></div>
                    <span className="text-[5px] text-slate-400 shrink-0">Hôm qua</span>
                  </div>
                  <div className="mx-4 mb-1 space-y-1 border-l-2 border-indigo-300/50 pl-2 dark:border-indigo-500/30">
                    {['# Chung','# Học Tập','# Chơi game'].map(ch => (
                      <div key={ch} className="flex items-center justify-between"><span className="text-[5.5px] text-indigo-600 dark:text-indigo-300 font-medium">{ch}</span></div>
                    ))}
                  </div>
                  <div className="mx-1.5 flex items-center gap-1.5 px-1.5 py-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shrink-0 flex items-center justify-center"><span className="text-[6px] text-white">☁</span></div>
                    <div className="min-w-0 flex-1"><p className="text-[6.5px] font-bold text-slate-900 dark:text-white truncate">Cloud của tôi</p><p className="text-[5.5px] text-slate-400 truncate">Bạn: https://github...</p></div>
                  </div>
                  {/* Bottom navigation belongs to the phone screen so its background and corners stay continuous. */}
                  <div className="border-t border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex justify-around px-1 pb-1 pt-1.5">
                      <div className="flex flex-col items-center gap-0.5"><MessageCircleMore className="h-3 w-3 text-indigo-600" /><span className="text-[5px] font-semibold text-indigo-600">Tin nhắn</span></div>
                      <div className="relative flex flex-col items-center gap-0.5"><UsersRound className="h-3 w-3 text-slate-400" /><span className="text-[5px] text-slate-400">Bạn bè</span><div className="absolute -right-0.5 -top-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-rose-500"><span className="text-[4px] font-bold text-white">2</span></div></div>
                      <div className="flex flex-col items-center gap-0.5"><Phone className="h-3 w-3 text-slate-400" /><span className="text-[5px] text-slate-400">Cá nhân</span></div>
                    </div>
                    <div className="flex h-2 items-center justify-center">
                      <div className="h-[2px] w-10 rounded-full bg-slate-900/80 dark:bg-white/80" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Platform badge */}
              <div className="mt-2.5 flex justify-center">
                <div className="flex items-center gap-1 rounded-full bg-white/80 dark:bg-zinc-800/80 px-2 py-0.5 shadow-sm border border-slate-200/60 dark:border-zinc-700/60 backdrop-blur">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[6px] font-semibold text-slate-600 dark:text-slate-300">Mobile App</span>
                </div>
              </div>
            </div>

            {/* Web badge */}
            <div className="absolute -right-2 -top-3 z-10 sm:-right-3 sm:-top-4">
              <div className="flex items-center gap-1 rounded-full bg-white/80 dark:bg-zinc-800/80 px-2.5 py-1 shadow-sm border border-slate-200/60 dark:border-zinc-700/60 backdrop-blur">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span className="text-[7px] font-semibold text-slate-600 dark:text-slate-300">Web App</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="home-reveal home-delay-2 mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Mọi thứ trong một nhịp</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Được thiết kế cho những cuộc trò chuyện thật.</h2>
            <p className="mt-3 leading-7 text-slate-600 dark:text-discord-muted">Từ một tin nhắn nhanh đến buổi họp nhóm, NexTalk giữ người, nội dung và hành động ở cùng một nơi.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className={`home-reveal home-delay-${index + 1} home-feature-card rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-discord-mid/70`}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-discord-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-200/80 py-6 text-center text-sm text-slate-500 dark:border-zinc-800 dark:text-discord-muted">
          © {new Date().getFullYear()} NexTalk. Nói chuyện, cùng tiến về phía trước.
        </footer>
      </div>
    </main>
  );
}
