import { authHandlers } from "./handlers/auth.mocks";
import { adminHandlers } from "./handlers/admin.mocks";
import { employeeHandlers } from "./handlers/employee.mocks";
import { citizenHandlers } from "./handlers/citizen.mocks";

export const handlers = [
  ...authHandlers,
  ...adminHandlers,
  ...employeeHandlers,
  ...citizenHandlers,
];
