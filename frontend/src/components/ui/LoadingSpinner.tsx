export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full min-h-[200px]">
      <div className="relative size-14 mb-5">
        <div className="absolute inset-0 rounded-full border-[5px] border-slate-200 dark:border-white/10 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px] text-primary">restaurant</span>
        </div>
      </div>
      <p className="text-[15px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 animate-pulse">Cargando...</p>
    </div>
  );
}
