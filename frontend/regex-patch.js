const fs = require('fs');
let code = fs.readFileSync('src/components/bus/roles/coordinator-module.tsx', 'utf8');

// Add imports
code = code.replace(
  'import { Input } from "@/components/ui/input";',
  'import { Input } from "@/components/ui/input";\nimport { RouteScreen } from "./RouteScreen";\nimport { StopScreen } from "./StopScreen";\nimport { BusAssignmentScreen } from "./BusAssignmentScreen";\nimport { DriverAssignmentScreen } from "./DriverAssignmentScreen";'
);

const newFunction = `export function CoordinatorModule({ activeId }: Props) {
  if (activeId === "crd-dashboard") return <CoordinatorDashboard />;
  if (activeId === "crd-live") return <LiveFleetScreen />;
  if (activeId === "crd-schedule") return <ScheduleScreen />;
  if (activeId === "crd-feedback") return <FeedbackQueue />;
  if (activeId === "crd-notify") return <NotifyScreen />;

  if (activeId === "crd-routes") return <RouteScreen />;
  if (activeId === "crd-stops") return <StopScreen />;
  if (activeId === "crd-assign-bus") return <BusAssignmentScreen />;
  if (activeId === "crd-assign-driver") return <DriverAssignmentScreen />;

  if (["crd-by-university"].includes(activeId)) {
    return <Unavailable title="Điều phối theo trường" />;
  }
  return <CoordinatorDashboard />;
}`;

// Replace the entire function using regex to avoid line ending issues
code = code.replace(/export function CoordinatorModule.*?return <CoordinatorDashboard \/>;\r?\n}/s, newFunction);

fs.writeFileSync('src/components/bus/roles/coordinator-module.tsx', code);
console.log('Regex patch successful!');
