/* eslint-disable @typescript-eslint/no-explicit-any */
// // utils/environmentInfo.ts
// // Utility to collect browser, device, city, timezone, and OS info for security checks

// export interface EnvironmentInfo {
//   browser: string;
//   deviceType: "mobile" | "tablet" | "desktop" | "unknown";
//   city?: string;
//   country?: string;
//   timezone?: string;
//   ip?: string;
//   os?: string;
//   userAgent?: string;
// }

// export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
//   // Basic browser info
//   const userAgent = navigator.userAgent;
//   let browser = "Unknown";
//   if (userAgent.includes("Chrome")) browser = "Chrome";
//   else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
//     browser = "Safari";
//   else if (userAgent.includes("Firefox")) browser = "Firefox";
//   else if (userAgent.includes("Edge")) browser = "Edge";
//   else if (userAgent.includes("Opera")) browser = "Opera";

//   // Device type detection
//   let deviceType: EnvironmentInfo["deviceType"] = "unknown";
//   if (/Mobi|Android/i.test(userAgent)) deviceType = "mobile";
//   else if (/Tablet|iPad/i.test(userAgent)) deviceType = "tablet";
//   else deviceType = "desktop";

//   // OS detection
//   let os = "Unknown";
//   if (/Windows/i.test(userAgent)) os = "Windows";
//   else if (/Macintosh/i.test(userAgent)) os = "Mac";
//   else if (/Linux/i.test(userAgent)) os = "Linux";
//   else if (/Android/i.test(userAgent)) os = "Android";
//   else if (/iPhone|iPad|iPod/i.test(userAgent)) os = "iOS";

//   // Get city, country, timezone, ip from IP API
//   try {
//     const response = await fetch("https://ipapi.co/json");
//     if (!response.ok) throw new Error("IP info fetch failed");
//     const data = await response.json();
//     return {
//       browser,
//       deviceType,
//       city: data.city,
//       country: data.country_name,
//       timezone: data.timezone,
//       ip: data.ip,
//       os,
//       userAgent,
//     };
//   } catch {
//     return {
//       browser,
//       deviceType,
//       os,
//       userAgent,
//     };
//   }
// }


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

// Cache the environment info to avoid repeated API calls
let cachedEnvInfo: EnvironmentInfo | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastFetchTime = 0;

export async function getEnvironmentInfo(): Promise<EnvironmentInfo> {
  // Return cached data if it's still valid
  if (cachedEnvInfo && Date.now() - lastFetchTime < CACHE_DURATION) {
    console.log("Using cached environment info");
    return cachedEnvInfo;
  }

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

  // Get timezone from browser (always available)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Base environment info (always available)
  const baseInfo: EnvironmentInfo = {
    browser,
    deviceType,
    os,
    userAgent,
    timezone,
  };

  // Try to get IP geolocation info with multiple fallbacks
  const ipApis = [
    {
      url: "https://ipapi.co/json/",
      parse: (data: any) => ({
        city: data.city,
        country: data.country_name,
        timezone: data.timezone,
        ip: data.ip,
      }),
    },
    {
      url: "https://ip-api.com/json/",
      parse: (data: any) => ({
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        ip: data.query,
      }),
    },
    {
      url: "https://ipwho.is/",
      parse: (data: any) => ({
        city: data.city,
        country: data.country,
        timezone: data.timezone?.id,
        ip: data.ip,
      }),
    },
  ];

  // Try each API in order until one succeeds
  for (const api of ipApis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(api.url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`${api.url} returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Check if we got rate limited
      if (data.error || data.reason) {
        console.warn(`${api.url} error:`, data.error || data.reason);
        continue;
      }

      const locationData = api.parse(data);
      
      const envInfo = {
        ...baseInfo,
        ...locationData,
      };

      // Cache the successful result
      cachedEnvInfo = envInfo;
      lastFetchTime = Date.now();

      console.log("Environment info fetched successfully from", api.url);
      return envInfo;
    } catch (error) {
      console.warn(`Failed to fetch from ${api.url}:`, error);
      // Continue to next API
    }
  }

  // If all APIs fail, return base info with browser timezone
  console.warn("All IP geolocation APIs failed, using basic info only");
  cachedEnvInfo = baseInfo;
  lastFetchTime = Date.now();
  
  return baseInfo;
}

// Optional: Function to clear cache if needed
export function clearEnvironmentCache() {
  cachedEnvInfo = null;
  lastFetchTime = 0;
}