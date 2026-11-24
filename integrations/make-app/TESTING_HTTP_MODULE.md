# Probar Truslay en Make con el módulo HTTP (sin Custom App)

Guía para Luis. Objetivo: comprobar **hoy** que un escenario de Make puede pedir un
veredicto a Truslay y leerlo, usando solo piezas disponibles en el plan gratuito:
el módulo nativo **HTTP → Make a request** llamando al webhook del workflow
"Truslay SDK" en `n8n.truslay.com`.

No hace falta registrar la Custom App, ni `@makehq/sdk`, ni permisos de Apps
Editor. La app `truslay` del marketplace sigue pendiente y esta prueba no la
sustituye: demuestra el contrato HTTP, no la app.

---

## Antes de empezar: dos hechos verificados

**1. El path `/webhook/truslay-evaluate` no está sirviendo hoy.**
Probado el 2026-11-24 a las 17:07 UTC con el body de esta guía:

```
POST https://n8n.truslay.com/webhook/truslay-evaluate  ->  404
{"code":404,"message":"The requested webhook \"POST truslay-evaluate\" is not registered.",
 "hint":"The workflow must be active for a production URL to run successfully.
        You can activate the workflow using the toggle in the top-right of the editor."}
```

n8n devuelve ese 404 tanto si el path no existe como si el workflow está
**inactivo**. Por eso el Paso 0 es obligatorio: la URL se copia del nodo Webhook,
no se escribe a mano. (Un `OPTIONS` a esa URL responde `204`, pero es solo el CORS
de n8n; no prueba que el webhook exista.)

**2. Si el Webhook responde `Immediately`, el body no traerá el veredicto.**
El valor por defecto de n8n es `Respond: Immediately`, que contesta
`{"message":"Workflow was started"}` antes de ejecutar el resto. Para leer
`truslay_verdict` hay que usar `Respond: When Last Node Finishes` (o un nodo
**Respond to Webhook**). Está detallado en el Paso 0.3.

---

## Paso 0 — Preparar el webhook en n8n

### 0.1 Abrir el workflow

1. Entra en `https://n8n.truslay.com` con la cuenta del proyecto.
2. En el menú lateral, **Overview / Workflows** → abre el workflow llamado
   **Truslay SDK** (el que expone el webhook de evaluación).
3. Localiza el nodo **Webhook** (icono de rayo, el primero a la izquierda).

### 0.2 Copiar la Production URL

1. Haz clic en el nodo **Webhook**.
2. En el panel derecho, pestaña **Parameters**, revisa:
   - **HTTP Method**: `POST`
   - **Path**: el valor real (p. ej. `truslay-evaluate`, `truslay-sdk`, o un UUID).
3. En la parte superior del panel del nodo, en **Webhook URLs**, copia la
   **Production URL**. Tendrá la forma:

   ```
   https://n8n.truslay.com/webhook/<path-real>
   ```

   > No uses la **Test URL** (`/webhook-test/<path>`) para la prueba de Make: solo
   > escucha mientras pulsas **Listen for test event** / **Execute workflow**, y
   > caduca al terminar. Si quieres usarla igualmente, haz clic en *Listen* y lanza
   > Make en los siguientes segundos.

4. Activa el workflow con el **toggle de la esquina superior derecha** (debe
   quedar en azul/”Active”). Sin esto, la Production URL siempre da 404.

Comprobación rápida desde una terminal (opcional, no crea nada en Make):

```bash
curl -i -X POST "https://n8n.truslay.com/webhook/<path-real>" \
  -H "Content-Type: application/json" \
  -d '{"intent":"checkout","target":"https://tienda-ejemplo.truslay.com/checkout","payload":{"cart_id":"ORD-98765","amount_usd":99.99}}'
```

Esperado: `200` y un JSON con `truslay_verdict`. Si sigue el 404 “not registered”,
el workflow no está activo o el path copiado no es el del nodo.

### 0.3 Asegurar que el webhook devuelve el veredicto

En el nodo **Webhook** → **Parameters** → **Respond**:

| Opción | Qué devuelve | ¿Sirve para esta prueba? |
| --- | --- | --- |
| `Immediately` (default) | `{"message":"Workflow was started"}` | ❌ No: no hay veredicto |
| `When Last Node Finishes` | Salida del último nodo | ✅ Sí |
| `Using 'Respond to Webhook' Node` | Lo que defina ese nodo | ✅ Sí, si el workflow lo tiene |

Si eliges **When Last Node Finishes**, pon **Response Data** en
`First Entry JSON` (objeto plano; es lo más fácil de mapear en Make). Con
`All Entries` la respuesta es un array y en Make el campo queda como
`body[0].truslay_verdict` o `0.truslay_verdict`.

