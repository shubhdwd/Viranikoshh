export const manifest = {
  screens: {
    scr_lwx5em: { name: "Sign in", route: "/login", position: { "x": 160, "y": 220 } },
    scr_g025y7: { name: "Create account", route: "/register", position: { "x": 1560, "y": 220 } },
    scr_o4s178: { name: "Home feed", route: "/home", position: { "x": 160, "y": 2200 } },
    scr_mk1mmm: { name: "Explore", route: "/explore", position: { "x": 1560, "y": 2200 } },
    scr_rhze6o: { name: "Search", route: "/search", position: { "x": 2960, "y": 2200 } },
    scr_ghw24c: { name: "Cultural record", route: "/post/r1", position: { "x": 160, "y": 4180 } },
    scr_vce1b0: { name: "Cultural map", route: "/map", position: { "x": 1560, "y": 4180 } },
    scr_331075: { name: "Contribute · Choose type", route: "/create", state: { "step": 0 }, position: { "x": 160, "y": 6160 } },
    scr_y24k4a: { name: "Contribute · Record or upload", route: "/create", state: { "step": 1 }, position: { "x": 1560, "y": 6160 } },
    scr_lx7b41: { name: "Contribute · Preview original", route: "/create", state: { "step": 2 }, position: { "x": 2960, "y": 6160 } },
    scr_n9n4pl: { name: "Contribute · Add details", route: "/create", state: { "step": 3 }, position: { "x": 4360, "y": 6160 } },
    scr_5dn9pg: { name: "Contribute · Review & submit", route: "/create", state: { "step": 4 }, position: { "x": 5760, "y": 6160 } },
    scr_ny4jka: { name: "Contribute · AI processing", route: "/create", state: { "step": 5 }, position: { "x": 7160, "y": 6160 } },
    scr_skwiv4: { name: "Contribute · Record created", route: "/create", state: { "step": 6 }, position: { "x": 8560, "y": 6160 } },
    scr_nxg8bn: { name: "Interview · Choose topic", route: "/virasat-interview", state: { "phase": "topic" }, position: { "x": 160, "y": 8140 } },
    scr_rpas94: { name: "Interview · Preparing questions", route: "/virasat-interview", state: { "phase": "generating" }, position: { "x": 1560, "y": 8140 } },
    scr_gzskwl: { name: "Interview · Record answer", route: "/virasat-interview", state: { "phase": "interview" }, position: { "x": 2960, "y": 8140 } },
    scr_3ojhgq: { name: "Interview · AI processing", route: "/virasat-interview", state: { "phase": "processing" }, position: { "x": 4360, "y": 8140 } },
    scr_dokh2y: { name: "Interview · Cultural record", route: "/virasat-interview", state: { "phase": "result" }, position: { "x": 5760, "y": 8140 } },
    scr_fiu961: { name: "Profile", route: "/profile/me", position: { "x": 160, "y": 10120 } },
    scr_ydhcem: { name: "Saved", route: "/saved", position: { "x": 1560, "y": 10120 } },
    scr_lvkkk6: { name: "Notifications", route: "/notifications", position: { "x": 2960, "y": 10120 } },
    scr_ihp1np: { name: "Verification queue", route: "/verification", position: { "x": 1560, "y": 12100 } },
    scr_1uvsez: { name: "Settings", route: "/settings", position: { "x": 160, "y": 12100 } }
  },
  sections: {
    sec_cgcvwa: { name: "Authentication", x: 0, y: 0, width: 2920, height: 1180 },
    sec_ufgh3j: { name: "Browse & Discover", x: 0, y: 1980, width: 4320, height: 1180 },
    sec_avwyi2: { name: "View Content", x: 0, y: 3960, width: 2920, height: 1180 },
    sec_wxjykx: { name: "Contribute Flow", x: 0, y: 5940, width: 9920, height: 1180 },
    sec_dyzoxw: { name: "Interview Flow", x: 0, y: 7920, width: 7120, height: 1180 },
    sec_coqga5: { name: "User Account", x: 0, y: 9900, width: 4320, height: 1180 },
    sec_dqpdg4: { name: "Admin & Settings", x: 0, y: 11880, width: 4320, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_cgcvwa", children: [
    { kind: "screen", id: "scr_lwx5em" },
    { kind: "screen", id: "scr_g025y7" }]
  },
  { kind: "section", id: "sec_ufgh3j", children: [
    { kind: "screen", id: "scr_o4s178" },
    { kind: "screen", id: "scr_mk1mmm" },
    { kind: "screen", id: "scr_rhze6o" }]
  },
  { kind: "section", id: "sec_avwyi2", children: [
    { kind: "screen", id: "scr_ghw24c" },
    { kind: "screen", id: "scr_vce1b0" }]
  },
  { kind: "section", id: "sec_wxjykx", children: [
    { kind: "screen", id: "scr_331075" },
    { kind: "screen", id: "scr_y24k4a" },
    { kind: "screen", id: "scr_lx7b41" },
    { kind: "screen", id: "scr_n9n4pl" },
    { kind: "screen", id: "scr_5dn9pg" },
    { kind: "screen", id: "scr_ny4jka" },
    { kind: "screen", id: "scr_skwiv4" }]
  },
  { kind: "section", id: "sec_dyzoxw", children: [
    { kind: "screen", id: "scr_nxg8bn" },
    { kind: "screen", id: "scr_rpas94" },
    { kind: "screen", id: "scr_gzskwl" },
    { kind: "screen", id: "scr_3ojhgq" },
    { kind: "screen", id: "scr_dokh2y" }]
  },
  { kind: "section", id: "sec_coqga5", children: [
    { kind: "screen", id: "scr_fiu961" },
    { kind: "screen", id: "scr_ydhcem" },
    { kind: "screen", id: "scr_lvkkk6" }]
  },
  { kind: "section", id: "sec_dqpdg4", children: [
    { kind: "screen", id: "scr_1uvsez" },
    { kind: "screen", id: "scr_ihp1np" },
    { kind: "screen", id: "scr_dwxiro" }]
  }]

};