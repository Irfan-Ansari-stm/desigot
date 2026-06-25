import Link from "next/link";

const sections = [
  { title: "Marketplace", links: [{ label: "Browse Assets", href: "/browse?listing_type=asset" }, { label: "Browse Services", href: "/browse?listing_type=service" }, { label: "Featured", href: "/browse?is_featured=true" }, { label: "Trending", href: "/browse?sort=popular" }, { label: "Collections", href: "/collections" }] },
  { title: "Sellers", links: [{ label: "Start Selling", href: "/auth/register?role=seller" }, { label: "Pricing Plans", href: "/seller-dashboard/settings#plan" }, { label: "Seller Dashboard", href: "/seller-dashboard" }, { label: "Seller Guidelines", href: "#" }] },
  { title: "Company", links: [{ label: "About Us", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }, { label: "Press", href: "#" }, { label: "Enterprise", href: "#" }] },
  { title: "Support", links: [{ label: "Help Center", href: "#" }, { label: "Dispute Policy", href: "#" }, { label: "License Guide", href: "#" }, { label: "Contact Us", href: "#" }, { label: "Status", href: "#" }] },
];

export function Footer() {
  return (
    <footer className="bg-brand text-white/80 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-black text-xl text-white">Desigot</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              The global UI/UX design marketplace. Connect with elite designers worldwide.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {["Twitter", "LinkedIn", "GitHub"].map((s) => (
                <a key={s} href="#" className="text-xs text-white/40 hover:text-white/80 transition-colors">{s}</a>
              ))}
            </div>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-white/90 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© 2025 Desigot Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
