import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Spinr" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors touch-target flex items-center justify-center px-4"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-[hsl(var(--primary))] text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity touch-target flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-[hsl(354,70%,54%)] via-[hsl(354,70%,48%)] to-[hsl(354,80%,38%)] text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Now Training Drivers
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Spinr Driver<br />Training Academy
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              Complete your training courses, pass your quizzes, and get certified to drive with Saskatchewan&apos;s own rideshare platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-[hsl(354,70%,54%)] font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-lg hover:shadow-xl touch-target flex items-center justify-center text-base"
              >
                Start Training →
              </Link>
              <Link
                href="/login"
                className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all touch-target flex items-center justify-center text-base"
              >
                Already have an account?
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24 bg-[hsl(var(--secondary))]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                { step: '1', title: 'Sign Up', desc: 'Create your account with your Gmail and set a secure password.' },
                { step: '2', title: 'Learn', desc: 'Go through text-based training modules at your own pace on any device.' },
                { step: '3', title: 'Get Certified', desc: 'Pass the quizzes and receive your verifiable training certificate.' },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-[hsl(var(--primary))] text-white rounded-xl flex items-center justify-center font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Start Driving?</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8 text-base sm:text-lg">
              Complete your training and hit the road. Your certificate is verified by insurance and city authorities.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-[hsl(var(--primary))] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg touch-target text-base"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Spinr" width={80} height={27} className="h-7 w-auto" />
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Driver Training</span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">© 2026 Spinr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
