export type ProjectType = "react-vite" | "next" | "pwa" | "electron" | "capacitor" | "static" | "unknown";

export interface ProjectDetection {
  type: ProjectType;
  label: string;
  recommendedTarget: string;
  recommendedTargetLabel: string;
  reason: string;
  etaSeconds: number;
}

export function detectProjectType(files: Record<string, string>): ProjectDetection {
  const paths = Object.keys(files);
  const has = (p: string) => paths.some((x) => x.endsWith(p));
  const hasDir = (d: string) => paths.some((x) => x.startsWith(d));

  let pkg: any = {};
  if (files["package.json"]) {
    try {
      pkg = JSON.parse(files["package.json"]);
    } catch {
      /* noop */
    }
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) } as Record<string, string>;

  if (deps.electron || has("electron.cjs") || has("electron-builder.json")) {
    return {
      type: "electron",
      label: "Electron Desktop",
      recommendedTarget: "windows",
      recommendedTargetLabel: "Windows .exe",
      reason: "Electron dependency detected — package as a desktop binary.",
      etaSeconds: 30,
    };
  }

  if (deps["@capacitor/core"] || has("capacitor.config.ts") || has("capacitor.config.json")) {
    return {
      type: "capacitor",
      label: "Capacitor Mobile",
      recommendedTarget: "android",
      recommendedTargetLabel: "Android APK",
      reason: "Capacitor configuration detected — export a mobile bundle.",
      etaSeconds: 25,
    };
  }

  if (deps.next || hasDir("pages/") || hasDir("app/")) {
    return {
      type: "next",
      label: "Next.js",
      recommendedTarget: "web",
      recommendedTargetLabel: "Web Deploy (Vercel)",
      reason: "Next.js detected — Vercel deploy is the fastest path.",
      etaSeconds: 20,
    };
  }

  if (has("manifest.webmanifest") || has("manifest.json") || has("sw.js") || has("service-worker.js")) {
    return {
      type: "pwa",
      label: "PWA",
      recommendedTarget: "pwa",
      recommendedTargetLabel: "PWA Package",
      reason: "Service worker / manifest detected — ship as an installable PWA.",
      etaSeconds: 15,
    };
  }

  if (deps.react && (deps.vite || has("vite.config.ts") || has("vite.config.js"))) {
    return {
      type: "react-vite",
      label: "React + Vite",
      recommendedTarget: "pwa",
      recommendedTargetLabel: "PWA Package",
      reason: "React + Vite app — PWA export gives offline-ready, installable output with no extra config.",
      etaSeconds: 15,
    };
  }

  if (has("index.html")) {
    return {
      type: "static",
      label: "Static HTML",
      recommendedTarget: "zip",
      recommendedTargetLabel: "ZIP Download",
      reason: "Plain static site — ZIP and host anywhere.",
      etaSeconds: 5,
    };
  }

  return {
    type: "unknown",
    label: "Unknown",
    recommendedTarget: "zip",
    recommendedTargetLabel: "ZIP Download",
    reason: "Couldn't auto-detect framework — ZIP is the safest fallback.",
    etaSeconds: 5,
  };
}
