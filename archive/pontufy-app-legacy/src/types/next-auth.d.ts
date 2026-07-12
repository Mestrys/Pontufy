import type { Role } from '@/lib/roles';

declare module 'next-auth' {
  interface User {
    role: Role;
    mustChangePassword: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      mustChangePassword: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    mustChangePassword: boolean;
  }
}