Si el workflow termina en un nodo **Respond to Webhook**, revisa que su
**Respond With** sea `JSON` y que el body incluya las tres claves
`truslay_verdict`, `truslay_reason` y `truslay_environment`.

### 0.4 Contrato del body que enviaremos

```json
{
  "intent": "checkout",
  "target": "https://tienda-ejemplo.truslay.com/checkout",
  "payload": { "cart_id": "ORD-98765", "amount_usd": 99.99 }
}
```

`payload` va **anidado**. Si el workflow espera `cart_id` y `amount_usd` en la
raíz, o espera otro nombre (`data`, `action`), ajústalo en el nodo Webhook/Code
antes de la prueba; el `curl` del Paso 0.2 sirve para confirmarlo sin tocar Make.

---

## Paso 1 — Crear el escenario en Make

1. Entra en `https://www.make.com` y crea la cuenta gratuita (o inicia sesión).
   El plan Free incluye 1.000 operaciones/mes, 2 escenarios activos y el módulo
   HTTP; las Custom Apps sí requieren plan de pago, y por eso probamos por HTTP.
2. En el menú lateral izquierdo, **Scenarios**.
3. Arriba a la derecha, **+ Create a new scenario**. Se abre un lienzo vacío con
   un círculo **+** grande en el centro y el nombre “New scenario” editable
   arriba a la izquierda.
4. Ponle nombre: haz clic en “New scenario” y escribe
   `Truslay · HTTP smoke test`.

> En el plan Free el escenario puede guardarse y ejecutarse manualmente sin
> programarlo. No actives **Scheduling**; para esta prueba sobra y consume ops.

---

## Paso 2 — Agregar el módulo HTTP

1. Haz clic en el círculo **+** del centro del lienzo.
2. En el panel **Add a module** escribe `HTTP` en el buscador.
3. En **Apps**, elige **HTTP** (icono de globo terráqueo, sin logo de terceros).
4. Se listan sus módulos. Elige **Make a request** (no “Make an OAuth 2.0
   request” ni “Make an API Key Auth request”).
5. El módulo aparece en el lienzo y su panel de configuración se abre a la
   derecha.

Esquema de lo que ves (no es una captura real, es la disposición de campos):

```
┌─ HTTP · Make a request ─────────────────────────────┐
│ Connection (optional)        [ None            ▾ ]  │
│ URL                          [ https://…          ] │
│ Method                       [ GET             ▾ ]  │
│ Headers                      [ Add item ]           │
│ Body type                    [ None            ▾ ]  │
│ Parse response               [ Yes             ▾ ]  │
└─────────────────────────────────────────────────────┘
```

---

## Paso 3 — Configurar la petición

Completa los campos en este orden:

| Campo | Valor |
| --- | --- |
| **Connection** | `None` (sandbox no pide credenciales) |
| **URL** | `https://n8n.truslay.com/webhook/<path-real>` del Paso 0.2 |
| **Method** | `POST` |
| **Headers** | Vacío, o un item `Content-Type` = `application/json` (ver nota) |
| **Body type** | `Raw` |
| **Content type** | `JSON` / `application/json` |
| **Request content** | El JSON del Paso 0.4, tal cual |
| **Parse response** | `Yes` |

Notas de la UI, porque Make cambió etiquetas entre versiones:

- Si ves **Body content type** en lugar de **Body type**, elige
  `application/JSON` y escribe el JSON en el campo de contenido que aparece. Es
  el equivalente actual de `Raw` + `JSON`.
- **Content-Type no hace falta escribirlo a mano**: al elegir JSON en el body,
  Make lo pone solo. Si lo agregas en **Headers** además, no rompe nada, pero
  evita duplicarlo con valores distintos.
- **Request content** debe ser JSON válido, sin comentarios ni comas finales.
  Make no valida el JSON al escribir; el error aparece al ejecutar (`400`).
- `Parse response: Yes` es lo que convierte el body en campos mapeables
  (`truslay_verdict`…). Con `No`, todo llega como un string en `body`.
- No agregues `Authorization` en sandbox. En live sería
  `Authorization: Bearer <API key>`, pero este webhook de n8n no es la ruta
  `/api/guardian/evaluate` del SDK; no mezcles ambos contratos.

Contenido exacto del campo **Request content**:

```json
{
  "intent": "checkout",
  "target": "https://tienda-ejemplo.truslay.com/checkout",
  "payload": { "cart_id": "ORD-98765", "amount_usd": 99.99 }
}
```

Pulsa **OK** para cerrar el panel y guardar el módulo. Make guarda solo; si
quieres forzarlo, **Save** (disquete) abajo.

