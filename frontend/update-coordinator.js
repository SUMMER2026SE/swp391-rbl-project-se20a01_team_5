const fs = require('fs');
let code = fs.readFileSync('src/components/bus/roles/coordinator-module.tsx', 'utf8');

// Add imports
code = code.replace(
  'import { Input } from "@/components/ui/input";',
  'import { Input } from "@/components/ui/input";\nimport { RouteScreen } from "./RouteScreen";\nimport { StopScreen } from "./StopScreen";\nimport { BusAssignmentScreen } from "./BusAssignmentScreen";\nimport { DriverAssignmentScreen } from "./DriverAssignmentScreen";'
);

// Update CoordinatorModule routing
code = code.replace(
  '  if (["crd-assign-driver", "crd-assign-bus", "crd-routes", "crd-stops", "crd-by-university"].includes(activeId)) {\n    const title =\n      activeId === "crd-by-university" ? "Điều phối theo trường"\n      : activeId === "crd-routes" ? "Tuyến đường"\n      : activeId === "crd-stops" ? "Trạm dừng"\n      : activeId === "crd-assign-bus" ? "Phân công xe bus"\n      : "Phân công tài xế";\n    return <Unavailable title={title} />;\n  }',
  '  if (activeId === "crd-routes") return <RouteScreen />;\n  if (activeId === "crd-stops") return <StopScreen />;\n  if (activeId === "crd-assign-bus") return <BusAssignmentScreen />;\n  if (activeId === "crd-assign-driver") return <DriverAssignmentScreen />;\n\n  if (["crd-by-university"].includes(activeId)) {\n    return <Unavailable title="Điều phối theo trường" />;\n  }'
);

fs.writeFileSync('src/components/bus/roles/coordinator-module.tsx', code);
console.log('Updated coordinator-module.tsx');
