import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 text-center font-display">
      <div className="size-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[48px]">search_off</span>
      </div>
      
      <h1 className="text-4xl font-black mb-4 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold mb-4">¿Te perdiste?</h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        No pudimos encontrar la página que buscas. Puede que el enlace esté roto o la página ya no exista.
      </p>
      
      <Link 
        href="/menu"
        className="bg-primary hover:bg-primary/95 text-white font-bold h-14 px-8 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
      >
        Volver al Menú
      </Link>
    </div>
  );
}
