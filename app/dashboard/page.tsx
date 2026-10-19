import { Suspense } from "react";
import OwnerDashboardPage from "@/components/dashboard/OwnerDashboardPage";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <OwnerDashboardPage />
        </Suspense>
    );
}
