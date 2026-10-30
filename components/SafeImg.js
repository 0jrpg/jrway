'use client';

// <img> blindada: sem menu de contexto (salvar/copiar imagem), sem arrastar
// para fora e sem o toque-longo de salvar do celular (webkit-touch-callout).
// Aceita as mesmas props de um <img> comum.
export default function SafeImg(props) {
  return (
    <img
      {...props}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}
