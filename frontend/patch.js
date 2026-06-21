const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/bus/roles/coordinator-module.tsx');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { Input } from "@/components/ui/input";',
  `import { Input } from "@/components/ui/input";
import { RouteScreen } from "./RouteScreen";
import { StopScreen } from "./StopScreen";
import { BusAssignmentScreen } from "./BusAssignmentScreen";
import { DriverAssignmentScreen } from "./DriverAssignmentScreen";`
);

code = code.replace(
  `  if (["crd-assign-driver", "crd-assign-bus", "crd-routes", "crd-stops", "crd-by-university"].includes(activeId)) {
    const title =
      activeId === "crd-by-university" ? "Điều phối theo trường"
      : activeId === "crd-routes" ? "Tuyến đường"
      : activeId === "crd-stops" ? "Trạm dừng"
      : activeId === "crd-assign-bus" ? "Phân công xe bus"
      : "Phân công tài xế";
    return <Unavailable title={title} />;
  }`,
  `  if (activeId === "crd-routes") return <RouteScreen />;
  if (activeId === "crd-stops") return <StopScreen />;
  if (activeId === "crd-assign-bus") return <BusAssignmentScreen />;
  if (activeId === "crd-assign-driver") return <DriverAssignmentScreen />;

  if (["crd-by-university"].includes(activeId)) {
    return <Unavailable title="Điều phối theo trường" />;
  }`
);

fs.writeFileSync(file, code);
console.log('Patched coordinator-module.tsx successfully');
