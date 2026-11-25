# Skills para acelerar sus pruebas

Estas carpetas son **skills**: instrucciones que Claude carga sola cuando le
pides algo que encaja con su descripcion. No hay que instalar nada: vienen en
el repositorio, asi que con clonarlo ya las tienen.

| Skill | Para que sirve |
|---|---|
| `pruebas-e2e` | Escribe un `.spec.js` de Playwright con page objects y fixtures, para lo que solo se puede verificar por la interfaz |
| `revisar-prueba` | Revisa una prueba ya escrita y busca las formas en que una prueba verde puede estar mintiendo |

Para las pruebas de componente e integracion con Karate, las skills estan en el
repositorio del **backend**.

## Como se usan

Basta con pedirlo en palabras. Los tres ejemplos:

> «Necesito una prueba E2E del flujo de checkout completo»

> «Agregame un page object para la pantalla de direcciones»

> «Revisa `tests/e2e/mi-checkout.spec.js` antes de que lo entregue»

Tambien se pueden invocar por nombre, con `/pruebas-e2e`.

## Lo que estas skills NO hacen

No generan cuarenta escenarios de una. Estan escritas a proposito para lo
contrario:

- **preguntan primero en que nivel va la prueba**, y te mandan a otra skill si
  te equivocaste de nivel;
- **se niegan a inventar un resultado esperado** que el contrato no defina: lo
  dejan anotado como pendiente y dirigido a quien lo resuelve;
- **colapsan a una tabla** lo que serian varios escenarios iguales con datos
  distintos;
- **te piden ejecutarla y despues romperla**, para que compruebes que puede
  fallar.

Una prueba que nunca viste fallar no sabes si verifica algo. Esa es la idea que
sostiene las tres.
