import Link from 'next/link';

export default function SessionExpiredPage() {
  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 text-center font-display">
      <div className="size-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[48px]">timer_off</span>
      </div>
      
      <h1 className="text-3xl font-black mb-4 tracking-tight">Sesión Expirada</h1>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        Tu tiempo en la mesa ha finalizado o la cuenta ha sido cerrada por el anfitrión. Por favor, escanea el código QR nuevamente para unirte.
      </p>
      
      <Link 
        href="/join"
        className="bg-primary hover:bg-primary/95 text-white font-bold h-14 px-8 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
      >
        Volver a intentar
      </Link>
    </div>
  );
}
