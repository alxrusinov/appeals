import { authHandlers } from './handlers/auth.mocks';
import { adminHandlers } from './handlers/admin.mocks';

export const handlers = [
    ...authHandlers,
    ...adminHandlers
];