---

## Paso 4 — Ejecutar una vez

1. En la barra inferior del editor, pulsa **Run once** (icono ▶, a la izquierda;
   en algunas versiones está arriba a la derecha como **Run once**).
2. El módulo se marca con un spinner y luego con un número (operaciones
   consumidas, normalmente `1`).
3. Abajo aparece el aviso **Scenario ran successfully** o un error en rojo sobre
   el módulo.

El escenario no necesita un trigger para esta prueba: **Run once** ejecuta
directamente el módulo HTTP.

---

## Paso 5 — Verificar la respuesta

1. Haz clic sobre el módulo **HTTP** ya ejecutado. Se abre su panel a la derecha
   con las pestañas **INPUT** / **OUTPUT** (y **Text** / **JSON** para cambiar la
   vista).
2. En **OUTPUT** verás **Bundle 1**. Contenido esperado, según la versión:

   ```
   statusCode: 200
   headers: { content-type: application/json, … }
   body: { … }            ← si Parse response = No, esto es un string
   ```

   Con `Parse response: Yes`, los campos del JSON pueden aparecer en la raíz del
   bundle (`truslay_verdict`, `truslay_reason`, `truslay_environment`) o dentro de
   `body`; expande el nodo `body` si lo ves colapsado.

3. Debe contener exactamente estos valores:

   ```json
   {
     "truslay_verdict": "ALLOW",
     "truslay_reason": "sandbox_mode",
     "truslay_environment": "sandbox"
   }
   ```

   Puede venir acompañado de `truslay_shield`, `truslay_latency_ms` y
   `truslay_audit_id` (este último ausente en sandbox). Si llega un array,
   revisa `body[0]` / `0`.

4. Verifica también `statusCode: 200`. Un `200` con
   `{"message":"Workflow was started"}` significa que el Webhook sigue en
   `Respond: Immediately` (Paso 0.3), no que Truslay haya fallado.

### Checklist de la prueba

- [ ] Workflow **Truslay SDK** activo (toggle azul).
- [ ] URL copiada de **Webhook URLs → Production URL**, no escrita a mano.
- [ ] `Method: POST`, `Body type: Raw`, `Content type: JSON`.
- [ ] `Parse response: Yes`.
- [ ] `statusCode: 200`.
- [ ] `truslay_verdict: ALLOW`, `truslay_reason: sandbox_mode`,
      `truslay_environment: sandbox`.
- [ ] Ejecución visible en n8n → **Executions** (confirma que el workflow corrió).

---

## Paso 6 — Enrutar el veredicto con un Router

Objetivo: que `ALLOW` continúe con la acción real (email, base de datos…) y que
`BLOCK` dispare una alerta en Slack o email. Esto es lo que hará la Custom App
cuando exista; aquí se reproduce con módulos nativos.

```
[ HTTP · Make a request ]
          │
     [ Router ]
       ├── Route 1  verdict = ALLOW  → [ Email · Send an email ]  /  [ Google Sheets · Add a row ]
       ├── Route 2  verdict = BLOCK  → [ Slack · Send a Message ]  /  [ Email · Send an email ]
       └── Fallback (opcional)       → [ Slack / Email ]   (REVIEW o veredicto ausente)
```

### 6.1 Agregar el Router

1. Pasa el ratón por el borde derecho del módulo **HTTP**: aparece un **+**
   pequeño. Haz clic ahí (o clic derecho sobre el módulo → **Add module**).
2. En el buscador escribe `Router`. Elige el que está bajo **Flow Control**
   (módulo **Router**), no un router de una app concreta.
3. El Router aparece con **una ruta por defecto** (una línea de salida). Las
   rutas del Router **no son excluyentes**: todas las que cumplan su filtro se
   ejecutan en la misma pasada. Por eso los filtros deben ser mutuamente
   excluyentes y el fallback debe cubrir lo que no sea `ALLOW`.

### 6.2 Route 1 — `ALLOW` continúa

1. Haz clic en la **línea de la primera ruta** (o en el icono de filtro que
   aparece al pasar el ratón) → **Set up a filter**.
2. Configura la condición:
   - **Condition**: el campo del HTTP que trae el veredicto. Si `Parse response:
     Yes` lo expuso en la raíz del bundle, es `truslay_verdict`; si quedó dentro
     del body, es `body.truslay_verdict`. Usa el **panel de mapeo** (clic en el
     campo) para insertar el token real en lugar de escribirlo a mano.
   - **Operator**: `Equal to` (texto).
   - **Value**: `ALLOW`.
   - **Label**: `verdict is ALLOW`.
