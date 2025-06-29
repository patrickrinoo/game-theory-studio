---
description: Guidelines for implementing GET API routes in Next.js
globs: 
alwaysApply: false
---
# GET API Route Guidelines

Guidelines for implementing GET API routes in Next.js App Router:

Basic Structure. Note how we auto generate the response type for use on the client:

```typescript
import { NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { withAuth } from "@/utils/middleware";

// Notice how we infer the response type. We don't need to manually type it out
export type GetExampleResponse = Awaited<ReturnType<typeof getData>>;

// The middleware does the error handling and authentication for us already
export const GET = withEmailAccount(async () => {
  const emailAccountId = request.auth.emailAccountId;
  
  const result = getData({ email });
  return NextResponse.json(result);
});

async function getData({ email }: { email: string }) {
  const items = await prisma.example.findMany({
    where: { email },
  });

  return { items };
}
```

See [data-fetching.md](mdc:.roo/rules/data-fetching.md) as to how this would be then used on the client.

Key Requirements:

   - Always wrap the handler with `withAuth` or `withEmailAccount` for consistent error handling and authentication.
   - `withAuth` gets the user. `withEmailAccount` gets the currently active email account. A user can have multiple email accounts under it.
   - We don't need try/catch as `withAuth` and `withEmailAccount` handles that.
   - Infer and export response type as in the example.
   - Use Prisma for database queries.
   - Return responses using `NextResponse.json()`
