
const HERO = "/a1d2e498-ff1f-4fcb-9e10-40b309b350e0.jpg";
interface AuthAsideProps {
  eyebrow: string;
  headline: string;
  body: string;
}
export function AuthAside({
  eyebrow,
  headline,
  body
}: AuthAsideProps) {
  return <aside className="relative hidden overflow-hidden bg-charcoal lg:block">
      <img src={HERO} alt="Block-printing stamps, indigo and terracotta pigments and undyed cotton on a dark table" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="relative flex h-full flex-col justify-between p-12">
        <p className="font-display text-xl font-semibold tracking-tight text-cream">{eyebrow}</p>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-[1.15] text-cream">{headline}</h2>
          <div className="mt-4 h-[3px] w-16 bg-clay" aria-hidden="true" />
          <p className="mt-5 text-[15px] leading-relaxed text-cream/75">{body}</p>
        </div>
        <ol className="flex flex-wrap gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-cream/55">
          {['Discover', 'Listen', 'Contribute', 'Enrich', 'Verify', 'Preserve'].map((step) => <li key={step} className="after:ml-3 after:content-['·'] last:after:content-['']">
              {step}
            </li>)}
        </ol>
      </div>
    </aside>;
}
