import { Tracer } from "@luna/core";

export const { trace } = Tracer("[AlbumVersionBrowser]");

trace.msg.log("Album Version Browser: local build AVB-002 loaded.");

export { Settings } from "./Settings";
