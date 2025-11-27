// Organization categories for dropdown selection
export const ORGANIZATION_CATEGORIES = [
  "Church group",
  "Muslim Group", 
  "Business organization",
  "Schools",
  "Hospitals",
  "Government Organization",
  "Charity Organization",
  "Professional Organizations",
  "Orphanage Homes",
  "Advocacy Group",
  "Town Union",
  "Outreach group",
  "Volunteer Group",
  "Others"
] as const;

export type OrganizationCategory = typeof ORGANIZATION_CATEGORIES[number];
