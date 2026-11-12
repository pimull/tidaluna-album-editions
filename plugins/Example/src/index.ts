import { Tracer } from "@luna/core";

export const { trace } = Tracer("[AlbumVersionBrowser]");

trace.msg.log("Album Version Browser: local build AVB-004 loaded.");

export { Settings } from "./Settings";
export { unloads } from "./searchObservation";
