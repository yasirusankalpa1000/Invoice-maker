import React, { useState } from 'react';
import {
  Globe2,
  ArrowRightLeft,
  Briefcase,
  Building2,
  ExternalLink,
  ShieldCheck,
  Star,
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
} from 'lucide-react';
import { Language } from '../utils/i18n';

interface GlobalBusinessHubProps {
  lang: Language;
}

type CategoryTab = 'cross_border' | 'freelancer' | 'sri_lanka';

interface PartnerDeal {
  id: string;
  name: string;
  category: CategoryTab;
  tagline: string;
  description: string;
  badge: string;
  badgeColor: string;
  rating: number;
  corridors: string;
  highlights: string[];
  link: string;
  ctaText: string;
}

const PARTNER_DEALS: PartnerDeal[] = [
  // 1. Worldwide Cross-Border (Country-to-Country)
  {
    id: 'wise',
    name: 'Wise (TransferWise)',
    category: 'cross_border',
    tagline: 'Lowest Cost Multi-Currency Money Transfers (160+ Countries)',
    description:
      'Transfer money between US, UK, Europe, Australia, Canada, and Asia with real mid-market exchange rates and zero hidden fees. Hold 40+ currencies with local account details (IBAN, Sort Code, Routing).',
    badge: '★ Best Exchange Rate',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rating: 4.9,
    corridors: 'US ⇄ UK ⇄ EU ⇄ Canada ⇄ Australia ⇄ Asia (160+ Countries)',
    highlights: ['Mid-Market Exchange Rate', 'Multi-currency IBANs', 'Up to 6x cheaper than old banks'],
    link: 'https://wise.com',
    ctaText: 'Open Free Wise Account →',
  },
  {
    id: 'revolut',
    name: 'Revolut Business',
    category: 'cross_border',
    tagline: 'Global Business Accounts & International Multi-Currency Cards',
    description:
      'Send and receive international transfers in 25+ currencies. Issue company physical & virtual debit cards and automate cross-border expenses with zero exchange markup during business hours.',
    badge: 'Best for Global Startups',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    rating: 4.8,
    corridors: 'UK ⇄ EU ⇄ US ⇄ Global Multi-Currency',
    highlights: ['25+ Currencies in One App', 'Multi-user Corporate Cards', 'Seamless Accounting Sync'],
    link: 'https://revolut.com/business',
    ctaText: 'Explore Revolut Business →',
  },
  {
    id: 'ofx',
    name: 'OFX Global Money Transfer',
    category: 'cross_border',
    tagline: '$0 Fee Large International Business Transfers',
    description:
      'Engineered for businesses and high-value transfers ($2,000+). 24/7 dedicated currency brokers and competitive fixed exchange rates across 50+ currencies.',
    badge: 'Zero Fees on $2,000+',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    rating: 4.7,
    corridors: 'Worldwide Corporate Transfers & Large Foreign Exchange',
    highlights: ['24/7 Personal Phone Support', 'Forward Contracts & Limit Orders', 'Fast Wire Settlement'],
    link: 'https://www.ofx.com',
    ctaText: 'Get OFX Business Rate →',
  },
  {
    id: 'remitly',
    name: 'Remitly Global',
    category: 'cross_border',
    tagline: 'Fast, Guaranteed Worldwide Remittance & Cross-Border Delivery',
    description:
      'Reliable international transfers with delivery promises. Direct to bank accounts, mobile wallets, or cash pickup in 170+ destinations.',
    badge: 'Express Delivery',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    rating: 4.7,
    corridors: 'North America / Europe ⇄ Asia / Latin America / Africa',
    highlights: ['Real-Time Transfer Tracker', 'Express Minutes Delivery', 'Money-Back Guarantee'],
    link: 'https://www.remitly.com',
    ctaText: 'Send with Remitly →',
  },

  // 2. Freelancers & Global Client Payouts
  {
    id: 'payoneer',
    name: 'Payoneer',
    category: 'freelancer',
    tagline: 'Get Paid by US, UK, EU Clients & Marketplaces',
    description:
      'Receive client credit cards, ACH, and wire transfers like a local US/EU bank. Works seamlessly with Upwork, Fiverr, Airbnb, Amazon, and direct B2B invoices.',
    badge: 'Top Pick for Freelancers',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    rating: 4.8,
    corridors: '190+ Countries · Direct Payouts from US/EU/UK/CA/JP Clients',
    highlights: ['Local US/EU/UK Bank Details', 'Withdraw to Local Banks Anywhere', 'Mastercard Available'],
    link: 'https://www.payoneer.com',
    ctaText: 'Sign Up & Get $25 Bonus →',
  },
  {
    id: 'paypal',
    name: 'PayPal Business',
    category: 'freelancer',
    tagline: 'Worldwide Online Checkout & Credit Card Processing',
    description:
      'Accept credit cards, debit cards, and PayPal from over 200 markets in 25 currencies. Trusted by over 400 million active consumers globally.',
    badge: 'Global Trust Standard',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    rating: 4.6,
    corridors: '200+ Countries & Territories Worldwide',
    highlights: ['Universal Consumer Trust', 'Instant Invoicing Tools', 'Buyer & Seller Protection'],
    link: 'https://www.paypal.com/business',
    ctaText: 'Create Business Account →',
  },
  {
    id: 'stripe_atlas',
    name: 'Stripe Atlas',
    category: 'freelancer',
    tagline: 'Incorporate a US Delaware Company from Anywhere',
    description:
      'Form a US company, obtain an IRS EIN tax number, open a US business bank account, and access global Stripe payments from 140+ countries in just days.',
    badge: 'Global Company Formation',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    rating: 4.9,
    corridors: 'Global Founders ⇄ US Business & Stripe Integration',
    highlights: ['Delaware C-Corp / LLC', 'US Bank Account & Tax ID', '5,000+ Founders Funded'],
    link: 'https://stripe.com/atlas',
    ctaText: 'Launch with Stripe Atlas →',
  },

  // 3. Sri Lanka & Inward Remittances
  {
    id: 'commercial_flash',
    name: 'Commercial Bank Flash & Export Remittance',
    category: 'sri_lanka',
    tagline: 'Special Inward Remittance Accounts for IT & Export Earners',
    description:
      'Zero tax on foreign currency IT/BPO service exports. Receive inward remittances directly into Commercial Bank PFC / RFC / LKR accounts with preferential exchange rates.',
    badge: 'Sri Lanka #1 Bank',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    rating: 4.8,
    corridors: 'Global Inward Remittance ⇄ Sri Lanka Direct Settlement',
    highlights: ['Zero Tax on IT Service Exports', 'Preferential FX Conversion', 'Instant Mobile Banking'],
    link: 'https://www.combank.lk',
    ctaText: 'Commercial Bank Portal →',
  },
  {
    id: 'payhere',
    name: 'PayHere Sri Lanka',
    category: 'sri_lanka',
    tagline: 'Sri Lanka’s Central Bank Approved Payment Gateway',
    description:
      'Accept Visa, MasterCard, Amex, LankaQR, Frimi, Genie, and mobile wallets. Multi-currency checkout in LKR, USD, GBP, EUR, AUD with daily settlements.',
    badge: 'CBSL Approved Gateway',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    rating: 4.7,
    corridors: 'Sri Lankan Merchants ⇄ Global Cards & Local LankaQR',
    highlights: ['LankaQR & Local Wallets', 'USD/LKR Multi-currency', 'Automated Daily Settlements'],
    link: 'https://www.payhere.lk',
    ctaText: 'Register Merchant Account →',
  },
];

