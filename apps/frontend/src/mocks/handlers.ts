import { authHandlers } from "./handlers/auth.mocks";
import { adminHandlers } from "./handlers/admin.mocks";
import { employeeHandlers } from "./handlers/employee.mocks";

export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  ...employeeHandlers,
];
