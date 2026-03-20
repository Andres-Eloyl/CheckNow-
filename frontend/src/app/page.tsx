export default function Home() {
  return (
    <div className="bg-background-dark font-[Inter] text-white min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
      <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-4xl">qr_code_scanner</span>
      </div>
      <h1 className="text-3xl font-black tracking-tight mb-2">CheckNow!</h1>
      <p className="text-text-muted text-lg max-w-sm">
        Por favor, escanea el código QR ubicado en tu mesa para acceder al menú y realizar tu pedido.
      </p>
    </div>
  );
}
