// Profile Options (Pick lists for member profiles)
export const PROFILE_OPTIONS = {
  sectors: ['AI/ML', 'Healthcare', 'Fintech', 'Climate', 'Enterprise Software', 'Consumer', 'Deep Tech', 'Crypto/Web3', 'Space', 'Real Estate', 'Other'],
  stages: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Late Stage', 'Secondaries'],
  geographies: ['US Only', 'US - West Coast', 'US - East Coast', 'Europe', 'Middle East', 'Africa', 'Asia', 'Latin America', 'Global'],
  themes: ['AI', 'B2B SaaS', 'Consumer', 'Marketplaces', 'Healthcare', 'Climate Tech', 'Fintech', 'Biotech', 'Hardware', 'Frontier Tech'],
  dealRoles: ['Learn / Observe', 'Evaluate Deals', 'Due Diligence', 'Help Founders', 'Source Deals', 'Just Watch'],
  vcLevels: [
    { value: 'new', label: 'New to VC', desc: 'Just getting started' },
    { value: 'some', label: 'Some Experience', desc: '1-5 investments or 1-3 years' },
    { value: 'experienced', label: 'Experienced', desc: '5+ investments or 3+ years' }
  ],
  learningGoals: ['VC Frameworks', 'Term Sheets', 'Portfolio Construction', 'Due Diligence', 'Founder Evaluation', 'Valuation', 'Secondary Markets', 'Board Participation', 'Fund Mechanics'],
  hopingToGet: ['Network with peers', 'Learn from experts', 'Access deals', 'Build VC skills', 'Find co-investors', 'Meet founders'],
  chatFormats: ['15 min call', '30 min call', 'Async only'],
  bestTimes: ['Weekday mornings', 'Weekday lunch', 'Weekday evenings', 'Weekends'],
  timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Istanbul', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Australia/Sydney', 'Other'],
  checkSizeBands: ['< $25k', '$25k - $50k', '$50k - $100k', '$100k+'],
  accreditationStatus: ['verified', 'pending', 'not_provided']
};
