// Pictogramme Dasolabs (le « d » : anneau + point central + queue).
// Monochrome via currentColor — passe la couleur par className (ex: text-white).
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Dasolabs">
      {/* queue (ascendante, en haut à droite) */}
      <path d="M63 41 C 86 31 101 18 95 6 C 88 23 78 41 65 56 Z" fill="currentColor" />
      {/* anneau (donut, trou transparent) */}
      <circle cx="53" cy="71" r="29" stroke="currentColor" strokeWidth="20" />
      {/* point central */}
      <circle cx="53" cy="71" r="8.5" fill="currentColor" />
    </svg>
  );
}

// Logo complet : pictogramme + mot « dasolabs » en bas-de-casse.
export function LogoLockup({ className, mark = 'text-white', word = 'text-white' }: { className?: string; mark?: string; word?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Logo className={`h-7 w-7 ${mark}`} />
      <span className={`font-display text-xl font-bold lowercase tracking-tight ${word}`}>dasolabs</span>
    </div>
  );
}