3. Después de esa ruta, agrega el módulo que representa “la acción real”.
   Ejemplos: **Email → Send an email**, **Gmail → Send an email**,
   **Google Sheets → Add a row**, **Airtable → Create a record** o tu base de
   datos. En esta prueba basta un email a tu propia cuenta o una fila en una
   hoja; lo importante es que **solo** se ejecute en esta rama.

### 6.3 Route 2 — `BLOCK` alerta

1. Agrega una segunda ruta: clic en el **+** del Router (o **Add route**, según
   la versión).
2. Filtro: el mismo campo del veredicto, `Equal to` `BLOCK`, label
   `verdict is BLOCK`.
3. Agrega el módulo de alerta: **Slack → Send a Message** (a un canal tipo
   `#truslay-alerts`) o **Email → Send an email**.
4. Mensaje sugerido, insertando cada valor desde el panel de mapeo (no copies
   los `{{…}}` tal cual):

   ```
   🛑 Truslay blocked an action
   verdict:     <truslay_verdict>
   reason:      <truslay_reason>
   environment: <truslay_environment>
   intent:      checkout
   target:      https://tienda-ejemplo.truslay.com/checkout
   ```

   Si el workflow devuelve `truslay_audit_id`, inclúyelo: es lo que permite
   correlacionar la alerta con la ejecución en n8n.

### 6.4 `REVIEW` y fallback

El SDK puede devolver `REVIEW`, que **no** debe continuar. Dos opciones:

- Una tercera ruta con `Equal to` `REVIEW` que apunte a la misma alerta.
- O activar el **Fallback** del Router (icono de engranaje del Router →
  **Fallback**) y conectar ahí la alerta. El fallback se ejecuta cuando ninguna
  ruta coincide, así que cubre `REVIEW`, valores inesperados y respuestas sin
  veredicto.

Usa el fallback: es el comportamiento *fail-closed* que tendrá la Custom App. Si
el veredicto no llega, se alerta; nunca se continúa en silencio.

### 6.5 Probar las dos ramas

El sandbox siempre devuelve `ALLOW`, así que la rama `BLOCK` no se ve en la
primera ejecución:

1. **Run once**. Solo debe ejecutarse la Route 1; el módulo de Slack/email de la
   Route 2 queda sin ejecutar (gris, sin número).
2. Para ver la alerta: cambia temporalmente el filtro de la Route 2 a
   `Equal to` `ALLOW`, **Run once**, confirma que llega el mensaje, y devuélvelo a
   `BLOCK`.
3. Alternativa sin tocar filtros: inserta un módulo **Tools → Set variable** antes
   del Router con `verdict = BLOCK` solo para la prueba, y retíralo después.
4. Revisa **History** del escenario: en cada ejecución debe aparecer una sola
   rama, y el número de operaciones debe ser HTTP + módulo de destino.

---

## Problemas frecuentes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `404` con `"The requested webhook \"POST <path>\" is not registered"` | Workflow inactivo o path distinto | Activa el toggle y copia la Production URL del nodo |
| `200` con `{"message":"Workflow was started"}` | `Respond: Immediately` | Cambia a `When Last Node Finishes` o usa Respond to Webhook |
| `200` sin `truslay_verdict` | El último nodo no devuelve el veredicto | Revisa el nodo final del workflow; usa `First Entry JSON` |
| `401` / `403` | El webhook tiene auth (Basic/Header/JWT) | Añade en **Headers** lo que pida el nodo Webhook, o desactiva auth para la prueba |
| `400` / `422` | Body no coincide con lo que espera el workflow | Ajusta `payload` anidado vs raíz; valida el JSON con el `curl` del Paso 0.2 |
| `Failed to parse response` en Make | `Parse response: Yes` con body no-JSON | Deja `Parse response: No` y lee `body` como texto |
| No hay salida y el módulo queda girando | Webhook `When Last Node Finishes` con workflow lento | Sube **Timeout** del módulo (p. ej. 60 s) |
| Error de certificado | Certificado inválido en el host | No lo desactives; corrige el certificado en n8n |

---

## Sobre las capturas de pantalla

No se incluyen capturas reales de Make en este archivo: no hay una sesión de Make
disponible desde este repositorio, y una imagen generada no sería la UI real.
Los esquemas de arriba describen la disposición exacta de los campos. Si quieres
adjuntarlas, captura estas tres y guárdalas en `integrations/make-app/img/`:

1. Lienzo con el módulo HTTP seleccionado y el panel de configuración completo.
2. Panel **OUTPUT → Bundle 1** con `statusCode`, `body` y `truslay_verdict`.
3. n8n → **Executions** con la ejecución correspondiente al POST.

Y enlázalas aquí con `![...](img/archivo.png)`.
