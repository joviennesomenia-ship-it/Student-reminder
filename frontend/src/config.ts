// Single place for site-wide settings (footer, timezone, branding).
export const siteConfig = {
  siteName: 'Class Reminders',
  teacherName: 'Your Name',
  classSection: 'Grade 10 - Section A',
  contactEmail: 'teacher@example.com',
  contactPhone: '',
  timezone: 'Asia/Manila',
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000',
} as const;
