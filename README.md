Frontend de check-in con lectura QR y consulta al backend local.

El navegador envía el QR validado a `POST /api/checkin`. Next.js lo reenvía a
`POST http://localhost:3001/api/v1/checkin/validaciones` desde el computador donde corre el frontend.
Así el celular puede usar el enlace HTTPS del frontend sin acceder directamente al puerto 3001.

Para cambiar la dirección del backend, define `BACKEND_URL=http://localhost:3001`
en `.env.local` y reinicia Next.js. Esta variable se usa solo en el servidor.
Mantén ambos procesos funcionando. El contrato actual no requiere autenticación.

La consulta comprueba existencia y coincidencia de evento; no registra asistencia,
no detecta usos previos y no comprueba anulaciones ni horarios.

Pruebas (Node 22.19 o posterior):
`node --experimental-strip-types --test tests/*.test.mjs`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