export const GlobalBusinessHub: React.FC<GlobalBusinessHubProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('cross_border');

  const filteredDeals = PARTNER_DEALS.filter((d) => d.category === activeTab);

  return (
    <section className="no-print my-8 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <Globe2 className="h-4 w-4" />
            <span className="uppercase tracking-wider">
              {lang === 'si'
                ? 'ජාත්‍යන්තර මුදල් හුවමාරු සහ ව්‍යාපාර බැංකු සේවා'
                : 'Global Cross-Border Money Transfers & Business Banking'}
            </span>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.2 text-[10px] text-teal-300 border border-teal-500/20">
              Verified Partners
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {lang === 'si'
              ? 'රටින් රටට සහ ලංකාවට මුදල් ගෙන්වා ගැනීමට අඩුම ගාස්තු සහිත ක්‍රම'
              : 'Best Low-Fee Cross-Border Transfers & Freelance Payouts'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {lang === 'si'
              ? 'අමෙරිකාව, යුරෝපය, එංගලන්තය ඇතුළු රටවල් අතර සහ ලංකාව අතර මුදල් මාරු කිරීමට සහ Clients ලාගෙන් සල්ලි ලබාගැනීමට ලෝකයේ ප්‍රමුඛතම සේවාවන්.'
              : 'Save on international wire markups. Send & receive money globally across 160+ countries with mid-market rates and multi-currency business accounts.'}
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('cross_border')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'cross_border'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>{lang === 'si' ? 'රටින් රටට (Country-to-Country)' : 'Global Cross-Border'}</span>
          </button>
          <button
            onClick={() => setActiveTab('freelancer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'freelancer'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>{lang === 'si' ? 'Freelancers & Payouts' : 'Freelancer Payouts'}</span>
          </button>
          <button
            onClick={() => setActiveTab('sri_lanka')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sri_lanka'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{lang === 'si' ? 'ශ්‍රී ලංකා (Sri Lanka & Remittance)' : 'Sri Lanka & Banks'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Deals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredDeals.map((deal) => (
          <div
            key={deal.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4 hover:border-slate-700 hover:bg-slate-900/60 transition-all group"
          >
            <div>
              {/* Top Meta */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${deal.badgeColor}`}
                >
                  {deal.badge}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{deal.rating}</span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h3 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                {deal.name}
              </h3>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5 line-clamp-1">
                {deal.tagline}
              </p>

              {/* Supported Corridors */}
              <div className="mt-2.5 rounded-lg bg-slate-900/80 px-2.5 py-1.5 border border-slate-800/80 text-[10px] text-teal-300 font-mono">
                {deal.corridors}
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                {deal.description}
              </p>

              {/* Key Feature Bullets */}
              <div className="mt-3 space-y-1">
                {deal.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outbound Link CTA */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <a
                href={deal.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-slate-850 hover:bg-emerald-500 hover:text-slate-950 px-3 py-2 text-xs font-bold text-slate-200 border border-slate-750 transition-all cursor-pointer shadow-sm group-hover:border-emerald-500/50"
              >
                <span>{deal.ctaText}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Disclosure Footnote */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Verified cross-border financial services. Transparent rates & banking licenses.</span>
        </div>
        <p>Affiliate partner recommendation · QuickInvoice Pro remains 100% free.</p>
      </div>
    </section>
  );
};
