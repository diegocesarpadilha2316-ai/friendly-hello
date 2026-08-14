import { useCallback, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/core/components/ui-kit";
import type { VisionUpload } from "../types";

interface Props {
  uploads: readonly VisionUpload[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

export function VisionUploader({ uploads, onAdd, onRemove, onClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) onAdd(e.dataTransfer.files);
    },
    [disabled, onAdd],
  );

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Enviar fotos do ambiente"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-primary/80 bg-primary/10"
            : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="rounded-xl bg-primary/15 p-3 text-primary shadow-[0_0_40px_-8px_hsl(var(--primary)/0.55)]">
            <UploadCloud className="h-7 w-7" />
          </div>
          <div>
            <div className="text-base font-semibold">Envie fotos do ambiente</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Arraste JPG, PNG ou WEBP aqui — ou clique para escolher. Até 12 arquivos, 20MB cada.
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={disabled}
            >
              <ImagePlus className="mr-2 h-4 w-4" /> Escolher arquivos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                cameraRef.current?.click();
              }}
              disabled={disabled}
            >
              <Camera className="mr-2 h-4 w-4" /> Câmera / Celular
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAdd(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept={ACCEPT}
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAdd(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {uploads.length} foto(s) —{" "}
              {(uploads.reduce((s, u) => s + u.sizeBytes, 0) / 1024 / 1024).toFixed(1)} MB
            </div>
            <Button variant="ghost" size="sm" onClick={onClear} disabled={disabled}>
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.previewUrl} alt={u.name} className="aspect-[4/3] w-full object-cover" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-2 text-xs">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="text-muted-foreground">
                    {u.width && u.height ? `${u.width}×${u.height} · ` : ""}
                    {(u.sizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${u.name}`}
                  onClick={() => onRemove(u.id)}
                  disabled={disabled}
                  className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
