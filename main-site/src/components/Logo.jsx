import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="grid h-9 w-[7rem] place-items-center rounded-xl text-white font-extrabold">
        {/* <img src='/main_logo.png' /> */}
        <img src='/img/QRSERVE_MAIN_LOGO.png' />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-900">QRserv</div>
        <div className="text-[11px] text-slate-500">QR Ordering for restaurants</div>
      </div>
    </Link>
  )
}
