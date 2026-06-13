import { useMemo } from "react";
import qrcode from "qrcode-generator";

interface QRProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 256 }: QRProps) {
  const modules = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();

    const count = qr.getModuleCount();
    const cellSize = size / count;
    const cells: Array<{ key: string; x: number; y: number }> = [];

    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) {
          cells.push({
            key: `${row}-${col}`,
            x: col * cellSize,
            y: row * cellSize,
          });
        }
      }
    }

    return { count, cellSize, cells };
  }, [size, value]);

  return (
    <svg
      aria-label="QR code"
      height={size}
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <rect fill="#ffffff" height={size} width={size} />
      {modules.cells.map(({ key, x, y }) => (
        <rect
          key={key}
          fill="#000000"
          height={modules.cellSize}
          width={modules.cellSize}
          x={x}
          y={y}
        />
      ))}
    </svg>
  );
}