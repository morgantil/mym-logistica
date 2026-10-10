// Mejora de seguridad 2026-10-10 (ver REPORTE_SEGURIDAD_Y_ROBUSTEZ.md): antes
// no había ningún límite de tamaño en los archivos subidos (Importar Excel,
// Combustible y Peajes), lo que sumado a vulnerabilidades conocidas de
// `multer` (DoS por parsing) dejaba la API expuesta a un archivo gigante o
// malformado colgando un request. 20MB es generoso para un Excel real (los
// archivos reales usados en este proyecto pesan unos pocos MB como mucho)
// pero acota el peor caso.
export const LIMITES_ARCHIVO_EXCEL = {
  fileSize: 20 * 1024 * 1024,
  files: 1,
};
