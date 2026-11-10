import React from "react";

import { LunaSettings, LunaSwitchSetting } from "@luna/ui";
import { trace } from ".";

export const Settings = () => {
  const [checked, setChecked] = React.useState(false);
  const onChange = React.useCallback((_: React.ChangeEvent<HTMLInputElement>, checked?: boolean) => {
    const enabled = checked ?? false;
    trace.msg.log(`AVB-001: local connection test is ${enabled ? "ON" : "OFF"}. Album search is not implemented yet.`);
    setChecked(enabled);
  }, []);
  return (
    <LunaSettings>
      <LunaSwitchSetting
        title="Album Version Browser — AVB-001"
        checked={checked}
        desc="Local connection test only. Toggle to show an AVB-001 message. This setting is not saved."
        onChange={onChange}
      />
    </LunaSettings>
  );
};
