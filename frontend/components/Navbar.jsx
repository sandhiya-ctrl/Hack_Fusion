export default function Navbar({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="w-2 h-2 rounded-full bg-normal inline-block"></span>
        ML Engine Connected
      </div>
    </div>
  );
}
