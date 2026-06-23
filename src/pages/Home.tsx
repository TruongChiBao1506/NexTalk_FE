import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck, LockKeyhole, LogOut, MessageCircleMore, MoreHorizontal, Paperclip, Phone, Plus, Search, Smile, UsersRound, Video } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import logo from '../assets/logo_notext.png';

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
        <header className="flex items-center justify-between py-5 sm:py-7">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight" aria-label="NexTalk home">
            <img src={logo} alt="" className="h-10 w-10 rounded-xl shadow-sm" />
            <span className="text-xl">NexTalk</span>
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

        <section className="grid flex-1 items-center gap-12 pb-16 pt-12 lg:grid-cols-[1fr_0.9fr] lg:pb-24 lg:pt-20">
          <div className="max-w-2xl">
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
            <p className="mt-4 text-sm text-slate-500 dark:text-discord-muted">Sẵn sàng cho những cuộc trao đổi nhỏ lẫn các dự án lớn.</p>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-indigo-500/25 to-violet-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 p-2 shadow-2xl shadow-indigo-950/15 backdrop-blur dark:border-zinc-700/70 dark:bg-discord-mid/95">
              <div className="overflow-hidden rounded-[1.3rem] border border-slate-200 bg-[#f8f9fc] text-left shadow-inner dark:border-zinc-700 dark:bg-discord-dark">
                <div className="grid h-[325px] grid-cols-[28px_115px_1fr] sm:h-[360px] sm:grid-cols-[38px_145px_1fr]">
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
                      <div className="flex gap-1.5"><div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div className="min-w-0"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-white sm:text-[10px]">Minh Anh</p><p className="mt-0.5 truncate text-[8px] text-slate-400">Bạn: Mình xem rồi</p></div></div>
                    </div>
                    <div className="px-2 py-2.5"><div className="flex gap-1.5"><div className="h-6 w-6 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500" /><div className="min-w-0"><p className="truncate text-[9px] font-bold text-slate-800 dark:text-white sm:text-[10px]">Nhóm dự án</p><p className="mt-0.5 truncate text-[8px] text-slate-400">3 thành viên</p></div></div></div>
                  </aside>

                  <div className="flex min-w-0 flex-col bg-[#f7f8fb] dark:bg-discord-dark">
                    <div className="flex h-11 items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-zinc-700 dark:bg-discord-mid">
                      <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div><p className="text-[10px] font-bold text-slate-900 dark:text-white">Minh Anh</p><p className="text-[8px] text-slate-400">Đang hoạt động</p></div></div>
                      <div className="flex gap-2 text-slate-500"><Phone className="h-3.5 w-3.5" /><Video className="h-3.5 w-3.5" /><MoreHorizontal className="h-3.5 w-3.5" /></div>
                    </div>
                    <div className="flex flex-1 flex-col justify-end p-3 sm:p-4">
                      <div className="mb-4 self-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[8px] text-slate-500 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">Hôm nay, 10:24</div>
                      <div className="flex items-end gap-1.5"><div className="h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-rose-400" /><div><div className="rounded-e-xl rounded-es-xl bg-white px-2.5 py-2 text-[10px] text-slate-700 shadow-sm dark:bg-zinc-800 dark:text-white">Mình vừa hoàn thành phần giao diện.</div><p className="mt-1 text-[8px] text-slate-400">10:24</p></div></div>
                      <div className="mt-3 flex items-end justify-end gap-1.5"><div className="text-right"><div className="rounded-s-xl rounded-ee-xl bg-indigo-600 px-2.5 py-2 text-[10px] text-white shadow-sm">Tuyệt, mình xem ngay nhé!</div><div className="mt-1 flex justify-end gap-0.5 text-[8px] text-slate-400"><span>10:25</span><CheckCheck className="h-3 w-3 text-indigo-500" /></div></div></div>
                    </div>
                    <div className="m-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-zinc-700 dark:bg-discord-mid">
                      <div className="flex gap-2 border-b border-slate-100 pb-1.5 text-slate-500 dark:border-zinc-700"><Smile className="h-3 w-3" /><Paperclip className="h-3 w-3" /><span className="text-[9px]">@</span><MoreHorizontal className="h-3 w-3" /></div>
                      <div className="pt-1.5 text-[9px] text-slate-400">Nhập tin nhắn tới @Minh Anh</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-14 sm:pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-discord-mid/70">
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
