// utils/environmentInfo.ts
// Utility to collect browser, device, city, timezone, and OS info for security checks

export interface EnvironmentInfo {
  browser: string;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  city?: string;
  country?: string;
  timezone?: string;
  ip?: string;
  os?: string;
  userAgent?: string;
}

export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  // Basic browser info
  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";

  // Device type detection
  let deviceType: EnvironmentInfo["deviceType"] = "unknown";
  if (/Mobi|Android/i.test(userAgent)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(userAgent)) deviceType = "tablet";
  else deviceType = "desktop";

  // OS detection
  let os = "Unknown";
  if (/Windows/i.test(userAgent)) os = "Windows";
  else if (/Macintosh/i.test(userAgent)) os = "Mac";
  else if (/Linux/i.test(userAgent)) os = "Linux";
  else if (/Android/i.test(userAgent)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";

  // Get city, country, timezone, ip from IP API
  try {
    const response = await fetch("https://ipapi.co/json");
    if (!response.ok) throw new Error("IP info fetch failed");
    const data = await response.json();
    return {
      browser,
      deviceType,
      city: data.city,
      country: data.country_name,
      timezone: data.timezone,
      ip: data.ip,
      os,
      userAgent,
    };
  } catch {
    return {
      browser,
      deviceType,
      os,
      userAgent,
    };
  }
}
