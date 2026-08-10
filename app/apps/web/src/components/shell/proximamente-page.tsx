export function ProximamentePage({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="text-sm text-muted-foreground">
        Esta pantalla todavía no está construida. Se suma en una próxima etapa del proyecto.
      </p>
    </div>
  );
}
