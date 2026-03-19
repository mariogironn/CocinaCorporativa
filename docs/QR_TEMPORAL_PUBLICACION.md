# Publicacion temporal de QR para menu del dia

Objetivo: permitir que empleados escaneen el QR desde celular mientras se despliega produccion.

## 1) Configurar URL publica temporal
1. Copiar `.env.example` a `.env.local`.
2. Definir `VITE_PUBLIC_APP_URL` con una URL publica accesible desde celular.

Ejemplo en `.env.local`:

```env
VITE_PUBLIC_APP_URL=https://abcd-1234.ngrok-free.app
```

## 2) Levantar frontend local en red
```bash
npm run dev -- --host
```

## 3) Exponer frontend con ngrok (opcion rapida)
```bash
ngrok http 5173
```

Usar la URL HTTPS que entrega ngrok como `VITE_PUBLIC_APP_URL`.

## 4) Reiniciar frontend
Luego de cambiar `.env.local`, reiniciar `npm run dev` para que tome la variable.

## 5) Flujo operativo diario
1. Cocina inicia sesion.
2. Cocina guarda menu normal y dieta.
3. En `Inicio`, usar boton `Imprimir QR`.
4. Empleados escanean QR y abren `menu-del-dia`.

## 6) Limitaciones de esta fase temporal
- URL cambia si ngrok se reinicia (plan gratis).
- Si PC de cocina se apaga, deja de funcionar.
- No hay envio automatico por WhatsApp API aun.

## 7) Paso definitivo (produccion)
- Publicar frontend + backend con dominio HTTPS fijo.
- Configurar `VITE_PUBLIC_APP_URL` al dominio final.
- Activar envio automatico por roles/celular (WhatsApp Business API).
