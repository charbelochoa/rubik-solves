# Rubik Atlas

Guía estática en español con 41 casos F2L, 57 OLL y 21 PLL. [Abrir Rubik Atlas](https://charbelochoa.github.io/rubik-solves/)

## Usar el laboratorio

Parte de la cruz inferior resuelta con sus aristas alineadas. Para copiar un cubo físico, usa los centros del editor como referencia. La orientación inicial es blanco abajo, azul al frente y rojo a la derecha.

Puedes pintar las pegatinas, girar caras, aplicar una secuencia en notación Singmaster o cargar un caso de la biblioteca. **Identificar caso** valida los colores y las piezas, reconoce la próxima etapa y propone la preparación y el algoritmo. Avanza giro a giro o reproduce la secuencia. Para continuar con tu posición, vuelve a identificarla después de cada algoritmo.

La [página de recursos](https://charbelochoa.github.io/rubik-solves/recursos.html) contiene las imágenes y los algoritmos en HTML y admite impresión.

## Desarrollo

Sirve la raíz con `python -m http.server 8000` y abre [localhost](http://localhost:8000/). El navegador carga módulos JavaScript y recursos del propio sitio.

El catálogo está en `data/cases.json`. Ejecuta `node tools/build.mjs` después de modificar el catálogo o las plantillas. El comando regenera las tres páginas y los diagramas OLL y PLL. Ejecuta `node tools/check.mjs` para verificar el reconocimiento y la validez de las soluciones.

GitHub Pages publica la raíz de `main`. Los archivos generados se incluyen en el repositorio. [Fuentes y licencias](CREDITOS.md)
