interface HangingSignProps {
  icon: string;
  title: string;
  delay?: string;
  href?: string;
  onClick?: () => void;
}

export default function HangingSign({ icon, title, delay, href, onClick }: HangingSignProps) {
  const content = (
    <div className="pixel-box bg-primary border-primary-dark p-1 transition-transform group-hover:-translate-y-1 group-active:translate-y-1">
      <div className="border-2 border-dashed border-accent-gold/40 p-4 flex items-center justify-between bg-primary">
        <span className="material-symbols-outlined text-2xl text-background-light group-hover:text-accent-gold">{icon}</span>
        <span className="text-xl md:text-2xl text-background-light uppercase tracking-wider group-hover:text-accent-gold transition-colors drop-shadow-md">{title}</span>
        <span className="material-symbols-outlined text-2xl text-background-light opacity-0 group-hover:opacity-100">arrow_forward</span>
      </div>
      <div className="absolute top-0 left-0 w-3 h-3 bg-accent-gold border border-black"></div>
      <div className="absolute top-0 right-0 w-3 h-3 bg-accent-gold border border-black"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 bg-accent-gold border border-black"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-gold border border-black"></div>
    </div>
  );

  return (
    <>
      <div className="hanging-sign w-full px-4 mb-2" style={{ animationDelay: delay }}>
        {href ? (
          <a href={href} className="w-full group focus:outline-none block">
            {content}
          </a>
        ) : (
          <button onClick={onClick} className="w-full group focus:outline-none">
            {content}
          </button>
        )}
      </div>
      {/* Chain connector below, only if needed. For now we assume this component is used in a list where the parent or wrapper handles spacing chains. 
          Actually, the original had chains BETWEEN signs. Let's include the chain in a separate component or handle it in the parent loop.
      */}
    </>
  );
}
