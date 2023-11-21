require("dotenv").config();
const path = require("path");

module.exports = {
  packagerConfig: {
    icon: "public/quicksnap-logo",
    arch: ["x64", "arm64"], // Specify both architectures for universal build
    osxSign: {
      identity: process.env.CSC_NAME,
      "hardened-runtime": true,
      entitlements: path.join(__dirname, "entitlements.plist"),
      "entitlements-inherit": path.join(
        __dirname,
        "entitlements-inherit.plist"
      ),
      "signature-flags": "library",
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      arch: ["x64", "arm64"], // Include both architectures for macOS build
    },
    {
      name: "@electron-forge/maker-deb",
      config: {},
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {},
      platforms: ["darwin"],
      arch: ["x64", "arm64"], // Include both architectures for macOS build
    },
  ],
};
