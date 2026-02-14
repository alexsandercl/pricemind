import Cropper from "react-easy-crop";
import { useCallback, useState } from "react";

type Props = {
  image: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export default function AvatarCropper({
  image,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<any>(null);

  const onCropComplete = useCallback(
    (_: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  async function handleSave() {
    const img = new Image();
    img.src = image;
    await new Promise((r) => (img.onload = r));

    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx || !croppedAreaPixels) return;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    );

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "avatar.png", {
        type: "image/png",
      });

      onConfirm(file);
    }, "image/png");
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-2xl p-6 w-[420px]">
        <h3 className="text-white text-lg mb-4">
          Ajustar foto
        </h3>

        <div className="relative w-full h-64 bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) =>
            setZoom(Number(e.target.value))
          }
          className="w-full mt-4"
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}