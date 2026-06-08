import React from 'react'

export default function Auth() {
  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Tài khoản</p>
          <h2 className="mt-2 text-lg font-semibold">Người dùng khách</h2>
          <p className="mt-1 text-base text-slate-600">Đăng nhập để lưu tiến trình, kết quả kiểm tra và lịch sử luyện tập.</p>
        </div>
        <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">Đăng nhập</button>
      </div>
    </section>
  )
}
