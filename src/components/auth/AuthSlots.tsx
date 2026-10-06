"use client";

import dynamic from "next/dynamic";

// Код Clerk грузится отдельными фрагментами и только когда слой входа включён (компоненты рендерятся по флагу).
export const AuthControlsSlot = dynamic(() => import("./AuthControls"), { ssr: false });
export const CloudSyncSlot = dynamic(() => import("./CloudSync"), { ssr: false });
