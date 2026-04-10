const steps = [
  {
    number: '01',
    title: 'Add your papers',
    description: 'Search for papers and add them in one click. Ready to query in seconds.',
  },
  {
    number: '02',
    title: 'Ask anything',
    description: 'Ask anything in plain English. Get answers grounded in exact passages from your papers, with every claim sourced.',
  },
  {
    number: '03',
    title: 'Build your understanding',
    description: 'Save highlights, take notes, and revisit your chat history. Your research, organised.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-14">
          <h2 className="text-4xl font-serif font-semibold text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground text-lg">Three steps. No setup. No learning curve.</p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[1.75rem] top-3 bottom-3 w-px bg-border" />

          <div className="flex flex-col gap-12">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-8 items-start">
                <div className="shrink-0 w-14 flex justify-center relative">
                  <span className="text-5xl font-serif font-semibold text-primary leading-none bg-background px-1">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-1">
                  <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
