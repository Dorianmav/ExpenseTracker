const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">91.165.223.157</domain>
        <domain includeSubdomains="true">192.168.1.14</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>`;

const withNetworkSecurityConfig = (config) => {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const xmlPath = path.join(projectRoot, 'android/app/src/main/res/xml');

      if (!fs.existsSync(xmlPath)) {
        fs.mkdirSync(xmlPath, { recursive: true });
      }

      fs.writeFileSync(path.join(xmlPath, 'network_security_config.xml'), networkSecurityConfig);

      return modConfig;
    },
  ]);

  return withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);

    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return modConfig;
  });
};

module.exports = withNetworkSecurityConfig;
